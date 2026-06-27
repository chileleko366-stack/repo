#!/usr/bin/env python3
"""Main pipeline orchestrator — runs all stages for each channel."""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT / "src" / "scripts"))

from research import run_research
from script_gen import run_script_gen
from manifest_builder import run_manifest_builder
from tts import run_tts
from asset_resolver import run_asset_resolver
from shot_brief import run_shot_brief
from sound_design import run_sound_design

CHANNEL_IDS = ["ch1", "ch2", "ch3", "ch4", "ch5", "ch6"]

CHANNEL_TOPICS = {
    "ch1": "Why scrolling feels impossible to stop",
    "ch2": "How GameStop destroyed a hedge fund in 3 days",
    "ch3": "Operation Paperclip: the Nazis NASA hired",
    "ch4": "How stress physically shrinks your hippocampus",
    "ch5": "The day the Library of Alexandria burned",
    "ch6": "How far away Voyager 1 actually is",
}


def green(msg: str) -> str:
    return f"\033[92m✓ {msg}\033[0m"


def red(msg: str) -> str:
    return f"\033[91m✗ {msg}\033[0m"


async def run_channel(channel_id: str, topic: str | None = None) -> bool:
    topic = topic or CHANNEL_TOPICS.get(channel_id, "general knowledge")
    out_dir = ROOT / "out" / channel_id
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  Channel: {channel_id}  |  Topic: {topic}")
    print(f"{'='*60}")

    stages = [
        ("Research", run_research),
        ("Script Gen", run_script_gen),
        ("Manifest", run_manifest_builder),
        ("TTS", run_tts),
        ("Assets", run_asset_resolver),
        ("Shot Brief", run_shot_brief),
        ("Sound Design", run_sound_design),
    ]

    context: dict = {"channel_id": channel_id, "topic": topic, "root": str(ROOT)}

    for stage_name, stage_fn in stages:
        try:
            context = await stage_fn(context)
            print(green(f"{stage_name}"))
        except Exception as exc:
            print(red(f"{stage_name}: {exc}"))
            return False

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(context.get("manifest", {}), indent=2))
    print(green(f"Manifest saved → {manifest_path}"))
    return True


async def main() -> None:
    parser = argparse.ArgumentParser(description="Dopamine Studios pipeline")
    parser.add_argument("--channel", help="Single channel ID to run")
    parser.add_argument("--all", action="store_true", help="Run all channels")
    parser.add_argument("--topic", help="Override topic (only with --channel)")
    args = parser.parse_args()

    channels: list[str] = []
    if args.all:
        channels = CHANNEL_IDS
    elif args.channel:
        channels = [args.channel]
    else:
        parser.print_help()
        sys.exit(1)

    results: dict[str, bool] = {}
    for ch in channels:
        results[ch] = await run_channel(ch, args.topic if args.channel else None)

    print("\n" + "="*60)
    for ch, ok in results.items():
        print(green(ch) if ok else red(ch))
    failed = [ch for ch, ok in results.items() if not ok]
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
