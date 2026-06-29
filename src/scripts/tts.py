"""
tts.py — Kokoro TTS engine for Dopamine Studios.

Uses kokoro-onnx (ONNX Runtime backend) instead of kokoro (PyTorch).
ONNX Runtime has no threading init that deadlocks on GitHub Actions Azure
runners — the PyTorch LSTM OMP thread pool issue is fully eliminated.

Kokoro-ONNX (hexgrad/Kokoro-82M via ONNX export):
  - Zero PyTorch dependency
  - No threading deadlock possible
  - Same voice quality and voice IDs as the PyTorch version
  - Apache 2.0 licensed, runs on onnxruntime CPU backend

Install:  pip install kokoro-onnx>=0.4.0 soundfile
System:   apt-get install -y espeak-ng ffmpeg

Word boundary JSON format (unchanged from edge-tts -- CaptionTrack.tsx depends on this):
  [{"word": "You", "startMs": 0, "durationMs": 180, "endMs": 180}, ...]
"""

import asyncio
import json
import os
import re
import sys
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

# ── kokoro-onnx model cache ───────────────────────────────────────────────────
KOKORO_CACHE_DIR   = os.path.join(os.path.expanduser("~"), ".cache", "kokoro-onnx")
KOKORO_MODEL_PATH  = os.path.join(KOKORO_CACHE_DIR, "kokoro-v1.0.onnx")
KOKORO_VOICES_PATH = os.path.join(KOKORO_CACHE_DIR, "voices-v1.0.bin")
KOKORO_BASE_URL    = (
    "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
)


def _download_kokoro_models() -> None:
    """Download kokoro-onnx model files to cache dir if not already present."""
    os.makedirs(KOKORO_CACHE_DIR, exist_ok=True)
    files = {
        KOKORO_MODEL_PATH:  KOKORO_BASE_URL + "kokoro-v1.0.onnx",
        KOKORO_VOICES_PATH: KOKORO_BASE_URL + "voices-v1.0.bin",
    }
    for dest, url in files.items():
        if os.path.exists(dest):
            print(f"[tts] cached: {os.path.basename(dest)}")
            continue
        print(f"[tts] downloading {os.path.basename(dest)}...")
        tmp = dest + ".tmp"
        try:
            urllib.request.urlretrieve(url, tmp)
            os.rename(tmp, dest)
            size_mb = os.path.getsize(dest) / 1024 / 1024
            print(f"[tts] downloaded {os.path.basename(dest)} ({size_mb:.1f}MB)")
        except Exception as e:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise RuntimeError(f"Failed to download {os.path.basename(dest)}: {e}")


_kokoro_cache: dict = {}


def _get_kokoro():
    """Return cached Kokoro ONNX instance, downloading model files if needed."""
    if "default" not in _kokoro_cache:
        _download_kokoro_models()
        from kokoro_onnx import Kokoro
        _kokoro_cache["default"] = Kokoro(KOKORO_MODEL_PATH, KOKORO_VOICES_PATH)
    return _kokoro_cache["default"]


VOICE_PROFILES = {
    "ch1": {"voice": "af_heart",   "speed": 1.1},
    "ch2": {"voice": "am_michael", "speed": 1.0},
    "ch3": {"voice": "am_adam",    "speed": 0.95},
    "ch4": {"voice": "am_echo",    "speed": 1.0},
    "ch5": {"voice": "bf_emma",    "speed": 0.92},
    "ch6": {"voice": "af_bella",   "speed": 1.0},
}

SAMPLE_RATE = 24000


def strip_emphasis_markup(text):
    return re.sub(r'\*([^*]+)\*', r'\1', text)


def prepare_for_tts(text):
    text = strip_emphasis_markup(text)
    text = re.sub(r'\b(\d{1,3})(?:,(\d{3}))+\b', lambda m: m.group(0).replace(',', ''), text)
    text = re.sub(r'\$(\d+(?:\.\d+)?)\s*[Bb](?:illion)?\b', lambda m: f"{m.group(1)} billion dollars", text)
    text = re.sub(r'\$(\d+(?:\.\d+)?)\s*[Mm](?:illion)?\b', lambda m: f"{m.group(1)} million dollars", text)
    text = re.sub(r'\$(\d+(?:\.\d+)?)\s*[Tt](?:rillion)?\b', lambda m: f"{m.group(1)} trillion dollars", text)
    text = re.sub(r'\$(\d)', r'\1 dollars ', text)
    return text.strip()


def _audio_to_mp3(audio, out_path, sample_rate=SAMPLE_RATE):
    wav_path = out_path.replace(".mp3", "_tmp.wav")
    sf.write(wav_path, audio, sample_rate)
    ret = os.system(f'ffmpeg -y -i "{wav_path}" -codec:a libmp3lame -qscale:a 4 "{out_path}" -loglevel error')
    try:
        os.unlink(wav_path)
    except OSError:
        pass
    if ret != 0:
        raise RuntimeError(f"ffmpeg failed: {wav_path} -> {out_path}")


def _synthesise_word_boundaries(narration, duration_ms):
    words = narration.strip().split()
    if not words or duration_ms <= 0:
        return []
    usable_ms = max(0, duration_ms - 180)
    per_word_ms = usable_ms / len(words)
    offset = 80
    result = []
    for word in words:
        char_factor = max(0.5, min(2.0, len(word) / 5))
        word_dur = max(50, min(int(per_word_ms * char_factor), int(per_word_ms * 1.5)))
        result.append({"word": word, "startMs": offset, "durationMs": word_dur, "endMs": offset + word_dur})
        offset += int(per_word_ms)
    return result


def _generate_beat_audio_sync(narration, channel_id, beat_id, output_dir="public/audio"):
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    audio_path = out_dir / f"{beat_id}.mp3"
    words_path = out_dir / f"{beat_id}_words.json"

    profile = VOICE_PROFILES.get(channel_id, VOICE_PROFILES["ch1"])
    voice = profile["voice"]
    speed = profile.get("speed", 1.0)

    try:
        kokoro = _get_kokoro()
        samples, sample_rate = kokoro.create(
            narration, voice=voice, speed=speed, lang="en-us"
        )
    except Exception as exc:
        print(f"[tts] ERROR on beat {beat_id}: {exc}")
        with open(words_path, "w") as f:
            json.dump([], f)
        return {"beatId": beat_id, "audioPath": None, "wordBoundariesPath": str(words_path), "wordBoundaries": [], "durationMs": 0}

    if samples is None or len(samples) == 0:
        print(f"[tts] WARNING: no audio generated for beat {beat_id}")
        with open(words_path, "w") as f:
            json.dump([], f)
        return {"beatId": beat_id, "audioPath": None, "wordBoundariesPath": str(words_path), "wordBoundaries": [], "durationMs": 0}

    duration_ms = int(len(samples) / sample_rate * 1000)
    _audio_to_mp3(samples, str(audio_path), sample_rate)

    word_boundaries = _synthesise_word_boundaries(narration, duration_ms)
    print(f"[tts] {beat_id}: synthesised {len(word_boundaries)} word boundaries")

    with open(words_path, "w") as f:
        json.dump(word_boundaries, f, indent=2)

    print(f"[tts] {beat_id}: {duration_ms / 1000:.1f}s, {len(word_boundaries)} words -> {audio_path.name}")
    return {"beatId": beat_id, "audioPath": str(audio_path), "wordBoundariesPath": str(words_path), "wordBoundaries": word_boundaries, "durationMs": float(duration_ms)}


async def generate_all_beats(manifest):
    channel_id = manifest.get("channelId", "ch1")
    result_map = {}

    for beat in manifest.get("beats", []):
        narration = beat.get("narration", "").strip()
        if not narration:
            continue
        beat_id = beat.get("beatId", beat.get("id", "beat"))
        try:
            r = _generate_beat_audio_sync(prepare_for_tts(narration), channel_id, beat_id)
            result_map[beat_id] = r
        except Exception as exc:
            print(f"[tts] ERROR on beat {beat_id}: {exc}")

    for beat in manifest.get("beats", []):
        beat_id = beat.get("beatId", beat.get("id", ""))
        if beat_id in result_map:
            r = result_map[beat_id]
            beat["audio"] = r
            beat["audioPath"] = r["audioPath"]
            beat["wordBoundariesPath"] = r["wordBoundariesPath"]

    total_ms = sum(beat.get("audio", {}).get("durationMs", 0) for beat in manifest.get("beats", []))
    manifest["actualDurationMs"] = total_ms
    manifest["actualDurationS"] = round(total_ms / 1000, 2)
    print(f"[tts] total audio duration: {manifest['actualDurationS']}s")
    return manifest


def word_boundaries_to_captions(word_boundaries, beat_start_ms=0):
    captions = []
    for i, wb in enumerate(word_boundaries):
        text = wb["word"]
        if i > 0:
            text = " " + text
        start = beat_start_ms + wb["startMs"]
        end = beat_start_ms + wb["endMs"]
        captions.append({"text": text, "startMs": start, "endMs": end, "timestampMs": start, "confidence": 1.0})
    return captions


def manifest_to_captions(manifest):
    fps = manifest.get("fps", 30)
    all_captions = []
    for beat in manifest.get("beats", []):
        if not beat.get("captionsVisible", True):
            continue
        audio = beat.get("audio", {})
        word_boundaries = audio.get("wordBoundaries", [])
        if not word_boundaries:
            continue
        beat_start_ms = int((beat.get("startFrame", 0) / fps) * 1000)
        all_captions.extend(word_boundaries_to_captions(word_boundaries, beat_start_ms))
    return all_captions


async def _main():
    if len(sys.argv) < 2:
        print("Usage: tts.py <manifest.json>")
        print("  or:  tts.py --beat <beat_id> <channel_id> <narration>")
        sys.exit(1)

    if sys.argv[1] == "--beat":
        beat_id    = sys.argv[2]
        channel_id = sys.argv[3]
        narration  = " ".join(sys.argv[4:])
        result = _generate_beat_audio_sync(prepare_for_tts(narration), channel_id, beat_id)
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
    channel_id = manifest.get("channelId", "ch1")
    caps_path = f"public/audio/{channel_id}_captions.json"
    with open(caps_path, "w") as f:
        json.dump(captions, f, indent=2)
    print(f"[tts] captions written: {caps_path}")


if __name__ == "__main__":
    asyncio.run(_main())
