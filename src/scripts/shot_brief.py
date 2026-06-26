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

# ── Provider chain (same order as script_gen.py) ──────────────────────────────

_PROVIDERS = [
    {"name": "groq",     "url": "https://api.groq.com/openai/v1/chat/completions",                              "key_env": "GROQ_API_KEY",      "model": "llama-3.3-70b-versatile"},
    {"name": "sambanova","url": "https://api.sambanova.ai/v1/chat/completions",                                  "key_env": "SAMBANOVA_API_KEY",  "model": "Meta-Llama-3.3-70B-Instruct"},
    # {"name": "xai",      "url": "https://api.x.ai/v1/chat/completions",                                         "key_env": "XAI_API_KEY",        "model": "grok-3-mini"},      # 403 — key expired
    {"name": "gemini",   "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",      "key_env": "GEMINI_API_KEY",     "model": "gemini-2.0-flash"},
    # {"name": "cerebras", "url": "https://api.cerebras.ai/v1/chat/completions",                                   "key_env": "CEREBRAS_API_KEY",   "model": "llama3.1-8b"},  # 404 — endpoint changed
    {"name": "nvidia",   "url": "https://integrate.api.nvidia.com/v1/chat/completions",                          "key_env": "NVIDIA_API_KEY",     "model": "meta/llama-3.3-70b-instruct"},
    {"name": "mistral",  "url": "https://api.mistral.ai/v1/chat/completions",                                    "key_env": "MISTRAL_API_KEY",    "model": "mistral-small-latest"},
]


_last_good_provider: str | None = None


class _SkipProvider(Exception):
    def __init__(self, name, status):
        self.name = name
        self.status = status
        super().__init__(f"{name} HTTP {status}")


def _call_provider(provider: dict, system: str, user: str) -> str:
    api_key = os.getenv(provider["key_env"])
    if not api_key:
        raise EnvironmentError(f"{provider['key_env']} not set")
    resp = requests.post(
        provider["url"],
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": provider["model"],
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
            "temperature": 0.4,
            "max_tokens": 2000,
            "response_format": {"type": "json_object"},
        },
        timeout=60,
    )
    if resp.status_code in (429, 403, 404):
        raise _SkipProvider(provider["name"], resp.status_code)
    if not resp.ok:
        raise RuntimeError(f"[{provider['name']}] HTTP {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"] or ""


def _llm_complete(system: str, user: str) -> str:
    global _last_good_provider
    ordered = _PROVIDERS[:]
    if _last_good_provider:
        ordered.sort(key=lambda p: 0 if p["name"] == _last_good_provider else 1)

    skipped = []
    for provider in ordered:
        if not os.getenv(provider["key_env"]):
            skipped.append(f"{provider['name']} (no key)")
            continue
        try:
            result = _call_provider(provider, system, user)
            _last_good_provider = provider["name"]
            if skipped:
                print(f"[shot_brief] used {provider['name']} (skipped: {', '.join(skipped)})")
            return result
        except _SkipProvider as e:
            reason = "rate limited" if e.status == 429 else f"unavailable ({e.status})"
            print(f"[shot_brief] {provider['name']} {reason}, trying next...")
            skipped.append(f"{provider['name']} ({e.status})")
        except EnvironmentError:
            skipped.append(f"{provider['name']} (no key)")
        except Exception as e:
            skipped.append(f"{provider['name']} (error: {e})")
    raise RuntimeError(f"All providers exhausted: {', '.join(skipped)}")

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
6. DEFAULT TO "center" for the primary element unless there is a specific compositional reason to do otherwise.
7. At least 1 dropShadow entry is required in depth.dropShadows.
8. motion entries: if kind==="spring", springConfig is required. If kind==="interpolate", easing is required.
9. Return ONLY valid JSON — no markdown fences, no explanations.

PRIMITIVE SELECTION — you MUST use one of these exact strings for "primitive":

  "GradientCard"        — gradient-filled rounded card with glow. Best for hook, context, key facts.
  "GradientBorderCard"  — stroke-only card with gradient border and glow. For premium reveals, product features.
  "MorphSearchBar"      — pill search bar slides in then morphs to square icon. For UI, tech, product demos.
  "GlowDuplicateStack"  — 4 glow-blur copies of a shape staggered in from left. For impact, energy, brand beats.
  "UISearchBar"         — full search bar with typewriter text and gradient button. For SaaS, product, UI beats.
  "ExpandingBox"        — box expands upward as text types inside. For process, step-by-step, text reveals.
  "CCLightSweep"        — diagonal light sweep across the frame. Use as intro polish on any beat.
  "LinearWipe"          — clip-path left-to-right wipe reveal. For dramatic text or stat reveals.
  "EffectFilmGrain"     — animated film grain overlay. For atmospheric, cinematic, documentary beats.
  "EffectVignette"      — dark radial vignette overlay. For depth, focus, dramatic beats.
  "BackgroundFluidWave" — SVG turbulence wave animation. For space, ocean, energy background beats.
  "GlobeSpinner"        — rotating CSS globe with continent outlines. For geography, global, world beats.
  "CountryConnector"    — SVG dashed lines draw between country coordinates. For route, network, trade beats.
  "UIFlagChip"          — country flag emoji + label pills, staggered entrance. For rankings, geography, travel beats.
  "TextHighlightWord"   — words flash accent color on entrance. For impact, reveals, key fact beats.
  "HexCarousel"         — 3D CSS carousel of 6 panels rotating on Y axis. For feature lists, options, comparisons.
  "StarTransition"      — 10-point star scales up to fill frame. For high-energy reveals, twist, breakthrough beats.
  "SaaSCard"            — spring-entrance feature card with icon, title, body. For product features, SaaS beats.
  "OrbitalHub"          — centre node with 3 orbiting satellites on dashed lines. For concept clusters, networks.
  "CursorClick"         — SVG cursor arrives, clicks, exits. For UX demo, product, interaction beats.

SELECTION RULES:
- Never repeat the same primitive twice in one video.
- HOOK beats: use high-energy entry — "GlowDuplicateStack", "StarTransition", "TextHighlightWord", "GlobeSpinner".
- CONTEXT beats: moving visuals — "UISearchBar", "ExpandingBox", "CountryConnector", "OrbitalHub".
- DATA beats: "GradientCard" (fact), "UIFlagChip" (ranking), "HexCarousel" (list), "SaaSCard" (stat).
- TWIST beats: "StarTransition", "CCLightSweep", "LinearWipe", "GlowDuplicateStack".
- OUTRO beats: "OrbitalHub", "HexCarousel", "GradientBorderCard".
- ATMOSPHERE beats: "BackgroundFluidWave", "EffectFilmGrain", "EffectVignette".

STRICT RULE: Each primitive may only appear ONCE per video.
If resolvedAsset is fullscreen (person/place), use a motion primitive as overlay.

TYPOGRAPHY RULES for the typography[] array:
- "primary" role: the ONE key concept for this beat — the emphasis_keyword, a stat number, or the
  central entity name. Large, accent-colored, font="accent". This is the visual headline.
  Max 3 words. For stats: just the number ('4.6 billion' not 'Earth is 4.6 billion years old').
  For people: just the name ('Einstein' not 'Albert Einstein discovered relativity').
- "body" role: max 8 words from the narration restated as a visual phrase — smaller, white/muted,
  font="body". NOT the full narration sentence. A fragment that reinforces the primary.
- "label" role: a SHORT supporting unit or source — max 4 words, fact-based, beat-specific.
  Examples: "per second", "NASA, 2023", "Harvard study", "prefrontal cortex", "1963".
  NEVER: channel name, channel ID, CTA phrases, outro text, generic labels like "space facts".
  Omit entirely if nothing meaningful applies.
- sizePx: primary=96-140px (hook beats), 72-96px (body beats). body=40-52px. label=32-40px.
- Never put the full narration as primary — captions handle that. Primary is ONE concept only."""


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
    return f"""Channel ID: {channel_cfg.get('id', 'ch1')} (use this to apply channel-specific primitive rules above)

Beat JSON:
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
                 retries: int = 3) -> dict:
    user_prompt = _build_user_prompt(beat, channel_cfg, recent_grids, asset_meta)
    last_err: Exception | None = None

    for attempt in range(retries):
        try:
            raw = _llm_complete(SYSTEM_PROMPT, user_prompt)
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
    Calls the LLM provider chain (Groq → SambaNova → …) for each beat sequentially,
    tracking recent grids for variety enforcement.
    Failures are non-fatal: the beat gets shotBrief=None and the composition falls back.
    Returns the updated manifest.
    """
    has_any_key = any(os.getenv(p["key_env"]) for p in _PROVIDERS)
    if not has_any_key:
        print("[shot_brief] no LLM API keys set — skipping shot brief compilation (fallback rendering will be used)")
        for beat in manifest["beats"]:
            beat.setdefault("shotBrief", None)
        return manifest

    channel_id = manifest["channelId"]
    channel_cfg = _load_channel_cfg(channel_id)
    beats: list[dict] = manifest["beats"]

    recent_grids: list[str] = []
    ok = 0

    for i, beat in enumerate(beats):
        if i > 0:
            time.sleep(0.4)

        resolved_asset: Any = beat.get("resolvedAsset")
        asset_meta: dict | None = None
        if isinstance(resolved_asset, dict):
            asset_meta = {k: resolved_asset[k] for k in ("width", "height", "focalPointXPct", "focalPointYPct")
                          if k in resolved_asset}

        try:
            brief = _compile_one(beat, channel_cfg, recent_grids[-3:], asset_meta)
            beat["shotBrief"] = brief
            ok += 1
            grid = brief.get("composition", {}).get("grid")
            if grid:
                recent_grids.append(grid)
        except Exception as exc:
            print(f"[shot_brief] ⚠ beat {beat.get('beatId')} skipped — {exc}")
            beat["shotBrief"] = None

    print(f"[shot_brief] {ok}/{len(beats)} shot briefs compiled")
    return manifest
