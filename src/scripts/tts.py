"""
Voice engine — generates per-beat audio + word-boundary JSON.

Provider: edge-tts (no key required) via Microsoft Edge TTS WebSocket.
Returns WordBoundary events (omitted in some CI IPs → 0ms word boundaries).

Word boundary JSON written to public/audio/{beat_id}_words.json:
[
  { "word": "You", "startMs": 0, "durationMs": 180, "endMs": 180 },
  ...
]

Audio written to public/audio/{beat_id}.mp3

The @remotion/captions Caption type expects:
  { text, startMs, endMs, timestampMs, confidence }
The word boundary JSON is in our own format; CaptionTrack.tsx converts it.
"""

import asyncio
import json
import os
import re
import ssl
import sys
from pathlib import Path

import edge_tts
import edge_tts.communicate as _et_comm

try:
    from mutagen.mp3 import MP3 as _MutagenMP3
    _MUTAGEN_OK = True
except ImportError:
    _MUTAGEN_OK = False


def _mp3_duration_ms(path: Path) -> int:
    """Read actual MP3 duration via mutagen. Falls back to 0 if unavailable."""
    if not _MUTAGEN_OK or not path.exists() or path.stat().st_size < 100:
        return 0
    try:
        return int(_MutagenMP3(path).info.length * 1000)
    except Exception:
        return 0

# edge-tts stores _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
# at module import time and passes it as ssl=_SSL_CTX to aiohttp ws_connect.
# In environments with proxy/self-signed certs we replace the stored context
# with an unverified one so the WebSocket handshake succeeds.
_unverified_ssl_ctx = ssl.create_default_context()
_unverified_ssl_ctx.check_hostname = False
_unverified_ssl_ctx.verify_mode = ssl.CERT_NONE
_et_comm._SSL_CTX = _unverified_ssl_ctx

def strip_emphasis_markup(text: str) -> str:
    """Remove *emphasis* markers before TTS."""
    return re.sub(r'\*([^*]+)\*', r'\1', text)


def prepare_for_tts(text: str) -> str:
    """
    Full preprocessing for edge-tts pronunciation.

    1. Strip *emphasis* markers.
    2. Remove commas from digit groups so TTS reads them as numbers not lists.
       '1,000,000' → '1000000' → TTS says "one million" ✓
    3. Expand currency shorthand: '$1.4B' → '1.4 billion dollars'.
    4. Remove bare $ prefix so TTS doesn't skip it.
    """
    # 1. strip emphasis
    text = strip_emphasis_markup(text)

    # 2. Remove commas inside digit groups: '93,000' → '93000'
    text = re.sub(r'\b(\d{1,3})(?:,(\d{3}))+\b', lambda m: m.group(0).replace(',', ''), text)

    # 3a. '$X.XB' / '$XB' → 'X.X billion dollars'
    text = re.sub(
        r'\$(\d+(?:\.\d+)?)\s*[Bb](?:illion)?\b',
        lambda m: f"{m.group(1)} billion dollars",
        text,
    )
    # 3b. '$X.XM' / '$XM' → 'X.X million dollars'
    text = re.sub(
        r'\$(\d+(?:\.\d+)?)\s*[Mm](?:illion)?\b',
        lambda m: f"{m.group(1)} million dollars",
        text,
    )
    # 3c. '$X.XT' / '$XT' → 'X.X trillion dollars'
    text = re.sub(
        r'\$(\d+(?:\.\d+)?)\s*[Tt](?:rillion)?\b',
        lambda m: f"{m.group(1)} trillion dollars",
        text,
    )

    # 4. Remaining bare '$' → strip so TTS doesn't stumble
    text = re.sub(r'\$(\d)', r'\1 dollars ', text)

    return text.strip()


# ── Voice profiles ────────────────────────────────────────────────────────────

EDGE_VOICE_PROFILES: dict[str, dict] = {
    "ch1": {"voice": "en-US-AvaNeural",    "rate": "+8%",  "pitch": "+0Hz"},
    "ch2": {"voice": "en-US-GuyNeural",    "rate": "+0%",  "pitch": "+0Hz"},
    "ch3": {"voice": "en-US-BrianNeural",  "rate": "-5%",  "pitch": "-2Hz"},
    "ch4": {"voice": "en-US-AndrewNeural", "rate": "+0%",  "pitch": "+0Hz"},
    "ch5": {"voice": "en-GB-SoniaNeural",  "rate": "-8%",  "pitch": "-1Hz"},
    "ch6": {"voice": "en-US-AriaNeural",   "rate": "+0%",  "pitch": "+0Hz"},
}

TICKS_TO_MS = 10_000  # 100ns ticks → milliseconds


# ── edge-tts ──────────────────────────────────────────────────────────────────

async def _edge_tts_generate(
    narration: str,
    channel_id: str,
    audio_path: Path,
    words_path: Path,
) -> list[dict]:
    """Generates audio via edge-tts. Returns word boundaries (may be empty in CI)."""
    profile = EDGE_VOICE_PROFILES.get(channel_id, EDGE_VOICE_PROFILES["ch1"])
    communicate = edge_tts.Communicate(
        narration,
        voice=profile["voice"],
        rate=profile["rate"],
        pitch=profile["pitch"],
    )

    audio_chunks: list[bytes] = []
    word_boundaries: list[dict] = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            start_ms = int(chunk["offset"]) // TICKS_TO_MS
            dur_ms   = int(chunk["duration"]) // TICKS_TO_MS
            word_boundaries.append({
                "word":       chunk["text"],
                "startMs":    start_ms,
                "durationMs": dur_ms,
                "endMs":      start_ms + dur_ms,
            })

    with open(audio_path, "wb") as f:
        for chunk in audio_chunks:
            f.write(chunk)

    with open(words_path, "w") as f:
        json.dump(word_boundaries, f, indent=2)

    return word_boundaries


# ── Core TTS function ─────────────────────────────────────────────────────────

async def generate_beat_audio(
    narration: str,
    channel_id: str,
    beat_id: str,
    output_dir: str = "public/audio",
) -> dict:
    """
    Generates MP3 + word boundary JSON for a single beat via edge-tts.
    Returns a dict with word boundaries and duration.
    """
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    audio_path = out_dir / f"{beat_id}.mp3"
    words_path = out_dir / f"{beat_id}_words.json"

    word_boundaries = await _edge_tts_generate(narration, channel_id, audio_path, words_path)

    if word_boundaries:
        duration_ms = word_boundaries[-1]["endMs"]
    else:
        duration_ms = _mp3_duration_ms(audio_path)
    print(
        f"[tts] {beat_id}: {len(word_boundaries)} words, "
        f"{duration_ms}ms → {audio_path.name}"
    )

    return {
        "beatId":             beat_id,
        "audioPath":          str(audio_path),
        "wordBoundariesPath": str(words_path),
        "wordBoundaries":     word_boundaries,
        "durationMs":         duration_ms,
    }


async def _generate_beat_with_retry(
    narration: str, channel_id: str, beat_id: str, retries: int = 3
) -> dict:
    """Wraps generate_beat_audio with retry on exception.
    0ms-audio (no word boundaries) is accepted as-is."""
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            return await generate_beat_audio(narration, channel_id, beat_id)
        except Exception as e:
            last_exc = e
            if attempt < retries:
                await asyncio.sleep(3 * attempt)
    raise last_exc


async def generate_all_beats(manifest: dict) -> dict:
    """
    Runs TTS for every beat sequentially (edge-tts is throttled under concurrency).
    Updates manifest.beats[*].audio in-place and returns the updated manifest.
    """
    channel_id = manifest["channelId"]
    result_map: dict[str, dict] = {}

    for beat in manifest["beats"]:
        narration = beat.get("narration", "").strip()
        if not narration:
            continue
        try:
            r = await _generate_beat_with_retry(prepare_for_tts(narration), channel_id, beat["beatId"])
            result_map[r["beatId"]] = r
        except Exception as exc:
            print(f"[tts] ERROR: {exc}")

    for beat in manifest["beats"]:
        beat_id = beat["beatId"]
        if beat_id in result_map:
            beat["audio"] = result_map[beat_id]
            beat["audioPath"] = result_map[beat_id]["audioPath"]
            beat["wordBoundariesPath"] = result_map[beat_id]["wordBoundariesPath"]

    total_ms = sum(
        beat.get("audio", {}).get("durationMs", 0)
        for beat in manifest["beats"]
    )
    manifest["actualDurationMs"] = total_ms
    manifest["actualDurationS"]  = round(total_ms / 1000, 2)
    print(f"[tts] total audio duration: {manifest['actualDurationS']}s")

    return manifest


# ── Caption conversion ────────────────────────────────────────────────────────

def word_boundaries_to_captions(
    word_boundaries: list[dict],
    beat_start_ms: int = 0,
) -> list[dict]:
    """
    Converts our word-boundary format to @remotion/captions Caption format.
    beat_start_ms shifts all timestamps to absolute video time.
    """
    captions = []
    for i, wb in enumerate(word_boundaries):
        text = wb["word"]
        if i > 0:
            text = " " + text
        captions.append({
            "text":        text,
            "startMs":     beat_start_ms + wb["startMs"],
            "endMs":       beat_start_ms + wb["endMs"],
            "timestampMs": beat_start_ms + wb["startMs"],
            "confidence":  1.0,
        })
    return captions


def manifest_to_captions(manifest: dict) -> list[dict]:
    """
    Builds a flat Caption[] for the entire video from all beat word boundaries.
    """
    fps = manifest.get("fps", 30)
    all_captions: list[dict] = []

    for beat in manifest.get("beats", []):
        if not beat.get("captionsVisible", True):
            continue
        audio = beat.get("audio", {})
        word_boundaries = audio.get("wordBoundaries", [])
        if not word_boundaries:
            continue
        beat_start_ms = int((beat["startFrame"] / fps) * 1000)
        all_captions.extend(word_boundaries_to_captions(word_boundaries, beat_start_ms))

    return all_captions


# ── CLI ───────────────────────────────────────────────────────────────────────

async def _main():
    if len(sys.argv) < 2:
        print("Usage: tts.py <manifest.json> [output_dir]")
        print("  or:  tts.py --beat <beat_id> <channel_id> <narration>")
        sys.exit(1)

    if sys.argv[1] == "--beat":
        beat_id    = sys.argv[2]
        channel_id = sys.argv[3]
        narration  = " ".join(sys.argv[4:])
        result = await generate_beat_audio(prepare_for_tts(narration), channel_id, beat_id)
        print(json.dumps(result, indent=2))
        return

    manifest_path = sys.argv[1]

    with open(manifest_path) as f:
        manifest = json.load(f)

    manifest = await generate_all_beats(manifest)

    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[tts] manifest updated: {manifest_path}")

    captions = manifest_to_captions(manifest)
    channel_id = manifest["channelId"]
    caps_path = f"public/audio/{channel_id}_captions.json"
    with open(caps_path, "w") as f:
        json.dump(captions, f, indent=2)
    print(f"[tts] captions written: {caps_path}")


if __name__ == "__main__":
    asyncio.run(_main())
