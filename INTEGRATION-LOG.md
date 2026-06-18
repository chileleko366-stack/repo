# Dopamine Studios — Integration Log

All third-party sources, licences, and decisions tracked here.

---

## Session 1 — Repo Scaffold

### remotion-dev/skills
- URL: https://github.com/remotion-dev/skills
- Installed via: `npx skills add remotion-dev/skills`
- Location: `.agents/skills/remotion-best-practices/`
- Licence: MIT
- Files used: All rules in `rules/*.md` — read before writing any component

### Remotion scaffold
- Tool: `create-video@4.0.481`
- Remotion version: **4.0.481**
- React: downgraded to **18** (scaffold defaults to 19; pinned per project rules)
- All `@remotion/*` packages pinned at exact version `4.0.481`

### Package pins
| Package | Version | Reason |
|---------|---------|--------|
| `react` | `^18.3.1` | Locked — R3F v8 + drei v9 require React 18 |
| `@react-three/fiber` | `^8.17.10` | v9 requires React 19 |
| `@react-three/drei` | `^9.122.0` | v10 requires React 19 |
| `three` | `^0.169.0` | Matches drei v9 |
| All `@remotion/*` | `4.0.481` (exact) | Consistent remotion peer deps |

---

## Session 2 — Script Engine

### Reference repos read
| Repo | URL | Commit (depth=1) | Files ported |
|------|-----|-----------------|--------------|
| SaarD00/AI-Youtube-Shorts-Generator | https://github.com/SaarD00/AI-Youtube-Shorts-Generator | depth=1 | `modules/brain.py` — Hook→Context→Mechanism→Twist structure, dual-visual tagging pattern |
| RayVentura/ShortGPT | https://github.com/RayVentura/ShortGPT | depth=1 | `shortGPT/engine/content_short_engine.py` — numbered step dict, approve/reject retry loop |
| harry0703/MoneyPrinterTurbo | https://github.com/harry0703/MoneyPrinterTurbo | depth=1 | `app/controllers/v1/llm.py` — finance-specific prompt structure concept |
| prajwal-y/video_explainer | https://github.com/prajwal-y/video_explainer | depth=1 | `src/planning/prompts.py` — research-first pipeline structure, scene type taxonomy |

### Scripts built
| File | Purpose |
|------|--------|
| `src/scripts/research.py` | Fetches real facts: Wikipedia, PubMed, NASA, ArXiv, NIH, LoC, Wikimedia Commons |
| `src/scripts/script_gen.py` | Groq LLM → 35s script JSON, 3-attempt validate/retry loop |
| `src/scripts/manifest_builder.py` | Script → VideoManifest with exact frame timing |
| `src/scripts/pipeline.py` | Orchestrator: research → script → manifest → (TTS/assets/render stubs) |
| `src/scripts/mock_data.py` | Offline test briefs for sandbox environments |

### 35-second video timing (1050 frames at 30fps)
| Section | Start | Duration | End |
|---------|-------|----------|-----|
| hook | 0 | 90 | 90 |
| context | 90 | 90 | 180 |
| beat_0–4 | 180 | 120 each | 780 |
| twist | 780 | 90 | 870 |
| outro | 870 | 180 | 1050 |

### LLM model
- Provider: Groq
- Model: `llama-3.3-70b-versatile`
- `response_format: {"type": "json_object"}` enforced
- Retries: up to 3, with errors fed back into next prompt

### Caption visibility rule (implemented)
- `person`, `brand`, `product`, `place`, `distance`, `map`, `anatomy`, `celestial`, `app`, `stock_video` → captions HIDDEN
- All others → captions VISIBLE

## Session 3 — Voice + Captions

### Python: `src/scripts/tts.py`
- **edge-tts** async voice engine; `VOICE_PROFILES` maps all 6 channels to Azure Neural voices
- `generate_beat_audio()` → streams MP3 + WordBoundary events; converts 100ns ticks to ms (`tick // 10_000`)
- Writes `public/audio/{beat_id}.mp3` + `public/audio/{beat_id}_words.json`
- `generate_all_beats(manifest)` → parallel `asyncio.gather` across all beats, back-fills `beat.audio`, `beat.audioPath`, `beat.wordBoundariesPath`
- `manifest_to_captions(manifest)` → flat `Caption[]` for entire video, timestamps offset by `beat.startFrame / fps * 1000`

### TypeScript: `src/remotion/captions/`
- **`CaptionPage.tsx`** — single TikTok-style page; active word: accentColor + accentFont + scale 1.12; past: white/0.55; upcoming: white/0.20; spring `translateY` entrance via `enterProgress` prop
- **`CaptionTrack.tsx`** — full-video overlay; builds flat `Caption[]` skipping `captionsVisible === false` beats; groups via `createTikTokStyleCaptions({ combineTokensWithinMilliseconds: 1200 })`; renders each page as `<Sequence>`; `CaptionPageAnimated` inner component uses `useCurrentFrame()` for spring (damping 14, stiffness 240, mass 0.8, 6 frames)
- **`useWordBoundaries.ts`** — `delayRender`/`continueRender` hook; fetches all `_words.json` files for caption-visible beats; returns `Record<string, WordBoundary[]> | null`

### Pipeline update
- `pipeline.py` Stage 4 wired: calls `generate_all_beats()` + `manifest_to_captions()`, writes captions JSON and updated manifest

## Session 4 — Asset Resolver
_To be filled after S4._

## Session 5 — Stock Media
_To be filled after S5._

## Session 6 — Morphing System
_To be filled after S6._

## Session 7 — Sound System
_To be filled after S7._

## Sessions 8–13 — Channel Components
_To be filled after each channel session._

---

## Attribution Summary (cumulative)

- Solar System Scope textures — CC BY 4.0 — add to video description
- NASA Image & Video Library — Public Domain
- Wikipedia/Wikimedia portraits & place images — CC BY-SA — add to video description
- simple-icons (brand logos) — CC0 + brand trademarks owned by respective owners
- flag-icons — MIT / flags public domain
- flubber — BSD-2-Clause (veltman/flubber)
- countUp.js — MIT (inorganik/countUp.js)
- remotion-dev/morph-text — MIT
- Phosphor Icons — MIT
- recharts / @visx — MIT
- JetBrains Mono / Anton / Fraunces / Special Elite / Space Grotesk / EB Garamond / Orbitron — OFL/Apache
- Kenney SFX — CC0
- FreePD music — CC0
- Incompetech (Kevin MacLeod) — CC BY 4.0 — add "Music by Kevin MacLeod (incompetech.com)" to description
- Pexels stock — Pexels licence (attribution optional but credited)
- Pixabay stock — Pixabay licence (no attribution required)
- Remotion — check remotion.dev/license for company requirements
