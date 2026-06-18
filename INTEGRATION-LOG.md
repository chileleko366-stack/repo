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
|------|----------|
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
- **`useWordBoundaries.ts`** — `delayRender`/`continueRender` hook; fetches all `_words.json` for caption-visible beats; returns `Record<string, WordBoundary[]> | null`

### Pipeline update
- `pipeline.py` Stage 4 wired: calls `generate_all_beats()` + `manifest_to_captions()`, writes captions JSON and updated manifest

## Session 4 — Asset Resolver

### Python: `src/scripts/asset_resolver.py`
- **person** → `_wikipedia_thumbnail()` MediaWiki API → download → `rembg.remove()` PNG cutout; fallback to initials badge
- **brand / product / app** → Node.js subprocess queries `simple-icons` package by name; returns `{svgString, hex, title}`
- **place** → `_wikipedia_thumbnail()` at 1200px; saves JPEG
- **map** → OSM Nominatim geocode → `staticmap.StaticMap` renders 1080×960 OSM tile image; single red marker
- **distance** → geocode both ends; `_haversine_km()`; `_auto_zoom()` to fit both markers; `_latlon_to_px()` Web Mercator → pixel coords for the SVG line; supports km/miles/ly units
- `resolve_all_beats(manifest)` → `asyncio.gather` all beats concurrently; fills `manifest['resolvedAssets']` + `beat['resolvedAsset']`

### TypeScript: `src/remotion/assets/`
- **`PersonCard.tsx`** — spring entrance (damping 18, stiffness 180); max 900×800px cutout; initials fallback badge
- **`BrandLogo.tsx`** — spring pop-in (damping 14, stiffness 280); injects brand hex into SVG fill; ambient glow div
- **`PlacePhoto.tsx`** — full-frame Ken Burns pan+zoom, pure `interpolate` on scale/translateX/Y; dark vignette gradient overlay
- **`DistanceMap.tsx`** — 1080×960 map in upper half; SVG `strokeDashoffset` line draw (0→60% of beat); frame-driven counter (45%→90%); to-marker pulse via `frame % 30`
- **`AssetLayer.tsx`** — dispatcher; reads `beat.resolvedAsset` + `beat.visual.kind`; passes to correct component; returns null for anatomy/celestial (handled by ch4/ch6)

### Pipeline update
- `pipeline.py` Stage 5 wired: calls `resolve_assets()`, saves updated manifest
- `requirements.txt`: added `staticmap`

## Session 5 — Stock Media

### Python: `src/scripts/stock_selector.py`
- `_build_query(beat)` → uses `visual.query` if set; else stop-word filters narration to top-3 keywords
- **Pexels Videos** (portrait-preferred) → `_best_pexels_video_file()` picks hd>sd, portrait-first from `video_files[]`
- **Pixabay Videos** fallback → medium quality MP4
- **Pexels Photos** fallback → large2x JPEG
- **Pixabay Photos** last resort → largeImageURL
- No-repeat: `used_ids` set (seeded from `manifest['usedStockIds']`) prevents same `source:id` appearing twice
- `select_all_stock(manifest)` → sequential per-beat (avoids rate limits); fills `beat['resolvedAsset']` + `manifest['usedStockIds']`

### TypeScript: `src/remotion/stock/StockClip.tsx`
- `StockVideoClip` — `<Video volume={0} playbackRate={1}>` + `interpolate` push-in zoom (1.0→1.07); `objectFit: 'cover'` handles landscape→portrait crop; 22% dark overlay
- `StockPhotoClip` — `<Img>` Ken Burns (scale 1.06→1.14, translateX 0→−20px); gradient overlay
- `StockClip` dispatcher: routes by `asset.kind === 'video' | 'photo'`

### AssetLayer update
- `stock_video` kind now dispatches to `StockClip` in `AssetLayer.tsx`

### Pipeline update
- `pipeline.py` Stage 6 wired: calls `select_all_stock()`, saves updated manifest

## Session 6 — Morphing System

### TypeScript: `src/remotion/morph/`
- **`MorphShape.tsx`** — flubber `interpolate(fromPath, toPath)` memoized per path pair; `t = interpolate(frame, [start, start+dur], [0,1])`; renders `<svg><path d={morphFn(t)}/></svg>`; used for shape-to-shape transitions
- **`MorphText.tsx`** — kinetic character-level text transition; exit phase (chars 0→invisible, staggered) + enter phase (chars invisible→1, staggered); each char driven by spring (damping 18, stiffness 260, mass 0.7); scale 0.4→1 + translateY 18→0 + opacity 0→1
- **`Counter.tsx`** — pure `interpolate` value with `Easing.out(Easing.cubic)`; `toLocaleString` formatting; spring scale entrance; no countUp.js RAF loop
- **`index.ts`** — barrel: `Counter`, `MorphShape`, `MorphText`

### Type declaration
- `src/types/flubber.d.ts` — TypeScript module declaration for flubber

## Session 7 — Sound System

### Python: `src/scripts/sound_design.py`
- `CHANNEL_HIT` map: per-channel beat-entrance SFX name (hit_electronic/corporate/dark/soft/cinematic/space)
- Beat-entrance hit: fires `HIT_PREROLL=2` frames before each section cut; `HIT_DUR=9` frames (0.3s)
- Kind-specific SFX: `person` → reveal.mp3; `brand/product/app` → pop.mp3; `stat` → tick.mp3 every 6 frames (45%→90% of beat); `map/distance` → swoosh.mp3; `twist` section → sting.mp3; `outro` section → bell.mp3 at +30 frames
- Deduplicates exact `(startFrame, name)` pairs; sorts by startFrame
- `build_sound_design(manifest)` → returns sorted `SoundEvent[]` list without mutating manifest

### TypeScript: `src/remotion/sound/`
- **`SfxLayer.tsx`** — renders one `<Audio src={staticFile('sfx/{name}.mp3')}>` per `SoundEvent` inside a `<Sequence from={startFrame} durationInFrames={durationFrames} layout="none">`; 3-frame linear fade-in/out to avoid click artifacts
- **`Soundtrack.tsx`** — `<Audio src={staticFile('music/{channelId}.mp3')} loop>`; volume driven by `interpolate(frame, [0, 30, 1020, 1050], [0, musicVolume, musicVolume, 0])`; default `musicVolume=0.18`; per-channel music file comments note CC0/CC BY 4.0 sources

### Pipeline update
- `pipeline.py` Stage 7 wired: `build_sound_design(manifest)` → `manifest['soundDesign']`; completion message updated to S1-S7

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
