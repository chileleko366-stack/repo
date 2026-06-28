# TTS + LLM Fix Report
Generated: 2026-06-28

## Problem 1: edge-tts 403 Errors
- Root cause: Microsoft blocks GitHub Actions IP ranges from Bing Speech WebSocket
- Symptom: 9x 403 errors per channel, total audio duration: 0.0s — silent videos
- Fix: Replaced edge-tts entirely with kokoro>=0.9.4 (hexgrad/Kokoro-82M)
- kokoro runs in-process, zero external calls, no IP blocking possible
- Word boundary JSON format preserved: {word, startMs, durationMs, endMs}

## Problem 2: Dead LLM Providers
- xai (grok-3-mini): permanent 403 auth rejected — REMOVED from all provider chains
- cerebras (llama3.1-8b): permanent 404 endpoint gone — REMOVED from all provider chains
- New provider order (5 providers): groq -> sambanova -> gemini -> nvidia -> mistral

## Files Modified
- requirements.txt: removed edge-tts==6.1.12, added kokoro>=0.9.4 + soundfile
- .github/workflows/nightly-pipeline.yml: added espeak-ng apt install step (before pip install), removed XAI_API_KEY + CEREBRAS_API_KEY from .env write step
- src/scripts/tts.py: complete rewrite — Kokoro engine, same public API (generate_all_beats, manifest_to_captions)
- src/scripts/script_gen.py: removed xai + cerebras from PROVIDERS list
- src/scripts/shot_brief.py: removed xai + cerebras from _PROVIDERS list
- src/scripts/pipeline.py: updated comment (edge-tts -> kokoro)
- .env.example: removed XAI_API_KEY and CEREBRAS_API_KEY lines

## Voice Mapping (edge-tts Azure Neural -> Kokoro)
- ch1: en-US-AvaNeural    (female) -> af_heart,   speed 1.1
- ch2: en-US-GuyNeural    (male)   -> am_michael, speed 1.0
- ch3: en-US-BrianNeural  (deep m) -> am_adam,    speed 0.95
- ch4: en-US-AndrewNeural (male)   -> am_echo,    speed 1.0
- ch5: en-GB-SoniaNeural  (Brit f) -> bf_emma,    speed 0.92
- ch6: en-US-AriaNeural   (female) -> af_bella,   speed 1.0

## Verification
- All 13 Python files in src/scripts: syntax OK
- No xai/cerebras references remaining in src/
- No edge-tts import remaining in tts.py
- VOICE_PROFILES: all 6 channels present with valid Kokoro voice names
- pipeline.py call signature preserved: asyncio.run(generate_all_beats(manifest))
