"""
Upload stage — exchanges OAuth refresh tokens and uploads each channel's
short to YouTube using the resumable upload API.

Usage:
  python src/scripts/upload_all.py --channel ch1
  python src/scripts/upload_all.py --all

Reads  : out/{channel_id}/manifest.json  (title, description, tags)
         out/{channel_id}/short.mp4

Env vars (one set per channel, N = 1-based alphabetical config index):
  YT_CH{N}_CLIENT_ID
  YT_CH{N}_CLIENT_SECRET
  YT_CH{N}_REFRESH_TOKEN

No google-api-python-client / google-auth — pure requests.
"""

import argparse
import glob
import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

TOKEN_URL  = "https://oauth2.googleapis.com/token"
UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"


# ── Channel → env-var index ───────────────────────────────────────────────────

def _channel_env_index(channel_id: str) -> int:
    """Returns 1-based index of channel_id among sorted channel configs."""
    configs = sorted(glob.glob("configs/channels/*.json"))
    for i, path in enumerate(configs, start=1):
        with open(path) as f:
            cfg = json.load(f)
        if cfg["id"] == channel_id:
            return i
    raise ValueError(f"Unknown channel: {channel_id}")


def load_all_channel_ids() -> list:
    """Returns channel IDs in alphabetical config-file order."""
    paths = sorted(glob.glob("configs/channels/*.json"))
    if not paths:
        raise FileNotFoundError("No channel configs found in configs/channels/*.json")
    ids = []
    for p in paths:
        with open(p) as f:
            cfg = json.load(f)
        ids.append(cfg["id"])
    return ids


# ── OAuth token exchange ─────────────────────────────────────────────────────

def _get_access_token(channel_id: str) -> str:
    n = _channel_env_index(channel_id)
    client_id     = os.environ[f"YT_CH{n}_CLIENT_ID"]
    client_secret = os.environ[f"YT_CH{n}_CLIENT_SECRET"]
    refresh_token = os.environ[f"YT_CH{n}_REFRESH_TOKEN"]

    resp = requests.post(
        TOKEN_URL,
        data={
            "client_id":     client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type":    "refresh_token",
        },
        timeout=30,
    )
    if not resp.ok:
        raise RuntimeError(
            f"Token exchange failed for {channel_id} "
            f"(HTTP {resp.status_code}): {resp.text}"
        )
    return resp.json()["access_token"]


# ── Resumable upload ──────────────────────────────────────────────────────────

def _start_resumable_upload(access_token: str, metadata: dict, file_size: int) -> str:
    """Initiates a resumable upload session. Returns the upload URI."""
    resp = requests.post(
        UPLOAD_URL,
        headers={
            "Authorization":           f"Bearer {access_token}",
            "Content-Type":            "application/json; charset=UTF-8",
            "X-Upload-Content-Type":   "video/mp4",
            "X-Upload-Content-Length": str(file_size),
        },
        params={
            "uploadType": "resumable",
            "part":       "snippet,status",
        },
        json=metadata,
        timeout=30,
    )
    if not resp.ok:
        raise RuntimeError(
            f"Failed to initiate upload (HTTP {resp.status_code}): {resp.text}"
        )
    upload_uri = resp.headers.get("Location")
    if not upload_uri:
        raise RuntimeError(
            f"No Location header in upload initiation response: {resp.headers}"
        )
    return upload_uri


def _upload_file(upload_uri: str, video_path: Path) -> str:
    """Streams the MP4 to the resumable URI. Returns the YouTube video ID."""
    file_size = video_path.stat().st_size
    with open(video_path, "rb") as fh:
        resp = requests.put(
            upload_uri,
            data=fh,
            headers={
                "Content-Type":   "video/mp4",
                "Content-Length": str(file_size),
            },
            timeout=600,  # 10 min — large renders may be 50–200 MB
        )
    if not resp.ok:
        raise RuntimeError(
            f"Upload failed (HTTP {resp.status_code}): {resp.text}"
        )
    video_id = resp.json().get("id")
    if not video_id:
        raise RuntimeError(f"No video ID in upload response: {resp.text}")
    return video_id


# ── Per-channel upload ───────────────────────────────────────────────────────────

def upload_channel(channel_id: str) -> None:
    manifest_path = Path("out") / channel_id / "manifest.json"
    video_path    = Path("out") / channel_id / "short.mp4"

    if not manifest_path.exists():
        raise FileNotFoundError(f"Manifest not found: {manifest_path}")
    if not video_path.exists():
        raise FileNotFoundError(f"Video not found: {video_path}")

    with open(manifest_path) as f:
        manifest = json.load(f)

    title       = manifest.get("title", manifest.get("topic", "Interesting Short"))
    description = manifest.get("description", "")
    tags        = manifest.get("tags", [])

    metadata = {
        "snippet": {
            "title":       title[:100],       # YouTube title limit
            "description": description[:5000], # YouTube description limit
            "tags":        tags[:500],         # YouTube tags limit
            "categoryId":  "22",               # People & Blogs
        },
        "status": {
            "privacyStatus":           "public",
            "selfDeclaredMadeForKids": False,
        },
    }

    print(f"[upload] {channel_id}: exchanging refresh token...")
    access_token = _get_access_token(channel_id)

    file_size = video_path.stat().st_size
    print(f"[upload] {channel_id}: starting resumable upload "
          f"({file_size / 1_048_576:.1f} MB) — {title[:60]}")

    upload_uri = _start_resumable_upload(access_token, metadata, file_size)
    video_id   = _upload_file(upload_uri, video_path)

    print(f"[upload] ✓ {channel_id} — videoId: {video_id}")


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Upload Dopamine Studios Shorts to YouTube"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--channel", type=str, metavar="ID",
                       help="Single channel ID (e.g. ch1)")
    group.add_argument("--all", action="store_true",
                       help="Upload all channels")
    args = parser.parse_args()

    channel_ids = load_all_channel_ids()
    targets = channel_ids if args.all else [args.channel]

    failed = []
    for cid in targets:
        try:
            upload_channel(cid)
        except Exception as exc:
            print(f"[upload] ✗ {cid}: {exc}", file=sys.stderr)
            failed.append(cid)

    if failed:
        print(f"[upload] FAILED channels: {failed}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
