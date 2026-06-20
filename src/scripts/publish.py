"""
Session 9 — Draft → Review → Publish pipeline.
- upload_as_draft(): ALWAYS uploads with privacyStatus='private' — hardcoded, not configurable.
- approve_draft(): the ONLY function in this codebase allowed to set privacyStatus='public'.
- reject_draft(): deletes from YouTube + marks registry entry rejected.
"""

import json
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

DRAFTS_REGISTRY = Path("drafts/registry.json")
DRAFTS_DIR = Path("drafts")


def _load_registry() -> list:
    if not DRAFTS_REGISTRY.exists():
        return []
    with open(DRAFTS_REGISTRY) as f:
        return json.load(f)


def _save_registry(drafts: list) -> None:
    DRAFTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(DRAFTS_REGISTRY, "w") as f:
        json.dump(drafts, f, indent=2)


def _get_youtube_client(channel_id: str):
    """Build an authenticated YouTube client using per-channel OAuth refresh token."""
    ch_num = channel_id[-1].upper()
    prefix = f"YT_CH{ch_num}"
    refresh_token = os.environ.get(f"{prefix}_REFRESH_TOKEN")
    if not refresh_token:
        raise ValueError(
            f"Missing {prefix}_REFRESH_TOKEN — set it in .env before uploading channel {channel_id}"
        )
    client_id = os.environ.get(f"{prefix}_CLIENT_ID")
    client_secret = os.environ.get(f"{prefix}_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise ValueError(f"{prefix}_CLIENT_ID and {prefix}_CLIENT_SECRET must be set in .env")

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
    )
    return build("youtube", "v3", credentials=creds)


def _extract_thumbnail(video_path: str, channel_id: str, video_id: str) -> Optional[str]:
    """Extract the first frame of the rendered video as a thumbnail JPEG."""
    out = Path(f"drafts/thumbnails/{video_id}.jpg")
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-ss", "0", "-i", str(video_path), "-vframes", "1", "-q:v", "2", str(out)],
            check=True,
            capture_output=True,
        )
        return str(out)
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def _get_recent_log_entries(channel_id: str, n: int = 5) -> list:
    log_path = Path("INTEGRATION-LOG.md")
    if not log_path.exists():
        return []
    lines = log_path.read_text().splitlines()
    return lines[-n:] if len(lines) >= n else lines


def _get_asset_misses_for_render(video_path: str) -> list:
    """Return any asset-miss log lines recorded during this render (by video path suffix)."""
    miss_log = Path("assets/cache/misses.log")
    if not miss_log.exists():
        return []
    stem = Path(video_path).stem
    return [
        line for line in miss_log.read_text().splitlines()
        if stem in line
    ]


def register_draft(video_id: str, channel_id: str, metadata: dict, video_path: str) -> None:
    thumbnail = _extract_thumbnail(video_path, channel_id, video_id)
    draft_entry = {
        "video_id": video_id,
        "channel_id": channel_id,
        "title": metadata.get("title", ""),
        "script_summary": (metadata.get("hook", "") + " ... " + metadata.get("outro_cta", "")).strip(" ."),
        "render_path": str(video_path),
        "thumbnail_path": thumbnail,
        "uploaded_at": datetime.utcnow().isoformat(),
        "status": "pending_review",
        "integration_log_excerpt": _get_recent_log_entries(channel_id),
        "asset_misses": _get_asset_misses_for_render(video_path),
    }
    drafts = _load_registry()
    drafts.append(draft_entry)
    _save_registry(drafts)
    print(f"[publish] Draft registered: {video_id} → status=pending_review")


def upload_as_draft(video_path: str, channel_id: str, metadata: dict) -> str:
    """
    Uploads the video to YouTube with privacyStatus='private'.
    This is HARDCODED — no parameter, environment variable, or code path
    changes this to 'public'. The only path to public is approve_draft().
    """
    youtube = _get_youtube_client(channel_id)

    body = {
        "snippet": {
            "title": metadata["title"],
            "description": metadata.get("description", ""),
            "tags": metadata.get("tags", []),
            "categoryId": metadata.get("categoryId", "27"),  # 27 = Education
        },
        "status": {
            "privacyStatus": "private",  # HARDCODED — see module docstring
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"\r[publish] Uploading {channel_id}… {pct}%", end="", flush=True)

    video_id = response["id"]
    print(f"\n[publish] Upload complete — video_id={video_id}")
    register_draft(video_id, channel_id, metadata, video_path)
    return video_id


def _update_draft_status(video_id: str, status: str, reason: str = "") -> None:
    drafts = _load_registry()
    for d in drafts:
        if d["video_id"] == video_id:
            d["status"] = status
            if reason:
                d["rejection_reason"] = reason
            d["status_updated_at"] = datetime.utcnow().isoformat()
    _save_registry(drafts)


def approve_draft(video_id: str, channel_id: str, publish_at: Optional[str] = None) -> None:
    """
    This is the ONLY function in the codebase permitted to call
    videos.update with privacyStatus='public'.
    If publish_at (ISO datetime) is given, schedules; otherwise publishes immediately.
    """
    youtube = _get_youtube_client(channel_id)

    if publish_at:
        youtube.videos().update(
            part="status",
            body={
                "id": video_id,
                "status": {"privacyStatus": "private", "publishAt": publish_at},
            },
        ).execute()
        _update_draft_status(video_id, "scheduled")
        print(f"[publish] {video_id} scheduled for {publish_at}")
    else:
        youtube.videos().update(
            part="status",
            body={
                "id": video_id,
                "status": {"privacyStatus": "public"},
            },
        ).execute()
        _update_draft_status(video_id, "published")
        print(f"[publish] {video_id} is now PUBLIC")


def reject_draft(video_id: str, channel_id: str, reason: str) -> None:
    youtube = _get_youtube_client(channel_id)
    youtube.videos().delete(id=video_id).execute()
    _update_draft_status(video_id, "rejected", reason=reason)
    print(f"[publish] {video_id} deleted and marked rejected: {reason}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="cmd")

    up = subparsers.add_parser("upload-draft")
    up.add_argument("--channel", required=True)
    up.add_argument("--file", required=True)
    up.add_argument("--title", default="Dopamine Studios Video")
    up.add_argument("--description", default="")

    ap = subparsers.add_parser("approve")
    ap.add_argument("--video-id", required=True)
    ap.add_argument("--channel", required=True)
    ap.add_argument("--publish-at", default=None)

    rp = subparsers.add_parser("reject")
    rp.add_argument("--video-id", required=True)
    rp.add_argument("--channel", required=True)
    rp.add_argument("--reason", default="manual rejection")

    args = parser.parse_args()

    if args.cmd == "upload-draft":
        vid = upload_as_draft(args.file, args.channel, {
            "title": args.title,
            "description": args.description,
        })
        print(f"Uploaded as draft: https://studio.youtube.com/video/{vid}/edit")
    elif args.cmd == "approve":
        approve_draft(args.video_id, args.channel, args.publish_at)
    elif args.cmd == "reject":
        reject_draft(args.video_id, args.channel, args.reason)
    else:
        parser.print_help()
