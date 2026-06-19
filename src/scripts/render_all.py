"""
Render stage — drives `npx remotion render` for each channel's manifest.

Usage:
  python src/scripts/render_all.py --channel ch1
  python src/scripts/render_all.py --all

Reads  : out/{channel_id}/manifest.json
Writes : out/{channel_id}/short.mp4

The Remotion composition ID is looked up from CHANNEL_COMPS. Each channel
renders its own composition (Ch1…Ch6), registered in src/Root.tsx.
"""

import argparse
import glob
import json
import os
import subprocess
import sys
from pathlib import Path

# Map channel IDs → Remotion composition IDs registered in src/Root.tsx.
CHANNEL_COMPS = {
    "ch1": "Ch1",
    "ch2": "Ch2",
    "ch3": "Ch3",
    "ch4": "Ch4",
    "ch5": "Ch5",
    "ch6": "Ch6",
}


def _comp_id(channel_id: str) -> str:
    """Composition ID for a channel, deriving Ch<N> as a fallback."""
    return CHANNEL_COMPS.get(channel_id, channel_id.capitalize())


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


def render_channel(channel_id: str) -> None:
    """
    Renders one channel's short.
    Raises RuntimeError (with stderr) if the Remotion process exits non-zero.
    """
    manifest_path = Path("out") / channel_id / "manifest.json"
    output_path   = Path("out") / channel_id / "short.mp4"

    if not manifest_path.exists():
        raise FileNotFoundError(
            f"Manifest not found: {manifest_path}. "
            "Run pipeline.py first."
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    comp_id = _comp_id(channel_id)

    # Remotion compositions expect { "manifest": <VideoManifest> } as their
    # input props (matching defaultProps={{ manifest: EMPTY_MANIFEST }} in
    # Root.tsx). The pipeline writes the raw manifest to manifest.json, so we
    # wrap it here before passing to --props.
    with open(manifest_path) as f:
        manifest_data = json.load(f)
    props_path = output_path.parent / "props.json"
    with open(props_path, "w") as f:
        json.dump({"manifest": manifest_data}, f)

    # Ensure Chromium path is forwarded to the subprocess.
    chrome_exe = os.environ.get("REMOTION_CHROME_EXECUTABLE", "chromium-browser")
    env = {**os.environ, "REMOTION_CHROME_EXECUTABLE": chrome_exe}

    # Remotion 4.x CLI: composition-id and output are positional args.
    # parsedCli._ contains only positional args — --composition= flags are
    # stripped before reaching getCompName() and are silently ignored.
    cmd = [
        "npx", "remotion", "render",
        comp_id,              # positional: composition ID
        str(output_path),     # positional: output file
        f"--props={props_path}",
        "--chromium-flags=--no-sandbox",
        "--log=verbose",
    ]

    print(f"[render] {channel_id}: npx remotion render "
          f"{comp_id} → {output_path}")

    result = subprocess.run(
        cmd,
        env=env,
        stderr=subprocess.PIPE,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            f"Remotion render failed for {channel_id} "
            f"(exit {result.returncode}):\n{result.stderr}"
        )

    print(f"[render] ✓ {channel_id}")


def main():
    parser = argparse.ArgumentParser(description="Render Dopamine Studios Shorts via Remotion")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--channel", type=str, metavar="ID",
                       help="Single channel ID (e.g. ch1)")
    group.add_argument("--all", action="store_true",
                       help="Render all channels sequentially")
    args = parser.parse_args()

    channel_ids = load_all_channel_ids()
    targets = channel_ids if args.all else [args.channel]

    failed = []
    for cid in targets:
        try:
            render_channel(cid)
        except Exception as exc:
            print(f"[render] ✗ {cid}: {exc}", file=sys.stderr)
            failed.append(cid)

    if failed:
        print(f"[render] FAILED channels: {failed}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
