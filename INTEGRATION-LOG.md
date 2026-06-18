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
|------|---------|
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
- **`MorphShape.tsx`** — SVG path morph via flubber `interpolate(from, to, {maxSegmentLength:4})`; morphFn memoized with `useMemo`; `t` driven by `useCurrentFrame()` / `durationFrames`; SVG fills with `color` prop
- **`MorphText.tsx`** — character-level text morph; exit phase (chars scale+translateY out, staggered 2f); enter phase (incoming chars spring in from below, stagger 4f, damping 14, stiffness 300, mass 0.6); both phases pure functions of frame
- **`Counter.tsx`** — animated number counter; pure `interpolate + Easing.out(Easing.cubic)` (no countUp.js / no RAF); `toLocaleString` for thousands separator; spring scale entrance on activation
- **`index.ts`** — barrel export: Counter, MorphShape, MorphText

### Dependencies added
- `flubber ^0.4.2` — BSD-2-Clause (veltman/flubber)
- `src/types/flubber.d.ts` — TypeScript module declaration

## Session 7 — Sound System

### TypeScript: `src/remotion/sound/`
- **`SfxLayer.tsx`** — renders one `<Audio>` per `SoundEvent` inside a frame-accurate `<Sequence>`; `SfxEvent` inner component uses `useCurrentFrame()` for 3-frame fade-in / 6-frame fade-out volume envelope
- **`Soundtrack.tsx`** — per-channel music bed loaded from `public/music/{channelId}.mp3`; `interpolate` fade-in (0→30f) and fade-out (last 30f); default `musicVolume=0.18`; loop via `<Audio loop>`

### Python: `src/scripts/sound_design.py`
- `assign_sfx(manifest)` → rule-based SFX assignment per beat:
  - Every beat: `hit` entrance at `startFrame - HIT_PREROLL(2)`, 9 frames
  - `person` → `reveal` at beat start
  - `brand/product/app` → `pop` at beat start
  - `stat` → `tick` every 6 frames between 45%–90% of beat
  - `map/distance` → `swoosh` at beat start
  - `twist` section → `sting` at beat start
  - `outro` section → `bell` at `startFrame + 30`
- Deduplicates by `(startFrame, name)` pair; fills `manifest['soundDesign']`

### Pipeline update
- `pipeline.py` Stage 7 wired: calls `assign_sfx()`, saves updated manifest; completion message updated to "S1-S7 stages"

## Session 8 — Channel 1: Dopamine Loop

### TypeScript: `src/remotion/channels/ch1/`
- **`KineticTitle.tsx`** — word-by-word spring entrance (stagger 4f, damping 18, stiffness 200, mass 0.9); emphasisWord in Anton 94px + accent1 #d400ff + glow; other words Anton 76px + white; translateY 52→0 + opacity 0→1 per word
- **`PsychCard.tsx`** — glassmorphism card (960px wide, rgba(22,18,31,0.84), backdrop-blur 18px); spring pop-in scale 0.84→1 (damping 18, stiffness 200); keyword in Anton 78–110px + #d400ff; Counter for stat beats (delayFrames=54, durationFrames=54); cyan underline interpolates 0→300px width
- **`HardCutFlash.tsx`** — `interpolate(frame, [0,5], [peakOpacity,0])`; returns null after frame 5
- **`Ch1Composition.tsx`** — full composition; BeatSection inner component; Soundtrack + beat Sequences + SfxLayer + CaptionTrack (guarded by wordBoundaries null check)

### `src/pipeline/channelConfigs.ts`
- All 6 ChannelConfig records with exact colours, fonts, voice settings, beat types
- ch1 #16121f / #d400ff / #00f0ff / Anton + Space Grotesk
- ch2 #0a0e1a / #00ff88 / #ff4444 / JetBrains Mono + Space Grotesk
- ch3 #080808 / #cc0000 / #f0f0f0 / Special Elite
- ch4 #12121e / #e94560 / #4cc9f0 / Fraunces + Anton
- ch5 #100d08 / #c8a96e / #f5f0e8 / EB Garamond + Fraunces
- ch6 #050010 / #ff4500 / #a0c4ff / Orbitron

### `src/Root.tsx`
- Registers Ch1 composition; imports FPS/VIDEO_FRAMES from types; `defaultProps: { manifest: {} as VideoManifest }`

## Session 9 — Channel 2: FinanceFiction

### TypeScript: `src/remotion/channels/ch2/`
- **`TickerTape.tsx`** — scrolling financial ticker; `interpolate(frame, [0, durationFrames], [1080, -1920])`; JetBrains Mono 26px; fixed bottom position; semi-transparent dark background strip
- **`CandlestickChart.tsx`** — 5 SVG candles (wick + body) with sequential draw-in via `interpolate(frame, [i*8, i*8+20], [0,1])`; candles coloured green/red; up/down indicators
- **`BrowserFrame.tsx`** — spring slide-down chrome bar (URL + LIVE indicator); simulates breaking news browser context
- **`Ch2Composition.tsx`** — CandlestickChart for stat/none beats; BrowserFrame on hook/context; TickerTape on every beat; Counter for stat; green (#00ff88) cut flash

## Session 10 — Channel 3: Redacted

### TypeScript: `src/remotion/channels/ch3/`
- **`ScrambleReveal.tsx`** — deterministic character scramble; `CHARSET[(frame*7 + idx*13) % CHARSET.length]`; each char reveals at `startFrame + scrambleFrames + i * staggerFrames`; fully reproducible across renders
- **`ClassifiedStamp.tsx`** — CLASSIFIED / DECLASSIFIED rubber-stamp; spring (damping 7, stiffness 500, mass 0.5) for snap-in; scale 1.6→1; rotated −11°; red drop-shadow
- **`GlitchWord.tsx`** — RGB-split glitch on emphasis keyword; `frame % 20` cycle for deterministic trigger; red/blue channel offset spans at ±2/±4px
- **`Ch3Composition.tsx`** — ScrambleReveal for hook/context; GlitchWord on emphasis_keyword; ClassifiedStamp on twist beat; CRT scanline texture via `repeating-linear-gradient`; red 4px top rule

## Session 11 — Channel 4: The Grey Matter

### TypeScript: `src/remotion/channels/ch4/`
- **`NeuronPulse.tsx`** — SVG neuron network; 9 NODES (soma at centre + 8 dendrites); 11 AXON pairs; lines grow from node-A toward node-B over 22 frames (staggered i*3); node circles pulse opacity on `(frame + i*7) % 30` cycle; enter scale 0→1 staggered
- **`ThreeBrain.tsx`** — `@remotion/three` ThreeCanvas; icosahedronGeometry (r=2.8, detail=3) primary red wireframe + cyan inner shell at 0.72× counter-rotating; rotation from `(frame/30)*0.4`; enter scale interpolate 0.4→1 over 20 frames; no R3F `useFrame()`
- **`HardCutFlash.tsx`** — cyan (#4cc9f0) accent flash, 5-frame fade
- **`Ch4Composition.tsx`** — NeuronPulse + ThreeBrain for anatomy beats; Fraunces italic for general narration; Anton for anatomy; Counter for stat (delayFrames=54); gradient scrim on anatomy beats

## Session 12 — Channel 5: The Quiet Record

### TypeScript: `src/remotion/channels/ch5/`
- **`DocumentaryQuote.tsx`** — cinematic quote card; gold left border grows via `interpolate(frame, [0,24], [0,1])` on gradient; EB Garamond italic 58px; Fraunces attribution; slow spring entrance (damping 24, stiffness 100, mass 1.6, 35 frames)
- **`FilmGrain.tsx`** — SVG feTurbulence fractalNoise overlay; seed=`Math.floor(frame/2)` for controlled flicker; 3.5% opacity; no CSS animation
- **`HardCutFlash.tsx`** — black (#000000) fade, 8-frame duration — cinematic cut, not coloured flash
- **`Ch5Composition.tsx`** — DocumentaryQuote for non-asset beats; AssetNarration (EB Garamond italic) for asset beats; warm radial vignette always present; FilmGrain global overlay; musicVolume=0.14

## Session 13 — Channel 6: Red Space Facts

### TypeScript: `src/remotion/channels/ch6/`
- **`Starfield.tsx`** — 180 deterministic stars; positions from `((i*127+33)%1000)/1000`; 3 parallax layers drifting at [0.8, 0.4, 0.15] px/frame; Y-wrap via `% 1920`; per-star opacity pulse on `(frame + i*11) % 60`
- **`CelestialBody.tsx`** — `@remotion/three` ThreeCanvas; sphereGeometry (r=3.2, 64×64 segments); outer atmosphere haze as side=2 transparent sphere at 1.06× scale; rotation from `(frame/30)*0.25`; enter scale 0.4→1 over 24 frames
- **`HardCutFlash.tsx`** — orange (#ff4500) accent flash, 5-frame fade
- **`Ch6Composition.tsx`** — Starfield always in background (even on asset beats); CelestialBody for celestial beats; Orbitron font; Counter for stat; musicVolume=0.20

### `src/Root.tsx` — Final
- Registers all 6 compositions: Ch1–Ch6
- All 1080×1920 @ 30fps, VIDEO_FRAMES=1050
- `defaultProps: { manifest: {} as VideoManifest }` on each

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
