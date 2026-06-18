"""
Main pipeline orchestrator.
Usage:
  python src/scripts/pipeline.py --channel ch1 --topic "Dunning-Kruger effect"
  python src/scripts/pipeline.py --channel ch6 --topic auto   # auto-picks a topic

Pipeline stages (ported from ShortGPT's numbered step dict):
  1. research   — fetch real facts from Wikipedia / PubMed / NASA etc.
  2. script     — Groq LLM → validated 35s script JSON
  3. manifest   — timing layout → manifest JSON
  4. tts        — edge-tts word-boundary audio per beat
  5. assets     — resolver: person/brand/place/map       [S4 — not built yet]
  6. stock      — contextual stock media selection       [S5 — not built yet]
  7. render     — npx remotion render                    [S8-S13 — not built yet]
"""

import argparse
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Repo root on Python path
sys.path.insert(0, str(Path(__file__).parent))

from research import research, ResearchBrief
from script_gen import generate_script
from manifest_builder import build_manifest, save_manifest
from mock_data import get_mock_brief
from tts import generate_all_beats, manifest_to_captions


# ── Auto topic seeds per channel ──────────────────────────────────────────────

AUTO_TOPICS: dict[str, list[str]] = {
    "ch1": [
        "Dunning-Kruger effect",
        "confirmation bias mechanism",
        "dopamine reward prediction error",
        "cognitive dissonance",
        "anchoring bias",
    ],
    "ch2": [
        "Enron accounting scandal",
        "2010 Flash Crash",
        "GameStop short squeeze 2021",
        "Theranos fraud",
        "Lehman Brothers collapse",
    ],
    "ch3": [
        "Operation Paperclip",
        "MKUltra mind control program",
        "CIA Stargate Project",
        "Roswell incident declassified",
        "Operation Northwoods",
    ],
    "ch4": [
        "neuroplasticity synaptic pruning",
        "amygdala fear response hijack",
        "default mode network mind wandering",
        "dopamine pathway reward circuit",
        "prefrontal cortex decision making",
    ],
    "ch5": [
        "Tunguska event 1908",
        "Mary Anning fossil discovery",
        "Night Witches Soviet bombers",
        "Decipherment of Linear B",
        "Voyager Golden Record selection",
    ],
    "ch6": [
        "Mars dust storms planet-wide",
        "Jupiter Great Red Spot shrinking",
        "Voyager 1 interstellar space",
        "black hole Sagittarius A* mass",
        "Saturn ring age mystery",
    ],
}


def pick_topic(channel_id: str) -> str:
    import random
    return random.choice(AUTO_TOPICS.get(channel_id, ["interesting fact"]))


# ── Step runner ───────────────────────────────────────────────────────────────

def run_pipeline(channel_id: str, topic: str, dry_run: bool = False, mock: bool = False) -> dict:
    """
    Runs all currently-implemented pipeline stages.
    Returns the manifest dict.
    """
    print(f"\n{'='*60}")
    print(f"  DOPAMINE STUDIOS PIPELINE")
    print(f"  Channel : {channel_id}")
    print(f"  Topic   : {topic}")
    print(f"{'='*60}\n")

    # Stage 1: Research
    print("▶ Stage 1: Research")
    if mock:
        brief = get_mock_brief(topic, channel_id)
        print(f"  ✓ [MOCK] {len(brief.key_facts)} facts, {len(brief.named_entities)} entities\n")
    else:
        brief = research(topic, channel_id)
        print(f"  ✓ {len(brief.key_facts)} facts, {len(brief.named_entities)} entities\n")

    # Stage 2: Script generation
    print("▶ Stage 2: Script generation")
    script = generate_script(topic, channel_id, brief)
    beats = script.get("beats", [])
    print(f"  ✓ hook + context + {len(beats)} beats + twist + outro")
    print(f"  ✓ hook: {script.get('hook', '')[:60]}...")
    print()

    # Stage 3: Manifest
    print("▶ Stage 3: Manifest builder")
    manifest = build_manifest(script, channel_id)
    out_dir = Path("public/manifests")
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = out_dir / f"{channel_id}_manifest.json"
    if not dry_run:
        save_manifest(manifest, manifest_path)
    print(f"  ✓ {manifest['totalFrames']} frames ({manifest['totalSeconds']}s) → {manifest_path}\n")

    # Stage 4: TTS
    print("▶ Stage 4: TTS (voice + word boundaries)")
    try:
        import asyncio as _asyncio
        import json as _json
        manifest = _asyncio.run(generate_all_beats(manifest))
        captions = manifest_to_captions(manifest)
        caps_path = Path("public") / "audio" / f"{channel_id}_captions.json"
        if not dry_run:
            caps_path.parent.mkdir(parents=True, exist_ok=True)
            with open(caps_path, "w") as _f:
                _json.dump(captions, _f, indent=2)
            save_manifest(manifest, manifest_path)
        dur = manifest.get("actualDurationS", "?")
        print(f"  ✓ {dur}s audio, {len(captions)} caption tokens → {caps_path}\n")
    except Exception as _e:
        print(f"  ✗ TTS failed: {_e} (requires network + edge-tts installed)\n")

    # Stage 5: Asset resolver — stub (built in S4)
    print("▶ Stage 5: Asset resolver — pending S4")
    print("  ⏳ skipped — run after Session 4 is complete\n")

    # Stage 6: Stock media — stub (built in S5)
    print("▶ Stage 6: Stock media — pending S5")
    print("  ⏳ skipped — run after Session 5 is complete\n")

    # Stage 7: Render — stub (built in S8-S13)
    print("▶ Stage 7: Remotion render — pending S8-S13")
    print("  ⏳ skipped — run after channel components are complete\n")

    print("✅  Pipeline complete (S1-S4 stages)")
    print(f"    Manifest: {manifest_path}\n")
    return manifest


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dopamine Studios pipeline")
    parser.add_argument("--channel", required=True, choices=["ch1","ch2","ch3","ch4","ch5","ch6"])
    parser.add_argument("--topic", default="auto", help='Topic string or "auto"')
    parser.add_argument("--dry-run", action="store_true", help="Skip file writes")
    parser.add_argument("--mock", action="store_true", help="Use mock research data (no API calls)")
    args = parser.parse_args()

    topic = pick_topic(args.channel) if args.topic == "auto" else args.topic
    manifest = run_pipeline(args.channel, topic, dry_run=args.dry_run, mock=args.mock)
    print(json.dumps({
        "channelId": manifest["channelId"],
        "topic": manifest["topic"],
        "totalFrames": manifest["totalFrames"],
        "totalSeconds": manifest["totalSeconds"],
        "beatCount": len(manifest["beats"]),
    }, indent=2))
