# CLAUDE.md — Standing Rules for This Repo

This file is read automatically at the start of every Claude Code session here. It exists because the same category of bug has recurred more than once: a change gets made, verified in isolation, declared done — and then turns out to be incomplete or wrong once seen in the context of the full system. These rules are mandatory, not suggestions.

## What this repo is

Dopamine Studios — a fully automated YouTube Shorts pipeline across 6 channels (`configs/channels/ch1.json`–`ch6.json`), each with its own Remotion composition at `src/remotion/channels/ch{1-6}/Ch{1-6}Composition.tsx`. Python (`src/scripts/`) handles script generation, TTS, asset resolution, and manifest building; Remotion + React + TypeScript (`src/remotion/`) handles rendering. GitHub Actions runs the pipeline twice daily.

Structurally important: several components are **shared across all 6 channels** (`HeroWord.tsx`, `KineticTextLayer.tsx`, `BeatCompositor.tsx`, `CaptionTrack.tsx`/`CaptionPage.tsx`, everything in `mograph/primitives/`). A change to any shared component affects every channel simultaneously, even if you only tested it against one.

## Rule 1 — Read the whole relevant surface before changing anything

Before editing any file, read:
- The file itself, in full, as it currently exists on disk — not as described in a prior planning doc, prior commit message, or your own memory of it.
- Every other file that imports it, and every file it imports, if the change could affect behavior outside the file itself.
- If the file is shared across channels (see above), read how **all 6** channels use it, not just one. A fix that's correct for ch1 and untested against ch3–ch6 is not verified.

Do not describe a file's contents, exports, or behavior without having actually opened it in this session. If you're not sure whether something exists or is wired in, grep for it — don't assume either way.

## Rule 2 — Grep before creating

Before writing a new component, function, or file, search the repo for something that already does this. This repo has shipped orphaned duplicate work before (`BackgroundDotGrid.tsx` sat unused for an unknown period while a hand-rolled equivalent was built elsewhere; `HardCutFlash.tsx` existed as 6 near-identical copies before consolidation). Assume the thing you're about to build might already exist until you've confirmed it doesn't.

## Rule 3 — No claim without evidence from this session

Every factual claim about the codebase in your summary to the user — "X is wired in," "Y doesn't exist," "Z is unused" — must be backed by a command you actually ran in this session (a grep, a read, a typecheck) with output you actually saw. Don't state something as fact because it was true in a prior planning document, a prior session's summary, or because it seems like it should be true.

## Rule 4 — "Done" requires a rendered frame, checked against the full picture

A visual change is not done when the relevant file typechecks and looks right in isolation. It's done when:
1. You've rendered an actual frame (or several, across different beats/channels if the change touches a shared component) using the real Remotion render pipeline — not just read the JSX and reasoned about what it should look like.
2. You've looked at that rendered output and specifically checked for interaction with the *other* things also rendering in the same frame — other text layers, overlapping components, transition states between beats. The bug this repo hit most recently (`HeroWord` and `KineticTextLayer` independently rendering the same word at the same time) was invisible from reading either file alone and only showed up in a real rendered frame.
3. For shared-component changes, you've done this check across a representative sample of channels, not one.

If you cannot render and view a real frame in this environment, say so explicitly rather than declaring the change verified.

## Rule 5 — Report discrepancies, don't silently reconcile them

If something you find in the repo contradicts a planning document, a prior commit message, or an instruction you were given, stop and report the mismatch as part of your summary. Don't quietly "fix" the discrepancy by assuming one side is right — the mismatch itself is information the user needs.

## Rule 6 — Changes that touch a shared layer are one coordinated change, not six per-channel patches

If a fix belongs in a shared file (anything in `mograph/`, `transitions/`, `captions/`, `backgrounds/`, `pipeline/`, or `scripts/manifest_builder.py`), make it once, there — don't patch around it independently in each channel composition. If a channel-specific workaround seems necessary, that's a signal the shared component's contract is wrong and needs fixing at the source, not a reason to special-case six times.

## Rule 7 — Don't merge to `main` without explicit confirmation the render was checked

Push fixes to a feature branch. Report what you changed and what you visually confirmed (per Rule 4). Wait for explicit go-ahead before merging, unless the user has already told you in this session to merge automatically.

## Rule 8 — Verification means a file the user can open, not a paragraph

Any time you claim a visual change works, save the actual rendered frame(s) as PNG files and tell the user where they are. Every "confirmed via render" claim in this repo's history before this rule was Claude Code describing a frame in prose — the user had zero direct visibility into any of it until they screenshotted their own phone and caught bugs (the ch5 crash, the KineticTextLayer wipe artifact) that had already been declared "verified" through multiple rounds of fixture renders. Reasoning about a rendered frame from memory is not verification. Producing a PNG the user can open is.
