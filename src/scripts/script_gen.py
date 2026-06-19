"""
Script generation stage.
Research brief -> Groq LLM -> validated JSON script targeting 35-second Shorts.

35s structure:
  hook     (~3s, <=12 words)
  context  (~3s, <=18 words)
  5 beats  (~4s each, 20-28 words each)  -> 20s
  twist    (~3s, <=20 words)
  outro    (~3.5s, <=18 words)
  Total ~35s
"""

import os
import re
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from research import ResearchBrief

try:
    from groq import Groq
    _groq_client = None

    def _get_client() -> Groq:
        global _groq_client
        if _groq_client is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise EnvironmentError("GROQ_API_KEY not set in environment")
            _groq_client = Groq(api_key=api_key)
        return _groq_client

except ImportError:
    raise ImportError("groq package required: pip install groq")


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
      "narration": "<20-28 words, one specific mechanism or fact>",
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


def build_system_prompt(channel_id: str, topic: str, brief: ResearchBrief) -> str:
    tone = CHANNEL_TONES.get(channel_id, CHANNEL_TONES["ch1"])
    name = CHANNEL_NAMES.get(channel_id, channel_id)
    facts_str = "\
".join(f"- {f}" for f in brief.key_facts)
    entities_str = ", ".join(brief.named_entities[:10]) if brief.named_entities else "none found"

    return f"""You write scripts for the YouTube Shorts channel: {name}
Topic: {topic}
Tone: {tone}

TARGET LENGTH: 35 seconds total.
- hook:    <=12 words  (~3s)
- context: <=18 words  (~3s)
- beats:   exactly 5 beats, each 20-28 words (~4s each = 20s)
- twist:   <=20 words  (~3s)
- outro.narration: <=18 words  (~3.5s)

RULES:
1. This script is about the SPECIFIC topic above - NOT a generic overview of the channel niche.
2. Every factual claim must use one of the research facts provided below.
3. Every mechanism beat must explain HOW something works (mechanism + implication), not just WHAT it is.
4. Every beat must name at least one specific entity (person, place, brand, statistic, distance).
5. The outro loops back to the hook's specific promise and opens exactly one new curiosity gap.
6. WORD COUNT IS STRICT - each section must stay within its word limit.

RESEARCH FACTS (use these, never invent):
{facts_str}

NAMED ENTITIES FOUND IN RESEARCH:
{entities_str}

Return ONLY valid JSON - no markdown fences, no commentary outside the JSON."""


def build_user_prompt(topic: str, brief: ResearchBrief) -> str:
    numbers = "\
".join(f"- {n}" for n in brief.specific_numbers) if brief.specific_numbers else "- none"
    return f"""Write a 35-second Shorts script about: {topic}

Use these real facts (mandatory - no invented claims):
{chr(10).join(f'- {f}' for f in brief.key_facts)}

Specific numbers found in research (at least 2 must appear in the script):
{numbers}

Return ONLY this JSON structure - nothing else:
{SCRIPT_SCHEMA}"""


def groq_complete(system: str, user: str, model: str = "llama-3.3-70b-versatile") -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        temperature=0.7,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or ""


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
        if words < 18:
            errors.append(f"beat {i}: narration too short ({words} words, min 18)")
        if words > 32:
            errors.append(f"beat {i}: narration too long ({words} words, max 28)")
        if not beat.get("visual") or not beat["visual"].get("kind"):
            errors.append(f"beat {i}: missing visual.kind")
        if beat.get("visual", {}).get("kind") == "none" and i < 4:
            errors.append(f"beat {i}: kind=none not allowed for beats 0-3")
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
    number_count = len(re.findall(r"\\b\\d[\\d,\\.]*\\b", full_text))
    if number_count < 2:
        errors.append(f"only {number_count} specific number(s) in script - need >=2")
    return errors


class ValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("; ".join(errors))


def generate_script(topic: str, channel_id: str, brief: ResearchBrief, max_retries: int = 3) -> dict:
    system = build_system_prompt(channel_id, topic, brief)
    user   = build_user_prompt(topic, brief)

    for attempt in range(1, max_retries + 1):
        print(f"[script_gen] attempt {attempt}/{max_retries} for topic: {topic!r}")
        raw = groq_complete(system, user)
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\
?", "", clean)
            clean = re.sub(r"\
?```$", "", clean)
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
        user = (
            user
            + f"\
\
PREVIOUS ATTEMPT FAILED VALIDATION - fix these errors:\
"
            + "\
".join(f"- {e}" for e in errors)
        )

    raise ValidationError(validate_script(script, brief))


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    load_dotenv()
    from research import research
    topic   = sys.argv[1] if len(sys.argv) > 1 else "Dunning-Kruger effect"
    channel = sys.argv[2] if len(sys.argv) > 2 else "ch1"
    brief  = research(topic, channel)
    script = generate_script(topic, channel, brief)
    print(json.dumps(script, indent=2))
