"""
Sound design builder — assigns SFX events to manifest beats.

SFX mapping (Kenney SFX pack, all CC0):
  beat entrance   → sfx/hit_<channel>.mp3  (whoosh/impact on beat cut)
  person reveal   → sfx/reveal.mp3         (photo-unveil shimmer)
  brand reveal    → sfx/pop.mp3            (logo pop-in)
  stat / counter  → sfx/tick.mp3           (digital counting tick)
  distance map    → sfx/swoosh.mp3         (map pan/zoom)
  twist section   → sfx/sting.mp3          (narrative sting)
  outro cta       → sfx/bell.mp3           (subscribe bell)

All startFrame values are exact integer frame offsets.
The manifest's soundDesign list is ordered by startFrame.
"""

from __future__ import annotations

import uuid
from typing import Any

# Per-channel beat-entrance SFX name
CHANNEL_HIT: dict[str, str] = {
    "ch1": "hit_electronic",
    "ch2": "hit_corporate",
    "ch3": "hit_dark",
    "ch4": "hit_soft",
    "ch5": "hit_cinematic",
    "ch6": "hit_space",
}

# Frames before the beat start to fire the entrance hit (pre-roll)
HIT_PREROLL = 2
# Duration of each hit SFX in frames (most Kenney hits are ~0.3s = 9 frames)
HIT_DUR = 9


def _uid() -> str:
    return str(uuid.uuid4())[:8]


def build_sound_design(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Builds and returns a sorted list of SoundEvent dicts.
    Does NOT mutate the manifest; caller assigns manifest['soundDesign'].
    """
    channel_id: str = manifest["channelId"]
    hit_sfx = CHANNEL_HIT.get(channel_id, "hit_electronic")
    events: list[dict[str, Any]] = []

    for beat in manifest.get("beats", []):
        start: int  = beat["startFrame"]
        dur: int    = beat["durationFrames"]
        kind: str   = beat.get("visual", {}).get("kind", "none")
        section: str = beat.get("sectionKey", "")

        # Beat-entrance hit on every section cut (pre-roll so it lands on the cut)
        hit_frame = max(0, start - HIT_PREROLL)
        events.append({
            "id":            _uid(),
            "name":          hit_sfx,
            "startFrame":    hit_frame,
            "durationFrames": HIT_DUR,
            "volume":        0.55,
        })

        # Kind-specific overlaid SFX
        if kind == "person":
            events.append({
                "id":            _uid(),
                "name":          "reveal",
                "startFrame":    start + 4,
                "durationFrames": 18,
                "volume":        0.4,
            })

        elif kind in ("brand", "product", "app"):
            events.append({
                "id":            _uid(),
                "name":          "pop",
                "startFrame":    start + 3,
                "durationFrames": 9,
                "volume":        0.5,
            })

        elif kind == "stat":
            # Tick fires repeatedly every 6 frames during the counter animation
            tick_start = start + round(dur * 0.45)
            tick_end   = start + round(dur * 0.90)
            frame = tick_start
            while frame < tick_end:
                events.append({
                    "id":            _uid(),
                    "name":          "tick",
                    "startFrame":    frame,
                    "durationFrames": 6,
                    "volume":        0.25,
                })
                frame += 6

        elif kind in ("map", "distance"):
            events.append({
                "id":            _uid(),
                "name":          "swoosh",
                "startFrame":    start + 2,
                "durationFrames": 15,
                "volume":        0.35,
            })

        if section == "twist":
            events.append({
                "id":            _uid(),
                "name":          "sting",
                "startFrame":    start,
                "durationFrames": 30,
                "volume":        0.6,
            })

        if section == "outro":
            # Bell fires on the CTA appearance (frame 30 into outro)
            events.append({
                "id":            _uid(),
                "name":          "bell",
                "startFrame":    start + 30,
                "durationFrames": 20,
                "volume":        0.5,
            })

    # Deduplicate exact-duplicate (startFrame, name) pairs and sort
    seen: set[tuple[int, str]] = set()
    unique: list[dict[str, Any]] = []
    for e in events:
        key = (e["startFrame"], e["name"])
        if key not in seen:
            seen.add(key)
            unique.append(e)

    unique.sort(key=lambda e: e["startFrame"])
    return unique


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import json
    import sys
    if len(sys.argv) < 2:
        print("Usage: sound_design.py <manifest.json>")
        sys.exit(1)
    with open(sys.argv[1]) as f:
        manifest = json.load(f)
    manifest["soundDesign"] = build_sound_design(manifest)
    with open(sys.argv[1], "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[sound] {len(manifest['soundDesign'])} events written")
