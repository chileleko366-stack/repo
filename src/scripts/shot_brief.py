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
    skipped = []
    for provider in _PROVIDERS:
        if not os.getenv(provider["key_env"]):
            skipped.append(f"{provider['name']} (no key)")
            continue
        try:
            result = _call_provider(provider, system, user)
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

TEXT PRIMITIVES (for narration/fact display):
  "GlassCard"          — large glassmorphism card with glow. Best for hook, context, key facts, stats.
  "Typewriter"         — text types character-by-character; emphasis word highlights at end. For reveals, twist, outro.
  "WordCarousel"       — words crossfade in sequence. For lists, entities, options. Primary must be comma-separated words.
  "TypographicCard"    — minimal text card. Fallback only when nothing else fits.
  "TextKinetic"        — words spring-pop in staggered sequence, uppercase impact. Great for beat openers.
  "TextScramble"       — Matrix-style characters scramble then resolve to final text. For mystery, tech, data reveals.
  "TextWave"           — characters float on a sine wave. For playful, rhythmic beats.
  "TextMaskReveal"     — text revealed left-to-right via clip-path wipe. For dramatic unveils.
  "TextGlitch"         — RGB color split + position offset glitch effect. For shock, controversy, disruption beats.
  "TextNeon"           — pulsing neon glow on text. For nighttime, cyberpunk, energy beats.
  "TextCounter"        — counts up from 0 to a number with Intl formatting. Primary must be a digit string like "1000000".
  "TextGradient"       — text with animated rotating gradient fill. For vibrant, colorful stat reveals.
  "Text3DFlip"         — text flips in on 3D X-axis. For clean dramatic entries.

DATA / CHART PRIMITIVES (for statistics and comparisons):
  "ProgressBar"        — horizontal fill bar with percentage label. Use when stat_value is a percentage.
  "BarChart"           — vertical bar chart. Primary must be "Label1:80,Label2:60,Label3:40" format.
  "DataLineChart"      — self-drawing SVG line chart. Primary: "0:10,1:25,2:40,3:80" (x:y pairs).
  "DataGauge"          — semicircle SVG gauge dial. Primary must be a numeric string (the value). Great for percentages with visual context.
  "DataRanking"        — staggered animated horizontal bars with rank numbers. Primary: "Item1:90,Item2:70,Item3:50".
  "DataTimeline"       — sequential events with dot-connector. Primary: "1969:Moon landing,1989:Berlin Wall,2001:9/11".
  "DataStatsCards"     — 2-4 stat cards in a grid, staggered entrance. Primary: "8B:World pop,78:Life expectancy".
  "LayoutGiantNumber"  — fills 80% of frame with a single huge formatted number. Primary is the number string.

LAYOUT PRIMITIVES (for structural visual arrangements):
  "LayoutSplitContrast"   — diagonal split with two contrasting panels. Primary: "Concept A vs Concept B" or "Left/Right".
  "LayoutFullscreenType"  — full-frame word-by-word spring reveal. Primary is the text; accentWord is highlighted.
  "LayoutMultiColumn"     — 2-3 columns with staggered entrance. Primary: "Title1:Body1,Title2:Body2,Title3:Body3".

SHAPE / PARTICLE PRIMITIVES (for visual energy):
  "ShapeCircularProgress" — SVG arc fills to a percentage. Primary must be a numeric string (0-100).
  "ShapeSpinningRings"    — concentric spinning ellipses. Use for space, physics, energy concept beats.
  "ParticleShootingStars" — deterministic shooting star streaks. Use as background layer for space beats.
  "ParticleSparks"        — energy sparks burst from center. Use for high-energy reveals, breakthroughs.
  "AnimatedIcon"          — Lottie icon. visual.value must be one of: chart-up|chart-down|brain-idea|lock-security|globe-world|alert-warning|checkmark-success|clock-time.

BACKGROUND / ATMOSPHERIC (use when beat needs an ambient visual layer):
  "BackgroundAurora"      — animated aurora color waves with blur. For space, science, wonder beats.
  "BackgroundGeometric"   — floating geometric shapes (circles, squares, triangles). For abstract concept beats.
  "BackgroundSaaSLight"   — soft animated pastel 4-colour gradient. For ch2 white-bg beats or bright concept beats.

SAAS / MOTION-GRAPHIC PRIMITIVES (from AE motion lessons):
  "SaaSCard"              — white opaque card, spring entrance, drop shadow. Best for ch2 key-stat beats on white bg.
  "OrbitalHub"            — SVG ellipse orbit + 4 rotating keyword dots. Primary must be comma-separated words (4 max). For concept clusters, product features.
  "CursorClick"           — SVG cursor travels quadratic bezier path then clicks. For UX/product demo beats.
  "CardGrid"              — 4 floating cards in 2×2 CSS perspective grid, staggered spring entrance. Primary: "Title1:Value1,Title2:Value2,Title3:Value3,Title4:Value4".
  "HexCarousel"           — CSS 3D perspective carousel; 6 panels rotating on Y axis. Primary: "Title:Body" comma-separated pairs (6 max). For feature lists, option comparisons, product pillars.
  "StarTransition"        — radial star-burst rays from centre + glow pulse. Use for high-energy reveals, breakthroughs, or dramatic twist beats.
  "BackgroundDotGrid"     — SVG repeating dot grid background. Use for analytics/data/planning beats on any channel.
  "UIMockup"              — White SaaS UI card with separator bar, gradient CTA button, blinking cursor. Best for product demo beats.
  "FlowConnector"         — Animated SVG lines connecting 2-4 labelled nodes. For workflow, neural pathway, timeline, system beats.
  "LightSweep"            — Diagonal light scan over a GlassCard. For premium logo/product reveal beats.
  "AvatarOrbit"           — Coloured avatar badges orbiting a centre with upright counter-rotation. For team/network/satellite beats.
  "EffectVignette"        — Radial blur vignette overlay over GlassCard. Adds cinematic depth to atmospheric or dramatic beats.
  "TextHorizontalSlide"   — Words slide in from right, staggered. Primary: comma-separated list of items/facts/attributes.
  "Card3DFlip"            — Card flips in via 3D Y+X spring rotation. For document/report/invoice/stat reveals. Primary: "Title:Value".

CHANNEL-SPECIFIC (channel-gated — only use on the specified channelId):
  "CelestialBody"      — ch6 ONLY. Rotating 3D sphere (planet/moon). Always use for celestial beats on ch6.
  "ThreeBrain"         — ch4 ONLY. Rotating 3D wireframe brain. Always use for anatomy/neuroscience on ch4.
  "CandlestickChart"   — ch2 ONLY. Animated financial candlestick chart. Always use for finance/stat beats on ch2.
  "ScrambleReveal"     — ch3 ONLY. Text scrambles then resolves. Use for revelation beats on ch3.
  "ClassifiedStamp"    — ch3 ONLY. Red CLASSIFIED stamp slams in. Use for opening/hook beats on ch3.
  "GlitchWord"         — ch3 ONLY. Single word glitches and stabilizes. Use for emphasis beats on ch3.

PRIMITIVE SELECTION BY BEAT TYPE — rotate through ALL primitives. Never repeat the same primitive twice in one video. GlassCard is a last resort, not a default.

HOOK beats — channel-specific, high energy:
  ch1: "TextKinetic" or "LayoutFullscreenType" (psychology impact opener)
  ch2: "SaaSCard" or "CandlestickChart" (finance hook, white bg)
  ch3: "ClassifiedStamp" (noir reveal)
  ch4: "TextMaskReveal" or "Text3DFlip" (neuroscience dramatic entry)
  ch5: "TextScramble" or "Typewriter" (history mystery)
  ch6: "BackgroundAurora" or "ParticleShootingStars" (space energy)

CONTEXT beats — always moving, never static:
  "Typewriter", "LayoutFullscreenType", "TextMaskReveal", or "WordCarousel"
  Do NOT use GlassCard for context — context needs motion.

BEAT_0 (first content beat) — introduce the concept visually:
  stat/number: "LayoutGiantNumber" or "DataGauge" or "TextCounter"
  concept with 4 keywords: "OrbitalHub" (keywords orbit centre)
  concept with 4 facts: "CardGrid" (floating cards grid)
  concept/system (cause→effect, A→B→C flow): "FlowConnector"
  person: resolvedAsset is fullscreen photo — use "TextKinetic" as overlay
  place: resolvedAsset is fullscreen photo — use "BackgroundGeometric" as overlay

BEAT_1 — always a data/chart primitive:
  percentage: "ShapeCircularProgress" or "ProgressBar" or "DataGauge"
  large number: "LayoutGiantNumber" or "TextCounter"
  comparison: "BarChart" or "DataRanking" or "LayoutSplitContrast"
  timeline: "DataTimeline"
  ch2 finance: "CandlestickChart"

BEAT_2 — variety beat, use something not yet used:
  "HexCarousel" (for 3-6 feature items — primary as comma-separated "Title:Body" pairs)
  "LayoutMultiColumn" (2-3 column comparison)
  "DataStatsCards" (2-4 stat cards)
  "TextGradient" or "TextWave" (rhythmic fact reveal)
  "StarTransition" (energy burst for surprising fact)
  "UIMockup" (product demo — white card with CTA button)
  "BackgroundDotGrid" (atmosphere layer for data/planning beats)

BEAT_3 — depth and atmosphere:
  concept cluster: "OrbitalHub" or "CardGrid"
  atmospheric: "BackgroundAurora" or "ShapeSpinningRings"
  team/network/satellite: "AvatarOrbit"
  logo/product reveal: "LightSweep"
  cinematic depth: "EffectVignette" (wraps GlassCard with dark edge vignette)

BEAT_4 / TWIST — document/report/stat reveal:
  "Card3DFlip" (flips in like an invoice — Primary: "Title:Value")
  "TextHorizontalSlide" (bullet list of items — Primary: comma-separated)
  ch6: "ParticleShootingStars" + "CelestialBody"
  ch4: "ThreeBrain"
  person/place with resolvedAsset: "GlassCard" is acceptable here as overlay

BEAT_4 — build to twist, high complexity:
  "CardGrid" or "DataRanking" or "HexCarousel" (3-6 items)
  ch2: "CandlestickChart" with stat typography
  ch4: "ThreeBrain"
  ch6: "CelestialBody"
  ch3: "ScrambleReveal"

TWIST beats — always a reveal primitive, never static:
  "TextMaskReveal" (dramatic wipe), "StarTransition" (energy burst)
  "TextGlitch" (shock/controversy), "Text3DFlip" (cinematic reveal)
  ch3: "ScrambleReveal" or "GlitchWord"
  NEVER use GlassCard for twist.

OUTRO beats — resolution, always forward motion:
  "WordCarousel" (cycling key concepts), "TextGradient" (vibrant close)
  "OrbitalHub" (concept cluster closing), "SaaSCard" for ch2
  NEVER repeat the hook primitive.

STRICT RULE: Each primitive may only appear ONCE per video.
If resolvedAsset is fullscreen (person/place), use a text/typography primitive as overlay.
GlassCard is ONLY permitted on beat_3 or when resolvedAsset is present with no better option.

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
