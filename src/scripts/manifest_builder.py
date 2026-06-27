#!/usr/bin/env python3
"""Stage 3: Convert script to VideoManifest with frame timings."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BEAT_DURATIONS_FRAMES: dict[str, int] = {
    "hook":    120,
    "context": 180,
    "beat_0":  240,
    "beat_1":  240,
    "beat_2":  240,
    "beat_3":  240,
    "beat_4":  240,
    "twist":   180,
    "outro":   420,
}

FPS = 60
TOTAL_FRAMES = 2100


async def run_manifest_builder(context: dict) -> dict:
    channel_id: str = context["channel_id"]
    topic: str = context["topic"]
    script: dict = context["script"]
    root = Path(context["root"])

    from channelConfigs import CHANNEL_CONFIGS  # type: ignore
    cfg = CHANNEL_CONFIGS.get(channel_id)

    beats: list[dict] = []
    start_frame = 0

    def make_beat(section_key: str, narration: str, visual: dict | None = None, **kwargs) -> dict:
        nonlocal start_frame
        dur = BEAT_DURATIONS_FRAMES[section_key]
        beat_id = f"{channel_id}_{section_key}"
        b: dict[str, Any] = {
            "beatId": beat_id,
            "sectionKey": section_key,
            "narration": narration,
            "visual": visual or {"kind": "typography"},
            "emphasis_keyword": kwargs.get("emphasis_keyword", narration.split()[0]),
            "pause_after": kwargs.get("pause_after", "beat"),
            "bg_color": kwargs.get("bg_color", cfg.colors["bgPrimary"] if cfg else "#000000"),
            "startFrame": start_frame,
            "durationFrames": dur,
        }
        start_frame += dur
        return b

    # hook
    beats.append(make_beat(
        "hook",
        script["hook"],
        {"kind": "typography"},
        pause_after="cut",
    ))

    # context
    beats.append(make_beat(
        "context",
        script["context"],
        {"kind": "typography"},
        pause_after="breath",
    ))

    # beats 0-4
    for i, b in enumerate(script["beats"]):
        beats.append(make_beat(
            f"beat_{i}",
            b["narration"],
            b.get("visual", {"kind": "none"}),
            emphasis_keyword=b.get("emphasis_keyword", ""),
            pause_after=b.get("pause_after", "beat"),
            bg_color=b.get("bg_color", cfg.colors["bgPrimary"] if cfg else "#000000"),
        ))

    # twist
    beats.append(make_beat(
        "twist",
        script["twist"],
        {"kind": "typography"},
        pause_after="cut",
    ))

    # outro
    outro = script["outro"]
    beats.append(make_beat(
        "outro",
        outro["narration"],
        {"kind": "typography"},
        pause_after="breath",
    ))

    assert start_frame == TOTAL_FRAMES, f"Frame count mismatch: {start_frame} != {TOTAL_FRAMES}"

    manifest: dict = {
        "channelId": channel_id,
        "topic": topic,
        "fps": FPS,
        "totalFrames": TOTAL_FRAMES,
        "durationSec": 35.0,
        "beats": beats,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

    context["manifest"] = manifest
    return context
