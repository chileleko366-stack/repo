"""
Script generation stage — multi-provider LLM with automatic rate-limit fallback.

Provider chain (tries each in order on 429 / unavailable key):
  1. Groq          GROQ_API_KEY        llama-3.3-70b-versatile
  2. SambaNova     SAMBANOVA_API_KEY   Meta-Llama-3.3-70B-Instruct
  3. xAI / Grok    XAI_API_KEY         grok-3-mini
  4. Gemini        GEMINI_API_KEY      gemini-2.0-flash
  5. Cerebras      CEREBRAS_API_KEY    llama3.3-70b   (free tier 60K TPM)
  6. NVIDIA NIM    NVIDIA_API_KEY      meta/llama-3.3-70b-instruct (free 1K credits)
  7. Mistral       MISTRAL_API_KEY     mistral-small-latest (free tier)

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
import uuid
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent))

from research import ResearchBrief


# ── Session 3 v3: Per-channel state isolation ────────────────────────────────

class ChannelJob:
    """
    Namespaces every pipeline run so no state leaks between channels or runs.
    Every fetch_*, generate_*, and compile_* function takes a ChannelJob
    and writes ONLY inside job.cache_root.
    """
    def __init__(self, channel_id: str, run_id: str | None = None):
        self.channel_id = channel_id
        self.run_id = run_id or str(uuid.uuid4())
        self.cache_root = Path(f"assets/cache/{channel_id}/{self.run_id}/")
        self.groq_context: list = []  # FRESH per job — never reused across channels or runs
        self.cache_root.mkdir(parents=True, exist_ok=True)

    def log_miss(self, visual_kind: str, visual_value: str) -> None:
        miss_log = Path("assets/cache/misses.log")
        miss_log.parent.mkdir(parents=True, exist_ok=True)
        with open(miss_log, "a") as f:
            f.write(f"[{self.channel_id}/{self.run_id}] MISS {visual_kind}:{visual_value}\n")


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


def _call_provider(provider: dict, system: str, user: str) -> str:
    """Call one provider. Raises _SkipProvider on 429/403/404, RuntimeError on other failures."""
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

    if resp.status_code in (429, 403, 404):
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
        except Exception as e:
            print(f"[script_gen] {provider['name']} error: {e}, trying next...")
            skipped.append(f"{provider['name']} (error)")

    raise RuntimeError(
        f"All LLM providers failed or rate limited: {', '.join(skipped)}"
    )


# ── Channel config ────────────────────────────────────────────────────────────

CHANNEL_TONES = {
    "ch1": (
        "Second-person ('you'), fast punchy sentences. The hook makes the viewer question "
        "their own behaviour RIGHT NOW — not someday, not in general, right now in this moment. "
        "Every mechanism beat names a specific neurotransmitter, study author, or brain region. "
        "The twist is a 'you already do this without knowing it' reveal. "
        "The outro lands the insight: restate what the viewer now understands that they didn't before, "
        "then close with one open question that makes them want to go deeper."
    ),
    "ch2": (
        "Tell the story of ONE specific number. Name the company, CEO, or event. Build cinematic "
        "tension around a real financial consequence. The mechanism explains the exact cause-and-effect "
        "chain. The twist is a counter-intuitive implication that reframes the number. "
        "The outro delivers the takeaway: what this specific number means for the viewer's understanding "
        "of how money actually works, then one question they should now be asking."
    ),
    "ch3": (
        "Clipped, declassified-file cadence. Name real people, real dates, real operations. "
        "Withhold the key fact until the twist. Every sentence earns the next. "
        "The outro does NOT say 'stay tuned' or 'follow for more'. Instead it lands on the "
        "one classified detail that still hasn't been released — implying the full story is bigger "
        "than what was just revealed."
    ),
    "ch4": (
        "Calm, analogy-led. Name the specific brain region, specific neurotransmitter, specific study. "
        "Explain the mechanism with one physical analogy. "
        "The outro poses the one open scientific question the field has NOT yet answered — "
        "something real researchers are actively debating, not a vague 'we still have more to learn'."
    ),
    "ch5": (
        "Reflective, past-tense documentary voice. Specific date, specific location, specific person. "
        "The twist is a quiet historical irony that recontextualises the event. "
        "The outro lands on a resonant connection to the present day — one sentence that makes "
        "this historical moment feel immediate and relevant, not distant."
    ),
    "ch6": (
        "Awe first, precision second. Name the specific body, mission, or phenomenon. Every beat "
        "includes one mind-expanding specific number with real context. "
        "The outro delivers the scale: put the key number in human terms "
        "(e.g. 'travelling at highway speed, you'd arrive in 4.6 billion years'), "
        "then close with the one unanswered question about this specific body or phenomenon."
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
  "hook": "<5-7 words — SHORT, specific claim or question about the topic. No generic openers.>",
  "context": "<10-14 words — one sentence establishing the specific stakes with a real number.>",
  "beats": [
    CRITICAL: This array MUST contain EXACTLY 5 objects — no more, no fewer.
    beat_0, beat_1, beat_2, beat_3, beat_4. Returning 3 or 4 beats is a HARD ERROR.
    {
      "narration": "<8-15 words, one complete spoken thought — do NOT split a sentence across beats>",
      "pause_after": "<breath|beat|cut> — MUST be exactly one of those three words. breath: flows immediately into next; beat: clear pause; cut: hard scene break",
      "visual": {
        "kind": "<person|brand|place|distance|map|anatomy|celestial|stat|chart|morph|typography|none>",
        "value": "<exact name: Daniel Kahneman / Tesla / Chernobyl / Mars>",
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
      "morph_from_previous": false,
      "bg_color": "<solid hex colour>"
    }
  ],
  "twist": "<<=20 words, reframes everything>",
  "outro": {
    "narration": "<12-16 words. TWO-PART STRUCTURE: (1) one sentence landing the core insight — what the viewer now knows. (2) one closing thought or question that creates forward momentum. Must feel COMPLETE, not cut off.>",
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
        "- hook:    5-7 words   (~2.5s) — SHORT AND PUNCHY. Longer hooks get cut off before viewers decide to watch.\n"
        "- context: 10-14 words (~5s)   — one sentence establishing the specific stakes.\n"
        "- beats:   8-15 words each     — one complete spoken thought per beat.\n"
        "- twist:   10-14 words (~5s)   — the reframe, delivered crisply.\n"
        "- outro:   12-16 words (~6s)   — landing + one closing thought. MUST FEEL COMPLETE.\n"
        "\n"
        "HOOK FRAMEWORK — the hook must do ALL of these:\n"
        "  a) Name or strongly imply the SPECIFIC topic (not a generic teaser)\n"
        "  b) Create a tension: either a surprising fact, a broken expectation, or a question\n"
        "     that the viewer cannot answer without watching\n"
        "  c) Be 5-7 words. Short hooks outperform long ones on Shorts because viewers\n"
        "     decide to swipe within 2 seconds — the hook must land before they decide.\n"
        "  d) Use present tense and second person where possible ('your brain', 'you do this')\n"
        "  e) NEVER start with: 'Did you know', 'What if I told you', 'This will', 'Here's why'\n"
        "     These are overused and viewers tune them out.\n"
        "  f) NEVER end with '...' — a strong hook is a complete thought, not a trailing off\n"
        "\n"
        "HOOK EXAMPLES by channel:\n"
        "  ch1 (psychology): 'You misremember 47% of your memories.' | 'Dopamine doesn't reward you. It lies.'\n"
        "  ch2 (finance):    'Enron hid $30 billion in one sentence.' | 'One cell cost $6 billion.'\n"
        "  ch3 (declassified): 'The CIA ran this for 20 years.' | 'This file was classified until 2017.'\n"
        "  ch4 (neuroscience): 'Your prefrontal cortex isn't done yet.' | 'One synapse fires 500 times per second.'\n"
        "  ch5 (documentary):  'On June 12, 1944, nobody noticed him.' | 'She predicted it. Nobody listened.'\n"
        "  ch6 (space):       'Jupiter could swallow 1,300 Earths.' | 'This star's light left before humans existed.'\n"
        "\n"
        "RULES:\n"
        "0. CRITICAL — The 'beats' array MUST contain EXACTLY 5 objects. Not 2, not 3, not 4. EXACTLY 5.\n"
        "   beat_0, beat_1, beat_2, beat_3, beat_4. Any other count is a validation failure.\n"
        "1. This script is about the SPECIFIC topic above - NOT a generic overview of the channel niche.\n"
        "2. Every factual claim must use one of the research facts provided below.\n"
        "3. Every mechanism beat must explain HOW something works (mechanism + implication), not just WHAT.\n"
        "4. Every beat must name at least one specific entity (person, place, brand, statistic, distance).\n"
        "5. The outro is a LANDING, not a cliffhanger. Two sentences: (1) restate the core insight the\n"
        "   viewer now has, (2) one closing thought or question that feels COMPLETE. Never trail off.\n"
        "6. WORD COUNT IS STRICT - each section must stay within its word limit.\n"
        "7. A SPECIFIC NUMBER MUST APPEAR IN THE SCRIPT — this is mandatory. If research gave you\n"
        "   no numbers, use a well-known scientific measurement for the topic: timing in ms,\n"
        "   brain region size in cm, study sample size, percentage change, a year. Any real digit\n"
        "   works. Scripts with zero digits will be rejected and will fail.\n"
        "8. After each beat where pause_after is 'cut', the NEXT beat must open with a re-hook\n"
        "   sentence that stands alone — fresh tension, as if a new viewer just arrived at that\n"
        "   moment. Use 'cut' sparingly: max 2 cut transitions across all 5 beats.\n"
        "9. Beat index 2 (the middle beat, ~40% through the video) must be your STRONGEST secondary\n"
        "   curiosity gap — a partial reveal that withholds one key implication. This is the\n"
        "   scroll-stopper for viewers who almost swiped away.\n"
        "10. NUMBERS IN NARRATION: Write numbers as words/mixed form that TTS reads naturally:\n"
        "    - Large numbers: '1 million', '4.6 billion', '93 million' (NOT '1,000,000')\n"
        "    - Percentages: '73%' or 'seventy-three percent' (both work)\n"
        "    - Years: '1963', '2024' (digits are fine for years)\n"
        "    - Currency: '$1.4 billion' or '1.4 billion dollars' (NOT '$1,400,000,000')\n"
        "    - The stat_value field uses the raw number: stat_value: 1000000\n"
        "    - The narration says: 'one million' or '1 million'\n"
        "11. PERSON NAMES — visual.value for kind='person' must be the full clean proper name:\n"
        "   NO title prefixes (President, Dr., Senator, General), NO abbreviations, NO truncation.\n"
        "   Correct: 'John F. Kennedy', 'Albert Einstein'. Wrong: 'President John F', 'Dr. Einstein'.\n"
        "\n"
        f"RESEARCH FACTS (use these, never invent):\n{facts_str}\n"
        "\n"
        f"NAMED ENTITIES FOUND IN RESEARCH:\n{entities_str}\n"
        "\n"
        "Return ONLY valid JSON - no markdown fences, no commentary outside the JSON."
    )


def build_user_prompt(topic: str, brief: ResearchBrief) -> str:
    facts_lines = "\n".join(f"- {f}" for f in brief.key_facts)
    if brief.specific_numbers:
        numbers = "\n".join(f"- {n}" for n in brief.specific_numbers)
        numbers_note = "At least 1 of these must appear in the script."
    else:
        numbers = "- none found in research sources"
        numbers_note = (
            "REQUIRED: invent NONE — but you MUST include at least one real scientific measurement "
            "for this topic (e.g. a timing in milliseconds, a brain region dimension in cm, a study "
            "sample size, a known percentage, or a year). Scripts with zero digits are rejected."
        )
    return (
        f"Write a 35-second Shorts script about: {topic}\n"
        "\n"
        f"Use these real facts (mandatory - no invented claims):\n{facts_lines}\n"
        "\n"
        f"Specific numbers found in research ({numbers_note}):\n{numbers}\n"
        "\n"
        f"Return ONLY this JSON structure - nothing else:\n{SCRIPT_SCHEMA}"
    )


# ── Validation ────────────────────────────────────────────────────────────────

VALID_VISUAL_KINDS = {
    'person', 'brand', 'place', 'distance', 'map', 'anatomy',
    'celestial', 'stat', 'chart', 'morph', 'typography', 'none',
}
VALID_PAUSE_AFTER = {'breath', 'beat', 'cut'}

# distance/map use from/to/place fields, not value — excluded from value check
ENTITY_KINDS = {'person', 'brand', 'place', 'anatomy'}
CONTRAST_MARKERS = {"but", "yet", "never", "actually", "wrong", "surprising", "wait", "secret", "plot"}

# ── Pre-validation normalization ──────────────────────────────────────────────

_PAUSE_NORMALIZE: dict[str, str] = {
    "beats": "beat", "breaths": "breath", "cuts": "cut",
    "pause": "beat", "short pause": "breath", "long pause": "beat",
    "hard cut": "cut", "scene break": "cut", "scene change": "cut",
    "none": "cut", "null": "cut",
}

_KIND_NORMALIZE: dict[str, str] = {
    "text": "typography", "words": "typography", "quote": "typography",
    "graph": "chart", "line graph": "chart", "bar graph": "chart",
    "line chart": "chart", "pie chart": "chart", "bar chart": "chart",
    "statistic": "stat", "statistics": "stat", "number": "stat",
    "metric": "stat", "data": "stat",
    "person photo": "person", "photo": "person", "portrait": "person", "headshot": "person",
    "brand logo": "brand", "logo": "brand", "company": "brand", "corporation": "brand",
    "location": "place", "city": "place", "country": "place", "landmark": "place",
    "planet": "celestial", "star": "celestial", "moon": "celestial", "galaxy": "celestial",
    "space": "celestial", "universe": "celestial",
    "body": "anatomy", "organ": "anatomy", "brain": "anatomy",
    "null": "none", "n/a": "none", "na": "none",
}


def _normalize_script(script: dict) -> dict:
    """Silently fix common LLM field-value mistakes before validation."""
    for beat in script.get("beats", []):
        p = str(beat.get("pause_after", "")).strip().lower()
        if p not in VALID_PAUSE_AFTER:
            beat["pause_after"] = _PAUSE_NORMALIZE.get(p, "cut")

        visual = beat.get("visual")
        if isinstance(visual, dict):
            k = str(visual.get("kind", "")).strip().lower()
            if k not in VALID_VISUAL_KINDS:
                visual["kind"] = _KIND_NORMALIZE.get(k, "none")
            if "value" in visual and visual["value"] is None:
                visual["value"] = ""

        kw = beat.get("emphasis_keyword", "")
        if kw:
            beat["emphasis_keyword"] = str(kw).strip().strip("*").strip()

    return script


def validate_script(script: dict, brief: ResearchBrief) -> list[str]:
    errors = []
    hook = script.get("hook", "")
    if not hook:
        errors.append("missing hook")
    elif len(hook.split()) > 9:
        errors.append(
            f"hook too long ({len(hook.split())} words) — max 9 words. "
            "Short hooks land before viewers swipe."
        )
    elif len(hook.split()) < 3:
        errors.append(f"hook too short ({len(hook.split())} words) — min 3 words.")
    else:
        hook_lower = hook.lower()
        hook_words = set(re.split(r'\W+', hook_lower))

        # Banned openers — overused, viewers tune them out
        BAD_OPENERS = [
            "did you know", "what if i told you", "this will", "here's why",
            "you won't believe", "the truth about", "everything you know",
        ]
        for bad in BAD_OPENERS:
            if hook_lower.startswith(bad):
                errors.append(
                    f"hook starts with overused phrase '{bad}' — write a specific claim instead"
                )
                break

        # No trailing ellipsis — hooks must be complete thoughts
        if hook.rstrip().endswith("..."):
            errors.append("hook ends with '...' — hooks must be complete thoughts, not trailing teasers")

        # Must have a number, a question, a contrast word, OR a proper noun
        has_number   = bool(re.search(r'\d', hook))
        has_question = "?" in hook
        has_contrast = bool(hook_words & CONTRAST_MARKERS)
        has_specific = bool(re.search(r'\b[A-Z][a-z]+\b', hook))
        if not (has_number or has_question or has_contrast or has_specific):
            errors.append(
                "hook is too generic — needs a specific number, proper noun, question, or contrast. "
                "Example: 'Your brain lies to you 47 times a day.' not 'Your brain does something surprising.'"
            )
    if not script.get("context"):
        errors.append("missing context")
    beats = script.get("beats", [])
    if len(beats) != 5:
        errors.append(f"need exactly 5 beats, got {len(beats)}")
    for i, beat in enumerate(beats):
        words = len(beat.get("narration", "").split())
        if words < 6:
            errors.append(f"beat {i}: narration too short ({words} words, min 6)")
        if words > 18:
            errors.append(f"beat {i}: narration too long ({words} words, max 18)")
        kind = beat.get("visual", {}).get("kind", "")
        if not kind:
            errors.append(f"beat {i}: missing visual.kind")
        elif kind not in VALID_VISUAL_KINDS:
            errors.append(f"beat {i}: invalid visual.kind '{kind}'")
        elif kind in ENTITY_KINDS and not str(beat.get("visual", {}).get("value", "")).strip():
            errors.append(f"beat {i}: visual.kind='{kind}' requires a non-empty visual.value (exact name)")
        pause = beat.get("pause_after", "")
        if pause not in VALID_PAUSE_AFTER:
            errors.append(f"beat {i}: invalid or missing pause_after '{pause}' — must be breath|beat|cut")
        # emphasis_keyword must be a non-empty single word without asterisks
        kw = str(beat.get("emphasis_keyword", "")).strip().strip("*")
        if not kw:
            errors.append(f"beat {i}: missing emphasis_keyword")
    if not script.get("twist"):
        errors.append("missing twist")
    outro = script.get("outro", {})
    if not outro.get("narration"):
        errors.append("missing outro.narration")
    else:
        outro_words = len(outro["narration"].split())
        if outro_words < 10:
            errors.append(
                f"outro too short ({outro_words} words, min 10) — needs a proper two-part landing"
            )
        if outro_words > 30:
            errors.append(f"outro too long ({outro_words} words, max 30)")
    if not outro.get("cta"):
        errors.append("missing outro.cta")
    return errors


def validate_continuity(script: dict, llm_fn=None) -> list[str]:
    """
    Session 3 v3 — detects three classes of 'mix-up':
    1. An entity referred to by inconsistent names across beats.
    2. The same metric stated with two different numbers.
    3. A beat's visual.kind not matching what its narration describes.
    """
    errors = []
    beats = script.get("beats", [])

    # 1. Entity name consistency — whole-word overlap check
    # Uses word-boundary regex so "LHC" (3 chars) is NOT flagged as the same entity as "LHCb" (4 chars),
    # while "Musk" IS flagged as overlapping "Elon Musk".
    def _name_overlaps(a: str, b: str) -> bool:
        # Skip if one is a prefix/extension of the other (e.g. "Voyager" vs "Voyager 1")
        if a.startswith(b) or b.startswith(a):
            return False
        try:
            return bool(re.search(r'\b' + re.escape(a) + r'\b', b)) or \
                   bool(re.search(r'\b' + re.escape(b) + r'\b', a))
        except re.error:
            return False

    # Key on (kind, norm) so that differently-typed entities (e.g. the planet Mars vs
    # the spacecraft Mars Express) are never compared — only same-kind references are checked.
    entity_map: dict[tuple, str] = {}  # (kind, normalized) → first occurrence value
    for beat in beats:
        visual = beat.get("visual", {})
        val  = str(visual.get("value", ""))
        kind = visual.get("kind", "none")
        if val and kind != "none":
            norm = re.sub(r"\s+", " ", val.strip().lower())
            existing = [(k, n) for (k, n) in entity_map if k == kind and _name_overlaps(norm, n)]
            for key in existing:
                if entity_map[key] != val:
                    errors.append(
                        f"Entity name inconsistency: '{entity_map[key]}' vs '{val}' — pick one and use it throughout"
                    )
            entity_map[(kind, norm)] = val

    # 2. Numeric consistency — same noun phrase should not carry two different numbers
    number_contexts: dict[str, list[str]] = {}
    all_text = (
        [script.get("hook", ""), script.get("context", ""), script.get("twist", "")]
        + [b.get("narration", "") for b in beats]
    )
    for sentence in all_text:
        for m in re.finditer(r"(\d[\d,\.]*\s*(?:billion|million|thousand|%|km|kg|°|ly)?)", sentence, re.IGNORECASE):
            context_start = max(0, m.start() - 20)
            ctx_key = re.sub(r"[^a-z\s]", "", sentence[context_start:m.start()].lower().strip())[-15:]
            if len(ctx_key) >= 10:
                number_contexts.setdefault(ctx_key, []).append(m.group(0).strip())

    for ctx, vals in number_contexts.items():
        unique = list(set(vals))
        if len(unique) > 1:
            errors.append(f"Conflicting numbers for context '…{ctx}': {unique}")

    # 3. Number presence advisory (warn, never block — retry loops make things worse)
    full_text = " ".join([
        script.get("hook", ""),
        script.get("context", ""),
        *[b.get("narration", "") for b in beats],
        script.get("twist", ""),
        script.get("outro", {}).get("narration", ""),
    ])
    if not re.search(r"\d", full_text):
        errors.append("advisory: no specific digits in script — consider adding a year, count, or measurement")

    # 4. Visual–narration agreement (lightweight keyword match, no LLM needed)
    PERSON_WORDS = {"who", "person", "born", "died", "scientist", "researcher", "ceo", "president", "author", "founder"}
    PLACE_WORDS = {"city", "country", "located", "built", "founded", "in the", "at the", "near"}
    for i, beat in enumerate(beats):
        kind = beat.get("visual", {}).get("kind", "none")
        narration = beat.get("narration", "").lower()
        words_in = set(narration.split())
        if kind == "person" and not words_in & PERSON_WORDS and not beat.get("visual", {}).get("value"):
            errors.append(f"Beat {i}: visual.kind='person' but narration doesn't mention a person — check visual tag")
        if kind == "place" and not words_in & PLACE_WORDS and not beat.get("visual", {}).get("value"):
            errors.append(f"Beat {i}: visual.kind='place' but narration doesn't reference a place — check visual tag")

    return errors


class ValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__("; ".join(errors))


# ── Main entry point ──────────────────────────────────────────────────────────

def generate_script(topic: str, channel_id: str, brief: ResearchBrief, max_retries: int = 8) -> dict:
    system = build_system_prompt(channel_id, topic, brief)
    base_user = build_user_prompt(topic, brief)
    user = base_user
    script = {}

    for attempt in range(1, max_retries + 1):
        print(f"[script_gen] attempt {attempt}/{max_retries} for topic: {topic!r}")
        try:
            raw = llm_complete(system, user)
        except RuntimeError as exc:
            print(f"[script_gen] all providers exhausted on attempt {attempt}: {exc}")
            if attempt < max_retries:
                time.sleep(10)
                continue
            raise
        clean = raw.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```[a-z]*\n?", "", clean)
            clean = re.sub(r"\n?```$", "", clean)
        try:
            script = json.loads(clean)
        except json.JSONDecodeError as e:
            print(f"[script_gen] JSON parse error on attempt {attempt}: {e}")
            if attempt < max_retries:
                user = base_user + "\n\nPREVIOUS ATTEMPT ERROR: returned invalid JSON — return only a valid JSON object."
                continue
            raise ValueError(f"Could not parse script JSON after {max_retries} attempts") from e
        script["topic"] = topic
        script["channel_id"] = channel_id
        _normalize_script(script)
        errors = validate_script(script, brief)
        if errors:
            print(f"[script_gen] validation failed on attempt {attempt}: {errors}")
            error_lines = "\n".join(f"- {e}" for e in errors)
            user = base_user + f"\n\nFIX THESE ERRORS IN YOUR NEXT RESPONSE:\n{error_lines}"
            continue
        # Continuity check is advisory — log issues but never block on them
        continuity_warnings = validate_continuity(script)
        if continuity_warnings:
            print(f"[script_gen] continuity warnings (non-blocking): {continuity_warnings}")
        print(f"[script_gen] script validated on attempt {attempt}")
        return script

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
