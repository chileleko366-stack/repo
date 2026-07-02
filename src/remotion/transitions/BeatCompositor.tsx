// Session 8 — Speech-rhythm-aware beat compositor.
// Uses @remotion/transitions TransitionSeries instead of hard-cut Sequence lists.
// Beat duration comes from actual TTS audio length; transitions from pause_after markers.
// Source: /tmp/refs/saas-engine/src/skills/transitions.md + sequencing.md patterns.

import React from 'react';
import { useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { ManifestBeat } from '../../../src/pipeline/types';

export type PauseAfter = 'breath' | 'beat' | 'cut';
export type TransitionKind = 'cut' | 'crossfade' | 'wipe' | 'slide';

export interface TimedBeat extends ManifestBeat {
  /** Actual TTS audio duration in frames */
  audioFrames: number;
  /** Silence between this beat's audio end and the next beat's audio start, in frames */
  pauseAfterFrames: number;
  /** Pause type from script JSON */
  pauseAfter: PauseAfter;
  /** Transition to use when exiting this beat */
  transitionOut: TransitionKind;
  /** Frames this beat's VISUAL holds without motion (validated ≤45) */
  staticHoldFrames: number;
}

const CROSSFADE_FRAMES = 8;   // breath — 6-10 frame soft blend
const WIPE_FRAMES = 12;       // beat — 10-14 frame directional wipe
const SLIDE_FRAMES = 16;      // cut — real scene break

// Largest possible transition overlap window — during this many frames at the
// tail of a beat's Sequence, TransitionSeries mounts the NEXT beat's Sequence
// simultaneously on top of it (see @remotion/transitions' TransitionSeries.js:
// entering/exiting children render concurrently, composited by the
// presentation). Full-screen text layers (KineticTextLayer) must be fully
// faded out before this window starts, or two beats' text renders overlap.
export const MAX_TRANSITION_FRAMES = SLIDE_FRAMES;

/** Maps pause type + visual-change status → transition kind */
export function mapPauseToTransition(
  pause: PauseAfter,
  visualChanging: boolean,
  beatIndex: number,
): TransitionKind {
  if (!visualChanging) return 'cut';
  if (pause === 'breath') return 'crossfade';
  if (pause === 'beat') return 'wipe';
  // 'cut': alternate between slide directions for variety
  return beatIndex % 3 === 0 ? 'slide' : 'wipe';
}

function transitionFrameCount(kind: TransitionKind): number {
  if (kind === 'crossfade') return CROSSFADE_FRAMES;
  if (kind === 'wipe') return WIPE_FRAMES;
  if (kind === 'slide') return SLIDE_FRAMES;
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransitionPresentation(kind: TransitionKind, beatIndex: number): any {
  // shouldFadeOutExitingScene: without this, @remotion/transitions' fade()
  // leaves the exiting scene at opacity 1 for the entire transition while the
  // entering scene fades in on top of it — full-opacity text from both beats
  // stacked, not a real crossfade. Fixed defensively: as of this commit,
  // buildTimedBeats() below can never actually select 'crossfade' (see its
  // pauseAfterMap lookup — the keys it's given never match beat.beatId, so
  // pause always resolves to the 'cut' default), so this bug is currently
  // unreachable in production. Fixing it anyway so it's correct the moment
  // that lookup bug is fixed and 'breath' pacing starts working again.
  if (kind === 'crossfade') return fade({ shouldFadeOutExitingScene: true });
  if (kind === 'wipe') {
    const dirs = ['from-left', 'from-right', 'from-top', 'from-bottom'] as const;
    return wipe({ direction: dirs[beatIndex % dirs.length] });
  }
  if (kind === 'slide') {
    return slide({ direction: beatIndex % 2 === 0 ? 'from-right' : 'from-left' });
  }
  return fade();
}

function getTransitionTiming(kind: TransitionKind) {
  const frames = transitionFrameCount(kind);
  if (kind === 'crossfade') {
    return springTiming({ config: { damping: 200 }, durationInFrames: frames });
  }
  return linearTiming({ durationInFrames: frames });
}

/** Validates no beat holds fully static for more than 45 frames */
export function validatePacing(beats: TimedBeat[]): void {
  for (const beat of beats) {
    if (beat.staticHoldFrames > 45) {
      throw new Error(
        `Beat ${beat.beatId} is visually static for ${beat.staticHoldFrames} frames — add motion or split the beat.`,
      );
    }
  }
}

/**
 * The active beat's bg_color (or fallbackColor if unset) at the current
 * absolute frame — for a background layer rendered ONCE outside
 * BeatCompositor's TransitionSeries, not remounted per beat. Must be called
 * from a component that is NOT itself inside a <Sequence>/TransitionSeries.Sequence,
 * since useCurrentFrame() there would be relative to that Sequence, not the
 * whole video (see AmbientBackground's previous per-beat placement — the
 * background wipe bug: TransitionSeries.Sequence's wipe/slide transform
 * applies to its whole subtree, so a background mounted per-beat visibly
 * slides/wipes with the beat instead of staying fixed).
 *
 * Uses the same cumulative-audioFrames-sum timeline TransitionSeries builds
 * beat Sequences from (ignoring the few frames TransitionSeries.Transition
 * overlaps adjacent Sequences by) — close enough for a solid background
 * color, and the same approximation CaptionTrack.tsx already relies on for
 * caption timing.
 */
export function useActiveBeatBgColor(
  timedBeats: TimedBeat[],
  fallbackColor: string,
): string {
  const frame = useCurrentFrame();
  let cumulativeFrames = 0;
  for (const beat of timedBeats) {
    if (frame < cumulativeFrames + beat.audioFrames) {
      return beat.bg_color || fallbackColor;
    }
    cumulativeFrames += beat.audioFrames;
  }
  return fallbackColor;
}

interface BeatCompositorProps {
  timedBeats: TimedBeat[];
  renderBeat: (beat: TimedBeat, index: number) => React.ReactNode;
}

/**
 * Renders all beats as a single TransitionSeries using speech-rhythm transitions.
 * Beat durations are derived from TTS audio, not a fixed grid.
 */
export const BeatCompositor: React.FC<BeatCompositorProps> = ({ timedBeats, renderBeat }) => {
  return (
    <TransitionSeries>
      {timedBeats.map((beat, i) => (
        <React.Fragment key={beat.beatId}>
          <TransitionSeries.Sequence durationInFrames={beat.audioFrames}>
            {renderBeat(beat, i)}
          </TransitionSeries.Sequence>
          {i < timedBeats.length - 1 && beat.transitionOut !== 'cut' && (
            <TransitionSeries.Transition
              presentation={getTransitionPresentation(beat.transitionOut, i)}
              timing={getTransitionTiming(beat.transitionOut)}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};

/**
 * Converts ManifestBeat[] + TTS timing data into TimedBeat[] ready for the compositor.
 * audioDurationsMs: map from beatId → actual TTS audio duration in ms
 * pauseAfterMap: map from beatId → 'breath' | 'beat' | 'cut' (from script JSON)
 */
export function buildTimedBeats(
  beats: ManifestBeat[],
  fps: number,
  audioDurationsMs: Record<string, number>,
  pauseAfterMap: Record<string, PauseAfter>,
): TimedBeat[] {
  return beats.map((beat, i) => {
    const durationMs = audioDurationsMs[beat.beatId] ?? beat.durationFrames * (1000 / fps);
    const isLastBeat = i === beats.length - 1;
    const holdFrames = isLastBeat ? 60 : 0;
    const audioFrames = Math.max(30, Math.round((durationMs / 1000) * fps)) + holdFrames;

    const pauseAfter = pauseAfterMap[beat.beatId] ?? 'cut';

    const prevKind = i > 0 ? beats[i - 1]?.visual.kind : undefined;
    const visualChanging = beat.visual.kind !== prevKind;

    const transitionOut = mapPauseToTransition(pauseAfter, visualChanging, i);

    return {
      ...beat,
      audioFrames,
      pauseAfterFrames: 0,
      pauseAfter,
      transitionOut,
      staticHoldFrames: 0,
    };
  });
}
