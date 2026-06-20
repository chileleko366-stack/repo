"""
Shot Brief compiler — Python port of src/pipeline/compileShotBrief.ts.
Calls Groq (llama-3.3-70b-versatile) to produce a ShotBrief JSON for each
manifest beat, then validates the result against the same structural rules
as validateShotBrief() in shotBrief.ts.

Public API:
    compile_all_shot_briefs(manifest: dict) -> dict
        Adds a `shotBrief` key to every beat in manifest['beats'].
        Returns the updated manifest.
"""

import json
import os
import time
from pathlib import Path
from typing import Any

import requests

GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are a motion graphics cinematographer producing Shot Briefs for a Remotion render pipeline.
Given a script beat, produce a complete ShotBrief JSON following the schema exactly.
You are making STAGING decisions only — composition, depth, motion, gradient placement for glow/sheen effects.
You are not inventing factual content; narration and entity values are fixed inputs.

HARD RULES:
1. background.type is ALWAYS "solid" — gradients are NEVER used for the full-frame background.
2. Gradients ARE required somewhere in depth.glowEffects — every ShotBrief needs visual depth. Use radial gradients for glow/atmosphere, linear for surface sheen. Always explicit color stops and opacity values.
3. Every element that appears must have a motion entry (even a simple opacity 0→1). Nothing is static at mount.
4. composition.primaryAnchor must have explicit xPct/yPct/widthPct/heightPct numbers — convert conceptual positions to percentages.
5. Vary composition.grid based on the previous grids provided — never the same grid 3 times in a row.
6. At least 1 dropShadow entry is required in depth.dropShadows.
7. motion entries: if kind==="spring", springConfig is required. If kind==="interpolate", easing is required.
8. Return ONLY valid JSON — no markdown fences, no explanations."""


def _build_user_prompt(beat: dict, channel_cfg: dict, recent_grids: list, asset_meta: dict | None) -> str:
    beat_payload = {
        "beatId":           beat["beatId"],
        "narration":        beat["narration"],
        "visual":           beat["visual"],
        "emphasis_keyword": beat.get("emphasis_keyword", ""),
        "sectionKey":       beat["sectionKey"],
    }
    channel_payload = {
        "colors":     channel_cfg.get("colors", {}),
        "bodyFont":   channel_cfg.get("bodyFont", ""),
        "accentFont": channel_cfg.get("accentFont", ""),
        "id":         channel_cfg.get("id", ""),
    }
    return f"""Beat JSON:
{json.dumps(beat_payload, indent=2)}

Channel design tokens:
{json.dumps(channel_payload, indent=2)}

Previous 3 beats' composition.grid choices: {json.dumps(recent_grids)}

Resolved asset metadata (null if none): {json.dumps(asset_meta)}

Available composition.grid values: "center" | "thirds-upper" | "thirds-lower" | "left-weighted" | "right-weighted" | "full-bleed"
Available motion.property values: "translateX" | "translateY" | "scale" | "rotateDeg" | "opacity" | "clipPathInsetPct" | "strokeDashoffset"
Available easing values: "easeOutCubic" | "easeInOutCubic" | "easeOutExpo" | "linear"

ShotBrief schema:
{{
  "beatId": string,
  "channelId": string,
  "composition": {{
    "grid": CompositionGrid,
    "primaryAnchor": {{ "xPct": number, "yPct": number, "widthPct": number, "heightPct": number }},
    "secondaryElements": [{{"role": string, "anchor": {{"xPct": number, "yPct": number, "widthPct"?: number, "heightPct"?: number}}, "zIndex": number}}],
    "safeZones": {{ "topReservedPx": number, "bottomReservedPx": number }}
  }},
  "background": {{ "type": "solid", "color": string, "changesAtThisBeat": boolean }},
  "depth": {{
    "dropShadows": [{{"onElementRole": string, "offsetX": number, "offsetY": number, "blurPx": number, "color": string, "opacity": number}}],
    "glowEffects": [{{"onElementRole": string, "gradient": {{"kind": "radial"|"linear", "angleDeg"?: number, "stops": [{{"offsetPct": number, "color": string, "opacity": number}}]}}}}]
  }},
  "typography": [{{"role": string, "text": string, "font": "body"|"accent", "sizePx": number, "weight": number, "letterSpacingEm": number, "lineHeight": number, "color": string}}],
  "motion": [{{"elementRole": string, "kind": "spring"|"interpolate", "property": string, "from": number, "to": number, "startFrame": number, "durationFrames": number, "springConfig"?: {{...}}, "easing"?: string}}],
  "primitive": string,
  "fallbackPrimitive": "TypographicCard"
}}

Return ONLY the ShotBrief JSON object."""


def _validate_shot_brief(brief: dict, last_two_grids: list) -> None:
    beat_id = brief.get("beatId", "?")

    if brief.get("background", {}).get("type") != "solid":
        raise ValueError(f"Beat {beat_id}: background.type must be 'solid'")

    depth = brief.get("depth", {})
    if len(depth.get("dropShadows", [])) + len(depth.get("glowEffects", [])) < 1:
        raise ValueError(f"Beat {beat_id}: zero depth elements — add at least 1 dropShadow or glowEffect")

    if len(brief.get("motion", [])) == 0:
        raise ValueError(f"Beat {beat_id}: zero motion entries — every element needs explicit movement")

    for el in brief.get("composition", {}).get("secondaryElements", []):
        anchor = el.get("anchor", {})
        if anchor.get("xPct") is None or anchor.get("yPct") is None:
            raise ValueError(f"Beat {beat_id}: secondary element \"{el.get('role')}\" has no explicit anchor position")

    for m in brief.get("motion", []):
        if m.get("kind") == "spring" and not m.get("springConfig"):
            raise ValueError(f"Beat {beat_id}: motion on \"{m.get('elementRole')}\" is spring but has no springConfig")
        if m.get("kind") == "interpolate" and not m.get("easing"):
            raise ValueError(f"Beat {beat_id}: motion on \"{m.get('elementRole')}\" is interpolate but has no easing")

    grid = brief.get("composition", {}).get("grid")
    if len(last_two_grids) >= 2 and all(g == grid for g in last_two_grids):
        raise ValueError(f"Beat {beat_id}: composition.grid '{grid}' used 3+ times in a row — vary it")


def _compile_one(beat: dict, channel_cfg: dict, recent_grids: list, asset_meta: dict | None,
                 api_key: str, retries: int = 3) -> dict:
    user_prompt = _build_user_prompt(beat, channel_cfg, recent_grids, asset_meta)
    last_err: Exception | None = None

    for attempt in range(retries):
        try:
            resp = requests.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": user_prompt},
                    ],
                    "temperature": 0.4,
                    "max_tokens": 2000,
                },
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            raw = data["choices"][0]["message"]["content"]
            brief = json.loads(raw)
            _validate_shot_brief(brief, recent_grids)
            return brief
        except Exception as exc:
            last_err = exc
            if attempt < retries - 1:
                time.sleep(2 ** attempt)

    raise RuntimeError(f"compileShotBrief failed for beat {beat.get('beatId')} after {retries} attempts: {last_err}")


def _load_channel_cfg(channel_id: str) -> dict:
    cfg_path = Path("configs/channels") / f"{channel_id}.json"
    if cfg_path.exists():
        with open(cfg_path) as f:
            return json.load(f)
    return {"id": channel_id, "colors": {}, "bodyFont": "", "accentFont": ""}


def compile_all_shot_briefs(manifest: dict) -> dict:
    """
    Adds a `shotBrief` key to every beat in manifest['beats'].
    Calls Groq for each beat sequentially, tracking recent grids for variety enforcement.
    Returns the updated manifest.
    """
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise EnvironmentError("GROQ_API_KEY not set — cannot compile shot briefs")

    channel_id = manifest["channelId"]
    channel_cfg = _load_channel_cfg(channel_id)
    beats: list[dict] = manifest["beats"]

    recent_grids: list[str] = []

    for beat in beats:
        resolved_asset: Any = beat.get("resolvedAsset")
        asset_meta: dict | None = None
        if isinstance(resolved_asset, dict):
            asset_meta = {k: resolved_asset[k] for k in ("width", "height", "focalPointXPct", "focalPointYPct")
                          if k in resolved_asset}

        brief = _compile_one(beat, channel_cfg, recent_grids[-3:], asset_meta, api_key)
        beat["shotBrief"] = brief

        grid = brief.get("composition", {}).get("grid")
        if grid:
            recent_grids.append(grid)

    return manifest
