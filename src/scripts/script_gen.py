"""
Script generation stage — multi-provider LLM with automatic rate-limit fallback.

Provider chain (tries each in order on 429 / unavailable key):
  1. Groq          GROQ_API_KEY        llama-3.3-70b-versatile
  2. SambaNova     SAMBANOVA_API_KEY   Meta-Llama-3.3-70B-Instruct
  3. xAI / Grok    XAI_API_KEY         grok-3-mini
  4. Gemini        GEMINI_API_KEY      gemini-2.0-flash

All providers expose an OpenAI-compatible /chat/completions endpoint,
so a single requests-based caller handles everything.

35s structure:
  hook     (~3s, <=12 words)
  context  (~3s, <=18 words)
  5 beats  (~4s each, 8-20 words each)  -> 20s
  twist    (~3s, <=20 words)
  outro    (~3.5s, <=18 words)
  Total ~35s
"""

import os
import re
import json
import sys
import time
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))

from research import ResearchBrief


# ── Provider registry ─────────────────────────────────────────────────────────

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
        "name": "xai",
        "url": "https://api.x.ai/v1/chat/completions",
        "key_env": "XAI_API_KEY",
        "model": "grok-3-mini",
    },
    {
        "name": "gemini",
        "url": "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "key_env": "GEMINI_API_KEY",
        "model": "gemini-2.0-flash",
    },
]


def _call_provider(provider: dict, system: str, user: str) -> str:
    """Call one provider. Raises _SkipProvider on 429/403, RuntimeError on other failures."""
    api_key = os.getenv(provider["key_env"])
    if not api_key:
        raise EnvironmentError(f"{provider['key_env']} not set")

    payload = {
        "model": provider["model"],
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
        "response_format": {"type": "json_object"},
    }

    resp = requests.post(
        provider["url"],
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )

    if resp.status_code in (429, 403):
        raise _SkipProvider(provider["name"], resp.status_code)
    if not resp.ok:
        raise RuntimeError(
            f"[{provider['name']}] HTTP {resp.status_code}: {resp.text[:300]}"
        )

    data = resp.json()
    return data["choices"][0]["message"]["content"] or ""


class _SkipProvider(Exception):
    def __init__(self, name, status):
        self.name = name
        self.status = status
        super().__init__(f"{name} HTTP {status}")


def llm_complete(system: str, user: str) -> str:
    """
    Try each provider in order. On 429, move to the next immediately.
    If all providers are rate-limited or missing keys, raises RuntimeError.
    """
    skipped = []
    for provider in PROVIDERS:
        key = os.getenv(provider["key_env"])
        if not key:
            skipped.append(f"{provider['name']} (no key)")
            continue
        try:
            result = _call_provider(provider, system, user)
            if skipped:
                print(f"[script_gen] used {provider['name']} (skipped: {', '.join(skipped)})")
            else:
                print(f"[script_gen] used {provider['name']}")
            return result
        except _SkipProvider as e:
            reason = "rate limited" if e.status == 429 else f"unavailable ({e.status})"
            print(f"[script_gen] {provider['name']} {reason}, trying next...")
            skipped.append(f"{provider['name']} ({e.status})")
        except EnvironmentError:
            skipped.append(f"{provider['name']} (no key)")

    raise RuntimeError(
        f"All LLM providers failed or rate limited: {', '.join(skipped)}"
    )


# ── Channel config ────────────────────────────────────────────────────────────

CHANNEL_TONES = {
    "ch1": (
        "Second-person ('you'), fast punchy sentences. The hook makes the viewer question "
        "their own behaviour right now. Every mechanism beat names a specific neurotransmitter, "
        "study author, or brain region. The twist is a 'you already do this without knowing it' reveal."
    ),
    "ch2": (
        "Tell the story of ONE specific number. Name the company, CEO, or event. Build cinematic "
        "tension around a real financial consequence. The mechanism explains the exact cause-and-effect "
        "chain. The twist is a counter-intuitive implication that reframes the number."
    ),
    "ch3": (
        "Clipped, declassified-file cadence. Name real people, real dates, real operations. "
        "Withhold the key fact until the twist. Every sentence earns the next. "
        "The outro implies there is more still classified."
    ),
    "ch4": (
        "Calm, analogy-led. Name the specific brain region, specific neurotransmitter, specific study. "
        "Explain the mechanism with one physical analogy. The outro poses the open scientific question "
        "the field has not yet answered."
    ),
    "ch5": (
        "Reflective, past-tense documentary voice. Specific date, specific location, specific person. "
        "The twist is a quiet historical irony that recontextualises the event. "
        "The outro lands on a resonant connection to the present."
    ),
    "ch6": (
        "Awe first, precision second. Name the specific body, mission, or phenomenon. Every beat "
        "includes one mind-expanding specific number with real context (not 'millions' - say '4.6 billion'). "
        "Facts checked against research sources."
    ),
}

CHANNEL_NAMES = {
    "ch1": "Dopamine Loop",
    "ch2": "FinanceFiction",
    "ch3": "Redacted",
    "ch4": "The Grey Matter",
    "ch5": "The Quiet Record",
    "ch6": "Red Space Facts",
}


SCRIPT_SCHEMA = '''
{
  "hook": "<<=12 words, opens a curiosity loop about the specific topic>",
  "context": "<<=18 words, specific stakes with a real number from research>",
  "beats": [
    {
      "narration": "<8-20 words, one specific mechanism or fact>",
      "visual": {
        "kind": "<person|brand|product|place|distance|map|anatomy|celestial|stat|stock_video|none>",
        "value": "<exact name: Daniel Kahneman / Tesla / Chernobyl / Mars>",
        "query": "<if stock_video: specific 5-word search query>",
        "from": "<if distance: origin place>",
        "to": "<if distance: destination place>",
        "unit": "<if distance: km or miles>",
        "place": "<if map: city name>",
        "zoom": "<if map: OSM zoom level int>",
        "label": "<if map: caption text>",
        "prefix": "<if stat: currency symbol>",
        "suffix": "<if stat: unit label>",
        "stat_value": "<if stat: numeric value as number>"
      },
      "emphasis_keyword": "<one word, most important in beat, no asterisks>",
      "morph_from": "<previous beat emphasis_keyword or null>",
      "bg_color": "<solid hex colour>"
    }
  ],
  "twist": "<<=20 words, reframes everything>",
  "outro": {
    "narration": "<<=18 words, loops to hook, opens one curiosity gap>",
    "visual": { "kind": "stat", "stat_value": 0, "prefix": "", "suffix": "" },
    "cta": "<channel-specific CTA, NOT like and subscribe>"
  }
}'''


# ── Prompt builders ───────────────────────────────────────────────────────────

def build_system_prompt(channel_id: str, topic: str, brief: ResearchBrief) -> str:
    tone = CHANNEL_TONES.get(channel_id, CHANNEL_TONES["ch1"])
    name = CHANNEL_NAMES.get(channel_id, channel_id)
    facts_str = "\n".join(f"- {f}" for f in brief.key_facts)
    entities_str = ", ".join(brief.named_entities[:10]) if brief.named_entities else "none found"

    return (
        f"You write scripts for the YouTube Shorts channel: {name}\n"
        f"Topic: {topic}\n"
        f"Tone: {tone}\n"
        "\n"
        "TARGET LENGTH: 35 seconds total.\n"
        "- hook:    <=12 words  (~3s)\n"
        "- context: <=18 words  (~3s)\n"
        "- beats:   exactly 5 beats, each 8-20 words (~4s each = 20s)\n"
        "- twist:   <=20 words  (~3s)\n"
        "- outro.narration: <=18 words  (~3.5s)\n"
        "\n"
        "RULES:\n"
        "1. This script is about the SPECIFIC topic above - NOT a generic overview of the channel niche.\n"
        "2. Every factual claim must use one of the research facts provided below.\n"
        "3. Every mechanism beat must explain HOW something works (mechanism + implication), not just WHAT.\n"
        "4. Every beat must name at least one specific entity (person, place, brand, statistic, distance).\n"
        "5. The outro loops back to the hook's specific promise and opens exactly one new curiosity gap.\n"
        "6. WORD COUNT IS STRICT - each section must stay within its word limit.\n"
        "\n"
        f"RESEARCH FACTS (use these, never invent):\n{facts_str}\n"
        "\n"
        f"NAMED ENTITIES FOUND IN RESEARCH:\n{entities_str}\n"
        "\n"
        "Return ONLY valid JSON - no markdown fences, no commentary outside the JSON."
    )


def build_user_prompt(topic: str, brief: ResearchBrief) -> str:
    facts_lines = "\n".join(f"- {f}" for f in brief.key_facts)
    numbers = "\n".join(f"- {n}" for n in brief.specific_numbers) if brief.specific_numbers else "- none"
    return (
        f"Write a 35-second Shorts script about: {topic}\n"
        "\n"
        f"Use these real facts (mandatory - no invented claims):\n{facts_lines}\n"
        "\n"
        f"Specific numbers found in research (at least 1 must appear in the script):\n{numbers}\n"
        "\n"
        f"Return ONLY this JSON structure - nothing else:\n{SCRIPT_SCHEMA}"
    )


# ── Validation ────────────────────────────────────────────────────────────────

def validate_script(script: dict, brief: ResearchBrief) -> list[str]:
    errors = []
    if not script.get("hook"):
        errors.append("missing hook")
    elif len(script["hook"].split()) > 14:
        errors.append(f"hook too long ({len(script['hook'].split())} words, max 12)")
    if not script.get("context"):
        errors.append("missing context")
    beats = script.get("beats", [])
    if len(beats) != 5:
        errors.append(f"need exactly 5 beats, got {len(beats)}")
    for i, beat in enumerate(beats):
        words = len(beat.get("narration", "").split())
        if words < 3:
            errors.append(f"beat {i}: narration too short ({words} words, min 3)")
        if words > 25:
            errors.append(f"beat {i}: narration too long ({words} words, max 20)")
        if not beat.get("visual") or not beat["visual"].get("kind"):
            errors.append(f"beat {i}: missing visual.kind")
        if beat.get("visual", {}).get("kind") == "none" and i < 4:
            # auto-correct: replace none-kind on early beats with stock_video
            beat["visual"] = {
                "kind": "stock_video",
                "query": f"{script.get('topic', 'nature')} cinematic footage",
            }
        if not beat.get("emphasis_keyword"):
            errors.append(f"beat {i}: missing emphasis_keyword")
        if not beat.get("bg_color", "").startswith("#"):
            errors.append(f"beat {i}: bg_color must be a hex colour")
    if not script.get("twist"):
        errors.append("missing twist")
    outro = script.get("outro", {})
    if not outro.get("narration"):
        errors.append("missing outro.narration")
    if not outro.get("cta"):
        errors.append("missing outro.cta")
    full_text = " ".join([
        script.get("hook", ""),
        script.get("context", ""),
        *[b.get("narration", "") for b in beats],
        script.get("twist", ""),
        outro.get("narration", ""),
    ])
    number_count = len(re.findall(r"\d[\d,\.]*", full_text))
    if number_count < 1:
        errors.append("no specific numbers in script - need at least 1")
    return errors


class ValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("; ".join(errors))


# ── Main entry point ──────────────────────────────────────────────────────────

def generate_script(topic: str, channel_id: str, brief: ResearchBrief, max_retries: int = 3) -> dict:
    system = build_system_prompt(channel_id, topic, brief)
    user = build_user_prompt(topic, brief)
    script = {}

    for attempt in range(1, max_retries + 1):
        print(f"[script_gen] attempt {attempt}/{max_retries} for topic: {topic!r}")
        raw = llm_complete(system, user)
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\n?", "", clean)
            clean = re.sub(r"\n?```$", "", clean)
        try:
            script = json.loads(clean)
        except json.JSONDecodeError as e:
            print(f"[script_gen] JSON parse error on attempt {attempt}: {e}")
            if attempt == max_retries:
                raise ValueError(f"Could not parse script JSON after {max_retries} attempts") from e
            continue
        script["topic"] = topic
        script["channel_id"] = channel_id
        errors = validate_script(script, brief)
        if not errors:
            print(f"[script_gen] script validated on attempt {attempt}")
            return script
        print(f"[script_gen] validation failed on attempt {attempt}: {errors}")
        error_lines = "\n".join(f"- {e}" for e in errors)
        user = user + f"\n\nPREVIOUS ATTEMPT FAILED VALIDATION - fix these errors:\n{error_lines}"

    raise ValidationError(validate_script(script, brief))


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    from research import research
    topic = sys.argv[1] if len(sys.argv) > 1 else "Dunning-Kruger effect"
    channel = sys.argv[2] if len(sys.argv) > 2 else "ch1"
    brief = research(topic, channel)
    script = generate_script(topic, channel, brief)
    print(json.dumps(script, indent=2))
