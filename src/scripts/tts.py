#!/usr/bin/env python3
"""Stage 4: TTS synthesis with edge-tts + word boundary extraction."""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

import edge_tts

CHANNEL_VOICES = {
    "ch1": ("en-US-AvaNeural", "+8%", "default"),
    "ch2": ("en-US-DavisNeural", "default", "default"),
    "ch3": ("en-US-BrianNeural", "-5%", "-2st"),
    "ch4": ("en-US-AndrewNeural", "default", "default"),
    "ch5": ("en-GB-SoniaNeural", "-8%", "-1st"),
    "ch6": ("en-US-AriaNeural", "default", "default"),
}


def _ms_from_offset(offset_str: str) -> int:
    """Convert edge-tts offset (100-nanosecond units) to milliseconds."""
    try:
        return int(offset_str) // 10_000
    except (ValueError, TypeError):
        return 0


def _dur_from_dur(dur_str: str) -> int:
    try:
        return int(dur_str) // 10_000
    except (ValueError, TypeError):
        return 50


async def _synthesise_beat(
    voice: str,
    rate: str,
    pitch: str,
    narration: str,
    audio_path: Path,
    words_path: Path,
) -> int:
    """Synthesise one beat, write audio + word boundaries. Returns duration ms."""
    rate_str = rate if rate != "default" else "+0%"
    pitch_str = pitch if pitch != "default" else "+0Hz"

    communicate = edge_tts.Communicate(narration, voice, rate=rate_str, pitch=pitch_str)

    word_events: list[dict] = []
    audio_chunks: list[bytes] = []

    async for event in communicate.stream():
        if event["type"] == "audio":
            audio_chunks.append(event["data"])
        elif event["type"] == "WordBoundary":
            offset_ms = _ms_from_offset(event.get("offset", 0))
            dur_ms = _dur_from_dur(event.get("duration", 50_000))
            word_events.append({
                "word": event.get("text", ""),
                "startMs": offset_ms,
                "durationMs": dur_ms,
                "endMs": offset_ms + dur_ms,
            })

    audio_path.parent.mkdir(parents=True, exist_ok=True)
    audio_path.write_bytes(b"".join(audio_chunks))
    words_path.write_text(json.dumps(word_events, indent=2))

    total_ms = word_events[-1]["endMs"] if word_events else 1000
    # Fallback: read from mutagen if available
    if total_ms == 0:
        try:
            from mutagen.mp3 import MP3
            audio_info = MP3(str(audio_path))
            total_ms = int(audio_info.info.length * 1000)
        except Exception:
            total_ms = 1000

    return total_ms


async def run_tts(context: dict) -> dict:
    channel_id: str = context["channel_id"]
    manifest: dict = context["manifest"]
    root = Path(context["root"])
    audio_dir = root / "public" / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    voice, rate, pitch = CHANNEL_VOICES.get(channel_id, ("en-US-AvaNeural", "+0%", "+0Hz"))

    tasks = []
    for beat in manifest["beats"]:
        beat_id = beat["beatId"]
        audio_path = audio_dir / f"{beat_id}.mp3"
        words_path = audio_dir / f"{beat_id}_words.json"
        beat["audioPath"] = str(audio_path.relative_to(root))
        beat["wordBoundariesPath"] = str(words_path.relative_to(root))
        tasks.append((beat, audio_path, words_path))

    for beat, audio_path, words_path in tasks:
        duration_ms = await _synthesise_beat(
            voice, rate, pitch,
            beat["narration"],
            audio_path,
            words_path,
        )
        beat["durationMs"] = duration_ms

    context["manifest"] = manifest
    return context
