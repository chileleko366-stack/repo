#!/usr/bin/env python3
"""Stage 2: Script generation with LLM fallback chain."""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any

import requests

PROVIDERS = [
    {
        "name": "groq",
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "key_env": "GROQ_API_KEY",
        "model": "llama-3.3-70b-versatile",
    },
    {
        "name": "sambanova",
        "url": "https://api.sambanova.ai/v1/chat/completions",
        "key_env": "SAMBANOVA_API_KEY",
        "model": "Meta-Llama-3.3-70B-Instruct",
    },
    {
        "name": "gemini",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "key_env": "GEMINI_API_KEY",
        "model": "gemini-2.0-flash",
    },
    {
        "name": "nvidia",
        "url": "https://integrate.api.nvidia.com/v1/chat/completions",
        "key_env": "NVIDIA_API_KEY",
        "model": "meta/llama-3.3-70b-instruct",
    },
    {
        "name": "mistral",
        "url": "https://api.mistral.ai/v1/chat/completions",
        "key_env": "MISTRAL_API_KEY",
        "model": "mistral-small-latest",
    },
]

MAX_RETRIES = 8

SYSTEM_PROMPT = """You generate YouTube Shorts scripts for educational channels.
Output ONLY valid JSON matching the schema exactly. No markdown, no prose, no explanation.

Schema:
{
  "hook": "3-6 words. Specific. Number or proper noun. No ellipsis.",
  "context": "6-14 words max. One sentence with a real fact or number.",
  "beats": [
    {
      "narration": "6-18 words",
      "visual": {
        "kind": "person|brand|place|stat|typography|none|anatomy|celestial|chart|distance|map",
        "value": "exact name",
        "stat_value": 75,
        "prefix": "$",
        "suffix": "B"
      },
      "emphasis_keyword": "ONE word from narration",
      "pause_after": "breath|beat|cut",
      "bg_color": "#hex"
    }
  ],
  "twist": "4-10 words. Reframe or reveal.",
  "outro": {
    "narration": "10-25 words. Resolution + hook for next video.",
    "cta": "Follow for more [topic area] facts."
  }
}

Rules:
- hook: 3-9 words, contains number OR proper noun OR question mark OR contrast word
- hook: does NOT start with Did you know / What if / Here's why / You won't believe
- hook: does NOT end with ...
- context: 4-14 words
- exactly 5 beats
- each beat narration: 6-18 words
- twist: 4-12 words
- outro narration: 10-25 words
- bg_color must be a hex colour from the channel palette provided
- Each primitive in visual.kind must be used at most once across all beats
"""


def count_words(text: str) -> int:
    return len(text.strip().split())


def validate_script(script: dict, errors: list[str]) -> bool:
    errors.clear()
    hook = script.get("hook", "")
    hook_words = count_words(hook)
    if not (3 <= hook_words <= 9):
        errors.append(f"hook word count {hook_words} not in [3,9]")
    banned_starts = ("did you know", "what if", "here's why", "you won't believe")
    if any(hook.lower().startswith(b) for b in banned_starts):
        errors.append("hook starts with banned phrase")
    if hook.rstrip().endswith("..."):
        errors.append("hook ends with ellipsis")

    ctx_words = count_words(script.get("context", ""))
    if not (4 <= ctx_words <= 14):
        errors.append(f"context word count {ctx_words} not in [4,14]")

    beats = script.get("beats", [])
    if len(beats) != 5:
        errors.append(f"expected 5 beats, got {len(beats)}")
    for i, b in enumerate(beats):
        nw = count_words(b.get("narration", ""))
        if not (6 <= nw <= 18):
            errors.append(f"beat[{i}] narration {nw} words not in [6,18]")

    twist_words = count_words(script.get("twist", ""))
    if not (4 <= twist_words <= 12):
        errors.append(f"twist word count {twist_words} not in [4,12]")

    outro = script.get("outro", {})
    outro_words = count_words(outro.get("narration", ""))
    if not (10 <= outro_words <= 25):
        errors.append(f"outro narration {outro_words} words not in [10,25]")

    return len(errors) == 0


def _call_provider(provider: dict, messages: list[dict]) -> str | None:
    key = os.environ.get(provider["key_env"], "")
    if not key:
        return None
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    payload = {"model": provider["model"], "messages": messages, "temperature": 0.7, "max_tokens": 1200}
    try:
        resp = requests.post(provider["url"], headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as exc:
        print(f"  [{provider['name']}] error: {exc}")
        return None


def _extract_json(text: str) -> dict | None:
    text = text.strip()
    # Strip markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text, flags=re.MULTILINE)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in text
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return None


async def run_script_gen(context: dict) -> dict:
    channel_id: str = context["channel_id"]
    topic: str = context["topic"]
    brief: dict = context.get("research_brief", {})
    facts = brief.get("facts", [])

    from channelConfigs import CHANNEL_CONFIGS  # type: ignore
    cfg = CHANNEL_CONFIGS.get(channel_id, {})
    accent = cfg.accentColor if hasattr(cfg, "accentColor") else "#ffffff"
    bg = cfg.bgColor if hasattr(cfg, "bgColor") else "#000000"

    facts_text = "\n".join(f"- {f}" for f in facts[:6]) if facts else "No pre-fetched facts; use your knowledge."

    user_prompt = f"""Channel: {channel_id} — {cfg.name if hasattr(cfg, 'name') else channel_id}
Genre: {cfg.genre if hasattr(cfg, 'genre') else 'educational'}
Tone: {cfg.scriptTone if hasattr(cfg, 'scriptTone') else 'engaging'}
Accent colour: {accent}
Background colour: {bg}
Topic: {topic}

Research facts:
{facts_text}

Generate the script JSON now."""

    errors: list[str] = []
    provider_idx = 0
    attempt = 0

    while attempt < MAX_RETRIES:
        provider = PROVIDERS[provider_idx % len(PROVIDERS)]
        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if errors:
            messages.append({"role": "user", "content": user_prompt})
            messages.append({
                "role": "user",
                "content": f"Previous attempt had validation errors — fix them:\n" + "\n".join(f"- {e}" for e in errors),
            })
        else:
            messages.append({"role": "user", "content": user_prompt})

        print(f"  Attempt {attempt+1}/{MAX_RETRIES} via {provider['name']}...")
        raw = _call_provider(provider, messages)
        provider_idx += 1
        attempt += 1

        if raw is None:
            continue

        script = _extract_json(raw)
        if script is None:
            errors = ["response was not valid JSON"]
            continue

        if validate_script(script, errors):
            context["script"] = script
            return context

        print(f"  Validation failed: {errors}")

    raise RuntimeError(f"Script generation failed after {MAX_RETRIES} attempts. Last errors: {errors}")
