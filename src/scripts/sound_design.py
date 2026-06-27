#!/usr/bin/env python3
"""Stage 6: Schedule SFX events at frame positions."""
from __future__ import annotations

SFX_PROFILES: dict[str, dict[str, list[str]]] = {
    "kenney_retro": {
        "hook": ["synth_hit"],
        "cut": ["whoosh_soft"],
        "beat": ["click_retro"],
        "breath": [],
    },
    "cinematic_tension": {
        "hook": ["tension_rise"],
        "cut": ["whoosh_hard"],
        "beat": ["tick"],
        "breath": ["ambient_low"],
    },
    "cinematic_suspense": {
        "hook": ["drone_sting"],
        "cut": ["glitch_hit"],
        "beat": ["paper_crinkle"],
        "breath": [],
    },
    "soft_electronic": {
        "hook": ["chime_soft"],
        "cut": ["whoosh_soft"],
        "beat": ["click_soft"],
        "breath": [],
    },
    "orchestral_subtle": {
        "hook": ["string_swell"],
        "cut": ["page_turn"],
        "beat": [],
        "breath": [],
    },
    "cosmic_ambient": {
        "hook": ["space_ping"],
        "cut": ["whoosh_cosmic"],
        "beat": ["blip"],
        "breath": [],
    },
}

CHANNEL_SFX = {
    "ch1": "kenney_retro",
    "ch2": "cinematic_tension",
    "ch3": "cinematic_suspense",
    "ch4": "soft_electronic",
    "ch5": "orchestral_subtle",
    "ch6": "cosmic_ambient",
}


async def run_sound_design(context: dict) -> dict:
    manifest: dict = context["manifest"]
    channel_id: str = context["channel_id"]
    profile_name = CHANNEL_SFX.get(channel_id, "soft_electronic")
    profile = SFX_PROFILES.get(profile_name, {})

    for beat in manifest["beats"]:
        events = []
        sk = beat["sectionKey"]
        sf = beat["startFrame"]
        pause = beat.get("pause_after", "beat")

        # Hook SFX at beat start
        if sk == "hook":
            for sfx in profile.get("hook", []):
                events.append({"sfxKey": sfx, "frame": sf, "volume": 0.7})

        # Transition SFX at end of beat
        end_frame = sf + beat["durationFrames"] - 1
        for sfx in profile.get(pause, []):
            events.append({"sfxKey": sfx, "frame": end_frame, "volume": 0.5})

        beat["sfxEvents"] = events

    context["manifest"] = manifest
    return context
