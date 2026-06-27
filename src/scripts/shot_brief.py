#!/usr/bin/env python3
"""Stage 5b: Assign ShotBrief to each beat via LLM."""
from __future__ import annotations

import json
import re
from pathlib import Path

from script_gen import _call_provider, _extract_json, PROVIDERS  # type: ignore

PRIMITIVES_LIST = """
BackgroundAurora        – animated radial gradient blobs on dark bg
BackgroundSaaSLight     – soft pastel gradient on near-white bg
BackgroundDotGrid       – SVG dot-grid graph-paper background
BackgroundGeometric     – floating blurred geometric shapes
TextKinetic             – words enter one by one with spring scale+blur
TextMaskReveal          – text revealed via expanding clip-path rect
TextHorizontalSlide     – words slide in from right, staggered spring
TextGradient            – text with animated diagonal gradient
TextNeon                – neon glow text effect
TextGlitch              – RGB split glitch text
TextScramble            – Matrix-style character scramble reveal
TextWave                – sine wave text animation
Text3DFlip              – rotateX entrance flip
TextCounter             – count-up number animation
Typewriter              – character by character reveal
WordCarousel            – fade between words
AnimatedIcon            – SVG icon in rounded rect, bounce entrance
ShapeSpinningRings      – concentric SVG circles rotating at diff speeds
ShapeCircularProgress   – circular progress arc
SaaSCard                – white card with drop shadow, spring entrance
GradientBorder          – card with animated rotating gradient border
HexCarousel             – 6 panels in 3D hexagon, rotating on Y axis
StarTransition          – 4-pointed star scale + bezier travel
UIMockup                – SaaS UI card with separator + CTA button
FlowConnector           – animated SVG lines connecting labelled nodes
AvatarOrbit             – circular avatar badges orbiting a centre
Card3DFlip              – card with 3D Y+X+Z rotation spring entrance
CardGrid                – 4 floating cards with CSS perspective
OrbitalHub              – central ellipse + orbiting dots + labels
LightSweep              – diagonal shine streak wrapper
EffectGlow              – radial gradient glow bloom overlay
EffectFilmGrain         – animated noise grain texture
EffectVignette          – radial blur vignette
BarChart                – animated vertical bar chart
ProgressBar             – animated horizontal progress bar
DataGauge               – semicircular gauge chart
DataLineChart           – animated line/area chart
DataRanking             – ranked list with animated bars
DataTimeline            – vertical timeline with events
DataStatsCards          – grid of stat cards
LayoutGiantNumber       – full-screen giant number display
LayoutFullscreenType    – full-screen typographic layout
LayoutMultiColumn       – multi-column text layout
LayoutSplitContrast     – split-screen contrast layout
TypographicCard         – card with large typographic display
ParticleShootingStars   – shooting star particle system
ParticleSparks          – spark particle burst effect
CursorClick             – SVG cursor travelling bezier path
AssetLayer              – fullscreen resolved asset (person/place photo)
"""

SHOT_BRIEF_SYSTEM = f"""You assign visual shot briefs to YouTube Shorts video beats.
Output ONLY a JSON array of shot brief objects (one per beat in input order).

Available primitives:
{PRIMITIVES_LIST}

Rules:
- Each primitive may be used AT MOST ONCE across all 9 beats
- Track which primitives you've already used and do NOT repeat them
- For person/place beats, use AssetLayer as the primitive
- For stat beats, prefer LayoutGiantNumber, DataGauge, ProgressBar
- For hook: TextKinetic or TextHorizontalSlide
- For outro: WordCarousel or TextGradient
- For twist: TextMaskReveal or TextGlitch or StarTransition

Shot brief schema for each beat:
{{
  "primitive": "PrimitiveName",
  "position": {{"x": 0, "y": 0, "anchorX": "center", "anchorY": "center"}},
  "scale": 1.0,
  "depth": {{
    "zIndex": 0,
    "dropShadows": [{{"offsetX": 0, "offsetY": 8, "blurPx": 32, "color": "#000000", "opacity": 0.4}}]
  }},
  "glow": {{"color": "#accentColor", "radius": 40, "opacity": 0.6}},
  "motion": {{"entrance": "spring_up", "idle": "float", "exit": "fade"}},
  "props": {{}}
}}

Output ONLY a JSON array with exactly as many objects as there are beats in the input.
"""


async def run_shot_brief(context: dict) -> dict:
    manifest: dict = context["manifest"]
    channel_id: str = context["channel_id"]

    from channelConfigs import CHANNEL_CONFIGS  # type: ignore
    cfg = CHANNEL_CONFIGS.get(channel_id)
    accent = cfg.accentColor if cfg else "#ffffff"

    beats_summary = []
    for b in manifest["beats"]:
        beats_summary.append({
            "beatId": b["beatId"],
            "sectionKey": b["sectionKey"],
            "narration": b["narration"],
            "visual_kind": b.get("visual", {}).get("kind", "none"),
        })

    user_msg = f"""Channel: {channel_id}, accent: {accent}
Beats:
{json.dumps(beats_summary, indent=2)}

Assign shot briefs. Return JSON array of {len(beats_summary)} objects."""

    for provider in PROVIDERS:
        messages = [
            {"role": "system", "content": SHOT_BRIEF_SYSTEM},
            {"role": "user", "content": user_msg},
        ]
        raw = _call_provider(provider, messages)
        if raw is None:
            continue

        raw = raw.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
        raw = re.sub(r"```\s*$", "", raw, flags=re.MULTILINE)

        try:
            briefs = json.loads(raw)
            if isinstance(briefs, list) and len(briefs) == len(manifest["beats"]):
                for beat, brief in zip(manifest["beats"], briefs):
                    # Replace placeholder accent colour
                    brief_str = json.dumps(brief).replace("#accentColor", accent)
                    beat["shotBrief"] = json.loads(brief_str)
                context["manifest"] = manifest
                return context
        except Exception as exc:
            print(f"  [{provider['name']}] shot brief parse error: {exc}")
            continue

    # Fallback: assign defaults
    _assign_default_shot_briefs(manifest["beats"], accent)
    context["manifest"] = manifest
    return context


def _assign_default_shot_briefs(beats: list[dict], accent: str) -> None:
    defaults = {
        "hook": "TextKinetic",
        "context": "Typewriter",
        "beat_0": "OrbitalHub",
        "beat_1": "LayoutGiantNumber",
        "beat_2": "CardGrid",
        "beat_3": "FlowConnector",
        "beat_4": "BackgroundAurora",
        "twist": "TextMaskReveal",
        "outro": "WordCarousel",
    }
    for beat in beats:
        sk = beat["sectionKey"]
        primitive = defaults.get(sk, "TextKinetic")
        if beat.get("visual", {}).get("kind") in ("person", "place"):
            primitive = "AssetLayer"
        beat["shotBrief"] = {
            "primitive": primitive,
            "position": {"x": 0, "y": 0, "anchorX": "center", "anchorY": "center"},
            "scale": 1.0,
            "depth": {"zIndex": 0, "dropShadows": [{"offsetX": 0, "offsetY": 8, "blurPx": 32, "color": "#000000", "opacity": 0.4}]},
            "glow": {"color": accent, "radius": 40, "opacity": 0.6},
            "motion": {"entrance": "spring_up", "idle": "float", "exit": "fade"},
            "props": {},
        }
