#!/usr/bin/env python3
"""Upload rendered videos to YouTube as private drafts."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent


def upload_channel(channel_id: str) -> bool:
    video_path = ROOT / "out" / channel_id / "short.mp4"
    manifest_path = ROOT / "out" / channel_id / "manifest.json"

    if not video_path.exists():
        print(f"  ✗ {channel_id}: video file not found at {video_path}")
        return False

    manifest = {}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())

    topic = manifest.get("topic", "Educational Short")
    title = f"{topic} #shorts"
    description = f"Learn about {topic} in 35 seconds.\n\n#shorts #educational"

    # YouTube Data API v3 upload
    api_key = os.environ.get("YOUTUBE_API_KEY", "")
    client_id = os.environ.get("YOUTUBE_CLIENT_ID", "")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET", "")
    refresh_token = os.environ.get(f"YOUTUBE_REFRESH_TOKEN_{channel_id.upper()}", "")

    if not refresh_token:
        print(f"  ⚠ {channel_id}: no refresh token found, skipping upload")
        return True  # Not a failure — just not configured yet

    try:
        import requests

        # Get access token
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=10,
        )
        token_resp.raise_for_status()
        access_token = token_resp.json()["access_token"]

        # Initiate resumable upload
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Upload-Content-Type": "video/mp4",
            "X-Upload-Content-Length": str(video_path.stat().st_size),
        }
        meta = {
            "snippet": {
                "title": title[:100],
                "description": description,
                "categoryId": "27",
            },
            "status": {"privacyStatus": "private"},
        }
        init_resp = requests.post(
            "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
            headers=headers,
            json=meta,
            timeout=10,
        )
        init_resp.raise_for_status()
        upload_url = init_resp.headers["Location"]

        # Upload video bytes
        with open(video_path, "rb") as f:
            upload_resp = requests.put(
                upload_url,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "video/mp4"},
                data=f,
                timeout=300,
            )
        upload_resp.raise_for_status()
        video_id = upload_resp.json().get("id", "unknown")
        print(f"  ✓ {channel_id}: uploaded → https://youtu.be/{video_id}")
        return True

    except Exception as exc:
        print(f"  ✗ {channel_id} upload error: {exc}")
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--channel")
    args = parser.parse_args()

    if args.all:
        channels = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6"]
    elif args.channel:
        channels = [args.channel]
    else:
        parser.print_help()
        sys.exit(1)

    failed = [ch for ch in channels if not upload_channel(ch)]
    if failed:
        print(f"Upload failures: {failed}")
        sys.exit(1)


if __name__ == "__main__":
    main()
