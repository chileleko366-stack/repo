"""
Upload stage — delegates to publish.py's upload_as_draft() so every upload
lands as a private draft first. Only publish.py's approve_draft() can make
a video public.

Usage:
  python src/scripts/upload_all.py --channel ch1
  python src/scripts/upload_all.py --all

Reads  : out/{channel_id}/manifest.json  (title, description, tags)
         out/{channel_id}/short.mp4
"""

import argparse
import glob
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent))
from publish import upload_as_draft


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

    metadata = {
        "title":       manifest.get("title", manifest.get("topic", "Interesting Short"))[:100],
        "description": manifest.get("description", "")[:5000],
        "tags":        manifest.get("tags", [])[:500],
        "hook":        manifest.get("script", {}).get("hook", ""),
        "outro_cta":   manifest.get("ctaText", ""),
    }

    print(f"[upload] {channel_id}: starting upload → {video_path.name}")
    sys.stdout.flush()
    video_id = upload_as_draft(str(video_path), channel_id, metadata)
    print(f"[upload] ✓ {channel_id} — https://studio.youtube.com/video/{video_id}/edit")
    sys.stdout.flush()


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
        output_path = Path("out") / cid / "short.mp4"
        if not output_path.exists():
            print(f"[upload] ⚠ {cid}: no rendered video found — skipping (pipeline failed for this channel)")
            continue
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
