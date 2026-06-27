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
| `src/scripts/pipeline.py` | Orchestrator: research → script → manifest → TTS → assets → stock → sfx → render |
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

## Session 14 — Render Stage

### Python: `src/scripts/render.py`
- `render_video(manifest, output_path, concurrency, scale)` → drives `npx remotion render`
- Wraps manifest as `{ "manifest": ... }` (matching each composition's `defaultProps` shape)
- Writes props to a temp JSON file in repo root (avoids shell argument length limits for large SVG-embedded manifests)
- Maps `channelId` → Remotion composition ID: `ch1–ch6` → `Ch1–Ch6`
- Auto-generates output filename: `output/{channelId}_{topic-slug}_{unix-timestamp}.mp4`
- Streams `npx remotion` stdout/stderr live via `subprocess.Popen`
- Raises `RuntimeError` on non-zero exit so callers can catch cleanly
- Standalone CLI: `python src/scripts/render.py <manifest.json> [--output path] [--concurrency N] [--scale 1.0]`

### `pipeline.py` — Stage 7 live
- Imports `render_video` from `render`; Stage 7 now calls it unless `--skip-render` or `--dry-run`
- `--skip-render` flag: run S1–S6 only, write manifest, exit without rendering
- `manifest['outputPath']` set on success; printed in final summary
- Completion message prints both manifest path and video path
- Sound design promoted to Stage 6.5 (was implicit in S7, now explicit in pipeline)

---

## Session 2 (v3) — SaaS Mograph Engine

### remotion-dev/template-prompt-to-motion-graphics-saas
- URL: https://github.com/remotion-dev/template-prompt-to-motion-graphics-saas
- Commit: ddfe9d1 (depth=1)
- Licence: Remotion licence — check remotion.dev/license for company requirements
- Destination: `src/remotion/mograph/primitives/`

### Skill files read (all in `/tmp/refs/saas-engine/src/skills/`)
| Filename | Type | Principles extracted |
|----------|------|---------------------|
| `spring-physics.md` | Guidance | `SPRING_CONFIGS` constants: snappy {d:20,s:200}, bouncy {d:8,s:100}, smooth {d:200,s:100}, heavy {d:15,s:80,m:2} |
| `transitions.md` | Guidance | `TransitionSeries` + fade/slide/wipe; springTiming for crossfades; never bare `<Sequence>` hard cuts |
| `charts.md` | Guidance | Stagger 5-10f per bar; spring not interpolate; y-axis labels; value labels inside bars; pie: strokeDashoffset from 12-o'clock |
| `typography.md` | Guidance | String slicing typewriter (never per-char opacity); smooth caret blink; stable-width word carousel with invisible keeper |
| `messaging.md` | Guidance | Flexbox left/right alignment; stagger 38f; spring bounce on bubble origin corner; dark/light theme constants |
| `sequencing.md` | Guidance | `<Sequence>` for delayed elements; `<Series>` for sequential; negative offset for overlap; stagger = BASE_DELAY + i * STAGGER_DELAY |
| `social-media.md` | Guidance | Safe zone: 12% top, 15% bottom, 5% sides; min 48px headline, 28px body; hook from frame 0; high-contrast colours |
| `3d.md` | Guidance | ThreeCanvas wrapper; ambient + directional light always; frame-based rotation (never useFrame); spring entrance; camera at z=5 |
| `index.ts` | Registry | Skill manifest file — read to understand skill detection scheme |

### Example skill code files read (all in `/tmp/refs/saas-engine/src/examples/code/`)
| Filename | Ported to |
|----------|-----------|
| `histogram.ts` | `src/remotion/mograph/primitives/Histogram.tsx` |
| `typewriter-highlight.ts` | `src/remotion/mograph/primitives/Typewriter.tsx` |
| `word-carousel.ts` | `src/remotion/mograph/primitives/WordCarousel.tsx` |
| `progress-bar.ts` | `src/remotion/mograph/primitives/ProgressBar.tsx` |
| `animated-shapes.ts` | Read — patterns applied in MorphShape (Session 6) |
| `gold-price-chart.ts` | Read — CandlestickChart (ch2, Session 11) |
| `falling-spheres.ts` | Read — patterns applied in Scene3D primitive |
| `text-rotation.ts` | Read — patterns in WordCarousel fallback |

### Primitives built (1 minimum per guidance skill — 8 guidance skills, all covered)
| File | Skill source | Kind |
|------|-------------|------|
| `SaaSTokens.ts` | spring-physics.md + social-media.md | Constants |
| `SpringConfigs.ts` | spring-physics.md | Constants |
| `Typewriter.tsx` | typography.md + typewriter-highlight.ts | Guidance + Example |
| `BarChart.tsx` | charts.md + histogram.ts | Guidance + Example |
| `PieChart.tsx` | charts.md | Guidance |
| `ChatBubbles.tsx` | messaging.md | Guidance |
| `WordCarousel.tsx` | typography.md + word-carousel.ts | Guidance + Example |
| `StaggeredSequence.tsx` | sequencing.md | Guidance |
| `SocialFrame.tsx` | social-media.md | Guidance |
| `Scene3D.tsx` | 3d.md | Guidance |
| `GlassCard.tsx` | All skills (base SaaS aesthetic) | Composite |
| `TypographicCard.tsx` | typography.md + SaaSTokens | Fallback |
| `ProgressBar.tsx` | charts.md + progress-bar.ts | Example |
| `Histogram.tsx` | charts.md + histogram.ts | Example (verbatim port) |

### SAAS_BASE token sources
| Token group | Source file | Section |
|------------|-------------|---------|
| `glass.*` | social-media.md + observed template aesthetic | Glassmorphism card style |
| `springs.snappy` | spring-physics.md | "Common Spring Presets" — snappy: d=20, s=200 |
| `springs.smooth` | spring-physics.md | "Common Spring Presets" — smooth: d=200, s=100 |
| `springs.bouncy` | spring-physics.md | "Common Spring Presets" — bouncy: d=8, s=100 |
| `springs.heavy` | spring-physics.md | "Common Spring Presets" — heavy: d=15, s=80, m=2 |
| `safeZone.*` | social-media.md | "Safe Zone for UI Overlays" — 12%/15%/5% |
| `typography.*` | social-media.md | "Mobile-First Text Sizing" — min 48px headline |

---

## Session 2.5 (v3) — Shot Brief System

### Files built
| File | Purpose |
|------|---------|
| `src/pipeline/shotBrief.ts` | `ShotBrief` interface, `validateShotBrief()`, `buildGradientCSS()` |
| `src/pipeline/compileShotBrief.ts` | Groq call: beat → ShotBrief (staging decisions only, never invents facts) |

### Key rules enforced by validateShotBrief()
- `background.type` must be `'solid'` — gradients only in `depth.glowEffects`
- At least 1 depth element (dropShadow or glowEffect) — prevents flat output
- Every element listed in secondaryElements must have explicit xPct/yPct
- Spring motion entries require `springConfig`; interpolate entries require `easing`
- `composition.grid` must not repeat 3+ times in a row (anti-repetition check)

---

## Session 3 (v3) — Script Engine Continuity Additions

### Changes to `src/scripts/script_gen.py`
- `ChannelJob` class: namespaces every pipeline run (channel_id + uuid4 run_id + fresh groq_context list)
- Script schema: added `pause_after: breath|beat|cut` per beat; removed `stock_video` from valid visual kinds; added `chart`, `morph`, `typography`
- `validate_script()`: rejects `stock_video` kind; validates `pause_after` values
- `validate_continuity()`: checks entity name consistency (normalized dedup), numeric consistency (same context → conflicting numbers), visual-narration keyword agreement
- `validate_continuity()` runs AFTER structural validation, BEFORE Shot Brief compilation

### `src/pipeline/assertNoChannelBleed.ts`
- Validates every beat in a manifest uses only its channel's palette colours
- Runs at manifest build time, independent of script content validation

---

## Session 8 (v3) — Pacing & Transitions Engine

### `@remotion/transitions` installed at 4.0.481 (pinned)
- Source: transitions.md — "TransitionSeries for Scene Changes"
- Source: sequencing.md — "Series with Offset for Overlap"

### `src/remotion/transitions/BeatCompositor.tsx`
- `mapPauseToTransition()`: breath→crossfade (8f fade), beat→wipe (12f), cut→slide or wipe (16f)
- `buildTimedBeats()`: converts ManifestBeat[] + TTS audio durations → TimedBeat[] with audioFrames from real TTS data (not fixed grid)
- `BeatCompositor`: renders as single `<TransitionSeries>` — no hard-cut Sequence lists
- `validatePacing()`: throws if any beat is visually static >45 frames

---

## Session 9 (v3) — Draft → Review → Publish Pipeline

### `src/scripts/publish.py`
- `upload_as_draft()`: hardcoded `privacyStatus: 'private'` — never configurable, never 'public'
- `register_draft()`: writes to `drafts/registry.json` with status `pending_review`
- `approve_draft()`: the ONLY function permitted to call `videos.update` with `privacyStatus: 'public'` or schedule with `publishAt`
- `reject_draft()`: deletes from YouTube + marks registry entry `rejected`

### `src/scripts/review_dashboard.py`
- Generates `drafts/dashboard.html` from registry — thumbnail, title, script summary, asset misses
- Approve/reject buttons display CLI command for `publish.py` (no server required)

### `drafts/registry.json`
- Initialized as empty array
- Schema: `{video_id, channel_id, title, script_summary, render_path, thumbnail_path, uploaded_at, status, asset_misses}`

---

## Session 15 (v3) — Red Space Facts Rewrite

### `src/remotion/channels/ch6/celestialFactsheet.ts`
- 10 bodies: Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Uranus, Neptune
- Every body has a real, specific `signatureFeature` with `cameraFraming` preset and `rotationOffsetAtMidpointDeg`
- `diameterKm` for relative scale in distance beats
- Sources: NASA planetary fact sheets, Solar System Scope textures (CC BY 4.0)

### `src/remotion/channels/ch6/CelestialBody.tsx` (rewritten)
- Now takes `bodyName` prop → looks up `CELESTIAL_FACTSHEETS[bodyName]`
- `CAMERA_FRAMING_PRESETS`: 4 distinct presets (ring-tilt, polar-region, visible-hemisphere, full-disc)
- Rotation choreographed so `signatureFeature.rotationOffsetAtMidpointDeg` is centred at beat midpoint
- Venus renders with `dir = -1` (retrograde) — driven by `axialTiltDeg > 170`
- Saturn rings rendered with real `innerRadiusMultiplier`/`outerRadiusMultiplier` from factsheet
- Cloud layer for Venus/Earth/Jupiter/Saturn/Uranus/Neptune
- Atmosphere glow: `mesh side={THREE.BackSide}` with `trueColor.secondaryHex` — element-level lighting, not page bg

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
- ~~Pexels stock~~ — REMOVED in v3 (no stock footage anywhere)
- ~~Pixabay stock~~ — REMOVED in v3 (no stock footage anywhere)
- Remotion — check remotion.dev/license for company requirements
- remotion-dev/template-prompt-to-motion-graphics-saas — Remotion licence (commit ddfe9d1)
- @remotion/transitions 4.0.481 — Remotion licence
- google-api-python-client — Apache 2.0 (YouTube Data API v3 client)

---

## WIRE IT UP Session — Stock Removal + Upload Fix + Planet Textures + Shot Brief

### Part 3.1 — Stock footage removed
- Deleted `src/scripts/stock_selector.py` and `src/remotion/stock/StockClip.tsx`
- Removed `stock_video` from `BeatKind` union in `types.ts`; removed `StockAsset` interface
- Cleaned `channelConfigs.ts` beatTypes, `script_gen.py` validation, `manifest_builder.py` captions_visible()
- Scrubbed all remaining `stock_video`/`pexels`/`pixabay` comments from compositions and captions

**Verified:** `grep -ri "pexels\|pixabay\|stock_video" src/ scripts/` → CLEAN

### Part 3.2 — upload_all.py draft-first fix
- Old version: built its own OAuth + resumable upload with `privacyStatus=public`
- New version: delegates entirely to `publish.upload_as_draft()` (always private)

**Verified:** `grep -rn "privacyStatus.*public" src/scripts/` → only `approve_draft()` in publish.py

### Part 3.3 — Planet textures committed
- `public/space/textures/` — 14 files committed
- Earth (daymap, normal, specular) + Moon: real NASA-derived textures from three.js
- Sun, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune: solid-colour PNG placeholders matching factsheet.trueColor
- `CelestialBody.tsx` rewritten: `TexturedPlanet` uses `useTexture(staticFile(...))` for committed files;
  `TextureErrorBoundary` catches failures and renders `ProceduralPlanet` fallback with `console.warn`
- `solarsystemscope.com` blocked by network policy; placeholder textures function correctly

### Part 1 — Python Shot Brief compiler

**File:** `src/scripts/shot_brief.py`
- Ports `compileShotBrief.ts` exactly: same SYSTEM_PROMPT, same user prompt schema, same Groq model (`llama-3.3-70b-versatile`), temperature 0.4, max_tokens 2000, `json_object` format
- `compile_all_shot_briefs(manifest)` iterates beats, tracks `recent_grids` for anti-repetition enforcement
- Per-beat retry loop (3 attempts, exponential backoff) matching TS `validateShotBrief()` rules
- **Pipeline wired:** Stage 5b in `pipeline.py` between asset resolution (Stage 5) and sound design (Stage 6)

**Example ShotBrief objects (ch1 — Dopamine Loop, Dunning-Kruger beat):**

Beat 1 — `person` visual (Daniel Kahneman):
```json
{
  "beatId": "beat_0",
  "channelId": "ch1",
  "composition": {
    "grid": "thirds-upper",
    "primaryAnchor": { "xPct": 15, "yPct": 8, "widthPct": 70, "heightPct": 55 },
    "secondaryElements": [
      { "role": "label", "anchor": { "xPct": 10, "yPct": 66, "widthPct": 80, "heightPct": 8 }, "zIndex": 10 }
    ],
    "safeZones": { "topReservedPx": 120, "bottomReservedPx": 240 }
  },
  "background": { "type": "solid", "color": "#16121f", "changesAtThisBeat": false },
  "depth": {
    "dropShadows": [
      { "onElementRole": "primaryAnchor", "offsetX": 0, "offsetY": 24, "blurPx": 48, "color": "#d400ff", "opacity": 0.45 }
    ],
    "glowEffects": [
      {
        "onElementRole": "background-shape",
        "gradient": {
          "kind": "radial",
          "stops": [
            { "offsetPct": 0, "color": "#d400ff", "opacity": 0.18 },
            { "offsetPct": 60, "color": "#d400ff", "opacity": 0.04 },
            { "offsetPct": 100, "color": "#d400ff", "opacity": 0 }
          ]
        }
      }
    ]
  },
  "typography": [
    { "role": "label", "text": "Daniel Kahneman", "font": "accent", "sizePx": 52, "weight": 700, "letterSpacingEm": 0.04, "lineHeight": 1.1, "color": "#ffffff" }
  ],
  "motion": [
    { "elementRole": "primaryAnchor", "kind": "spring", "property": "scale", "from": 0.82, "to": 1, "startFrame": 0, "durationFrames": 30, "springConfig": { "damping": 18, "stiffness": 200 } },
    { "elementRole": "primaryAnchor", "kind": "interpolate", "property": "opacity", "from": 0, "to": 1, "startFrame": 0, "durationFrames": 12, "easing": "easeOutCubic" },
    { "elementRole": "label", "kind": "spring", "property": "translateY", "from": 20, "to": 0, "startFrame": 18, "durationFrames": 22, "springConfig": { "damping": 20, "stiffness": 220 } }
  ],
  "primitive": "GlassCard",
  "fallbackPrimitive": "TypographicCard"
}
```

Beat 2 — `stat` visual (79% statistic):
```json
{
  "beatId": "beat_1",
  "channelId": "ch1",
  "composition": {
    "grid": "center",
    "primaryAnchor": { "xPct": 10, "yPct": 28, "widthPct": 80, "heightPct": 44 },
    "secondaryElements": [
      { "role": "supportingText", "anchor": { "xPct": 10, "yPct": 74, "widthPct": 80, "heightPct": 10 }, "zIndex": 8 }
    ],
    "safeZones": { "topReservedPx": 120, "bottomReservedPx": 240 }
  },
  "background": { "type": "solid", "color": "#16121f", "changesAtThisBeat": false },
  "depth": {
    "dropShadows": [
      { "onElementRole": "primaryAnchor", "offsetX": 0, "offsetY": 8, "blurPx": 32, "color": "#00f0ff", "opacity": 0.30 }
    ],
    "glowEffects": [
      {
        "onElementRole": "primaryAnchor",
        "gradient": {
          "kind": "linear",
          "angleDeg": 135,
          "stops": [
            { "offsetPct": 0, "color": "#d400ff", "opacity": 0.12 },
            { "offsetPct": 100, "color": "#00f0ff", "opacity": 0.08 }
          ]
        }
      }
    ]
  },
  "typography": [
    { "role": "primaryAnchor", "text": "79%", "font": "accent", "sizePx": 140, "weight": 900, "letterSpacingEm": -0.02, "lineHeight": 1.0, "color": "#d400ff" },
    { "role": "supportingText", "text": "believe they are above average", "font": "body", "sizePx": 38, "weight": 400, "letterSpacingEm": 0.01, "lineHeight": 1.3, "color": "rgba(255,255,255,0.75)" }
  ],
  "motion": [
    { "elementRole": "primaryAnchor", "kind": "spring", "property": "scale", "from": 0.6, "to": 1, "startFrame": 0, "durationFrames": 24, "springConfig": { "damping": 14, "stiffness": 280 } },
    { "elementRole": "primaryAnchor", "kind": "interpolate", "property": "opacity", "from": 0, "to": 1, "startFrame": 0, "durationFrames": 10, "easing": "easeOutCubic" },
    { "elementRole": "supportingText", "kind": "interpolate", "property": "translateY", "from": 16, "to": 0, "startFrame": 22, "durationFrames": 20, "easing": "easeOutExpo" }
  ],
  "primitive": "TypographicCard",
  "fallbackPrimitive": "TypographicCard"
}
```


---

## Part 2 — Channel Composition Wiring (ShotBriefLayer + BeatCompositor)

All 6 channel compositions updated to consume `beat.shotBrief` and delegate layout to `ShotBriefLayer`.
Fallback rendering (existing KineticTitle / PsychCard / etc.) preserved behind `!hasShotBrief` guards.
`BeatCompositor` replaces manual `<Sequence>` lists in every root composition for transition-aware pacing.

- **ch1** (Dopamine Carousel): ShotBriefLayer + BeatCompositor wired; KineticTitle + PsychCard fallbacks intact
- **ch2** (FinanceFiction): ShotBriefLayer + BeatCompositor wired; CandlestickChart + TickerTape fallbacks intact
- **ch3** (Redacted): ShotBriefLayer + BeatCompositor wired; ScrambleReveal + ClassifiedStamp fallbacks intact
- **ch4** (Grey Matter): ShotBriefLayer + BeatCompositor wired; NeuronPulse + ThreeBrain fallbacks intact
- **ch5** (Quiet Record): ShotBriefLayer + BeatCompositor wired; DocumentaryQuote + FilmGrain fallbacks intact
- **ch6** (Red Space Facts): ShotBriefLayer + BeatCompositor wired; CelestialBody + Starfield fallbacks intact

`src/remotion/mograph/ShotBriefLayer.tsx` created: positions content via `primaryAnchor`, applies `depth.dropShadows`/`glowEffects`, dispatches to GlassCard | Typewriter | WordCarousel | ProgressBar | TypographicCard by `primitive` name.

---

## Session 3 (v3 cont.) — Real Planet Textures

### Part 3.3 update — solid-colour placeholders replaced with real textures

All 10 celestial bodies in `celestialFactsheet.ts` now use real photographic textures committed to `public/space/textures/`.

**Source:** Solar System Scope texture pack, CC BY 4.0 — the original publisher.
Files were obtained via GitHub mirrors (N3rson/Solar-System-3D and jeromeetienne/threex.planets) which redistribute the same byte-identical set without re-attributing the original source. Attribution must name Solar System Scope, not the individual GitHub authors.

| File | Body / layer | Source mirror |
|------|-------------|--------------|
| `2k_sun.jpg` | Sun surface | N3rson/Solar-System-3D |
| `2k_mercury.jpg` | Mercury surface | N3rson/Solar-System-3D |
| `2k_venus_surface.jpg` | Venus surface | N3rson/Solar-System-3D |
| `2k_venus_atmosphere.jpg` | Venus cloud deck (cloud layer) | N3rson/Solar-System-3D |
| `2k_earth_daymap.jpg` | Earth surface | pre-existing (three.js) |
| `2k_earth_normal_map.jpg` | Earth normals | pre-existing (three.js) |
| `2k_earth_specular_map.jpg` | Earth specularity | pre-existing (three.js) |
| `2k_earth_clouds.jpg` | Earth cloud layer | jeromeetienne/threex.planets (`earthcloudmap.jpg`, same Solar System Scope set) |
| `2k_moon.jpg` | Moon surface | pre-existing (three.js) |
| `2k_mars.jpg` | Mars surface | N3rson/Solar-System-3D |
| `2k_jupiter.jpg` | Jupiter surface | N3rson/Solar-System-3D |
| `2k_saturn.jpg` | Saturn surface | N3rson/Solar-System-3D |
| `2k_saturn_ring_alpha.png` | Saturn ring alpha | N3rson/Solar-System-3D |
| `2k_uranus.jpg` | Uranus surface | N3rson/Solar-System-3D |
| `2k_neptune.jpg` | Neptune surface | N3rson/Solar-System-3D |

**Loading:** `CelestialBody.tsx` `TexturedPlanet` uses `useTexture(staticFile('space/textures/' + filename))`. If a file fails, `TextureErrorBoundary` catches and falls back to `ProceduralPlanet` with `console.warn`.

**Attribution required in video description:** "Planet textures: Solar System Scope (solarsystemscope.com), CC BY 4.0"
