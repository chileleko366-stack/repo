"""
Render stage — drives `npx remotion render` for a completed manifest.

Usage (standalone):
  python src/scripts/render.py public/manifests/ch1_manifest.json
  python src/scripts/render.py public/manifests/ch6_manifest.json --output output/ch6_test.mp4

Usage (from pipeline):
  from render import render_video
  out = render_video(manifest)  # returns Path

What it does:
  1. Wraps the manifest as { "manifest": ... } — the props shape each composition expects
  2. Writes the props to a temp JSON file (manifests can be large; avoids shell-arg limits)
  3. Calls: npx remotion render src/index.ts <CompId> <output.mp4> --props=<props.json>
  4. Streams stdout/stderr live so progress bars appear in the terminal
  5. Raises RuntimeError on non-zero exit so the pipeline can catch it cleanly
  6. Returns the absolute path of the rendered MP4

Requirements:
  - Node.js 22+ with `npx` on PATH
  - Chrome/Chromium available (Remotion auto-discovers via PUPPETEER_EXECUTABLE_PATH
    or the bundled chromium installed by `npx remotion browser ensure`)
  - `npm install` must have been run at repo root
"""

import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT   = Path(__file__).parent.parent.parent.resolve()
ENTRY_POINT = "src/index.ts"    # relative to REPO_ROOT
OUTPUT_DIR  = REPO_ROOT / "output"

CHANNEL_TO_COMP: dict[str, str] = {
    "ch1": "Ch1",
    "ch2": "Ch2",
    "ch3": "Ch3",
    "ch4": "Ch4",
    "ch5": "Ch5",
    "ch6": "Ch6",
}


# ── Helpers ────────────────────────────────────────────────────────────────

def _slug(text: str, max_len: int = 40) -> str:
    """Lowercase, hyphenated, filename-safe slug."""
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s[:max_len]


# ── Render ────────────────────────────────────────────────────────────────────

def render_video(
    manifest: dict,
    output_path: Path | None = None,
    concurrency: int | None = None,
    scale: float = 1.0,
    jpeg_quality: int = 80,
) -> Path:
    """
    Renders the manifest to an MP4 via `npx remotion render`.

    Args:
        manifest:     The full VideoManifest dict (after all pipeline stages).
        output_path:  Override output file path. Auto-generated if None.
        concurrency:  Remotion --concurrency flag (threads). None = Remotion default.
        scale:        Output scale multiplier (1.0 = 1080x1920 native).
        jpeg_quality: JPEG quality for intermediate frames (50–100).

    Returns:
        Absolute Path of the rendered MP4.

    Raises:
        RuntimeError: if `npx remotion render` exits non-zero.
    """
    channel_id = manifest.get("channelId", "ch1")
    comp_id    = CHANNEL_TO_COMP.get(channel_id, "Ch1")
    topic      = manifest.get("topic", "video")
    timestamp  = int(time.time())

    if output_path is None:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_path = OUTPUT_DIR / f"{channel_id}_{_slug(topic)}_{timestamp}.mp4"
    else:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

    # Remotion props shape: { manifest: VideoManifest }
    props = {"manifest": manifest}

    # Write to a temp file in repo root so the path is always accessible
    props_fd, props_file = tempfile.mkstemp(
        suffix=".json", prefix="ds_props_", dir=REPO_ROOT
    )
    try:
        with os.fdopen(props_fd, "w") as fh:
            json.dump(props, fh)

        cmd = [
            "npx", "remotion", "render",
            ENTRY_POINT,
            comp_id,
            str(output_path),
            f"--props={props_file}",
            f"--jpeg-quality={jpeg_quality}",
        ]
        if concurrency is not None:
            cmd.append(f"--concurrency={concurrency}")
        if scale != 1.0:
            cmd.append(f"--scale={scale}")

        print(f"  command : {' '.join(cmd)}")
        print(f"  cwd     : {REPO_ROOT}")
        print()

        proc = subprocess.Popen(
            cmd,
            cwd=REPO_ROOT,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            sys.stdout.write(f"    {line}")
            sys.stdout.flush()
        proc.wait()

        if proc.returncode != 0:
            raise RuntimeError(
                f"`npx remotion render` exited with code {proc.returncode}. "
                "Check output above for details."
            )

    finally:
        Path(props_file).unlink(missing_ok=True)

    return output_path.resolve()


# ── CLI ────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Render a Dopamine Studios manifest")
    parser.add_argument("manifest",   help="Path to manifest JSON")
    parser.add_argument("--output",   default=None, help="Output MP4 path")
    parser.add_argument("--concurrency", type=int, default=None, help="Remotion --concurrency")
    parser.add_argument("--scale",    type=float, default=1.0, help="Output scale multiplier")
    args = parser.parse_args()

    with open(args.manifest) as f:
        manifest_data = json.load(f)

    out = render_video(
        manifest_data,
        output_path=Path(args.output) if args.output else None,
        concurrency=args.concurrency,
        scale=args.scale,
    )
    print(f"\n✅  Rendered: {out}")
