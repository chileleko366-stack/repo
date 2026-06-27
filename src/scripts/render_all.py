#!/usr/bin/env python3
"""Render all channel compositions with Remotion."""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

CHANNEL_COMPOSITIONS = {
    "ch1": "Ch1",
    "ch2": "Ch2",
    "ch3": "Ch3",
    "ch4": "Ch4",
    "ch5": "Ch5",
    "ch6": "Ch6",
}


def render_channel(channel_id: str) -> bool:
    ch_num = channel_id[2]
    comp = CHANNEL_COMPOSITIONS[channel_id]
    out_path = ROOT / "out" / channel_id / "short.mp4"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "npx", "remotion", "render",
        comp,
        str(out_path),
        "--gl=swangle",
        "--log=verbose",
        "--timeout=90000",
        "--concurrency=2",
    ]

    print(f"Rendering {channel_id} ({comp})...")
    result = subprocess.run(cmd, cwd=str(ROOT))
    if result.returncode == 0:
        print(f"  ✓ {channel_id} → {out_path}")
        return True
    else:
        print(f"  ✗ {channel_id} render failed (exit {result.returncode})")
        return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--channel", help="Single channel ID")
    args = parser.parse_args()

    if args.all:
        channels = list(CHANNEL_COMPOSITIONS.keys())
    elif args.channel:
        channels = [args.channel]
    else:
        parser.print_help()
        sys.exit(1)

    failed = [ch for ch in channels if not render_channel(ch)]
    if failed:
        print(f"Failed: {failed}")
        sys.exit(1)


if __name__ == "__main__":
    main()
