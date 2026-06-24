import React from 'react';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { ManifestBeat } from '../../../src/pipeline/types';

export type PauseAfter = 'breath' | 'beat' | 'cut';
export type TransitionKind = 'cut' | 'crossfade' | 'wipe' | 'slide' | 'iris' | 'crossZoom' | 'dreamyZoom' | 'linearBlur';

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

const CROSSFADE_FRAMES = 8;
const WIPE_FRAMES = 12;
const SLIDE_FRAMES = 16;
const IRIS_FRAMES = 20;
const CROSSZOOM_FRAMES = 18;
const DREAMYZOOM_FRAMES = 24;
const LINEARBLUR_FRAMES = 10;

// ── Custom transition presentations ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function iris(): any {
  return {
    component: ({ children, presentationDirection, presentationProgress }: {
      children: React.ReactNode;
      presentationDirection: 'entering' | 'exiting';
      presentationProgress: number;
    }) => {
      const p = presentationDirection === 'entering' ? presentationProgress : 1 - presentationProgress;
      return (
        <div style={{ clipPath: `circle(${p * 150}% at 50% 50%)`, width: '100%', height: '100%' }}>
          {children}
        </div>
      );
    },
    props: {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function crossZoom(): any {
  return {
    component: ({ children, presentationDirection, presentationProgress }: {
      children: React.ReactNode;
      presentationDirection: 'entering' | 'exiting';
      presentationProgress: number;
    }) => {
      const p = presentationProgress;
      const scale = presentationDirection === 'entering' ? 0.7 + 0.3 * p : 1 + 0.3 * p;
      const opacity = presentationDirection === 'entering' ? p : 1 - p;
      return (
        <div style={{ transform: `scale(${scale})`, opacity, width: '100%', height: '100%' }}>
          {children}
        </div>
      );
    },
    props: {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dreamyZoom(): any {
  return {
    component: ({ children, presentationDirection, presentationProgress }: {
      children: React.ReactNode;
      presentationDirection: 'entering' | 'exiting';
      presentationProgress: number;
    }) => {
      const p = presentationProgress;
      const scale = presentationDirection === 'entering' ? 0.85 + 0.15 * p : 1 + 0.15 * p;
      const opacity = presentationDirection === 'entering' ? p : 1 - p;
      const blur = presentationDirection === 'entering' ? 8 * (1 - p) : 8 * p;
      return (
        <div style={{ transform: `scale(${scale})`, opacity, filter: `blur(${blur}px)`, width: '100%', height: '100%' }}>
          {children}
        </div>
      );
    },
    props: {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function linearBlur(): any {
  return {
    component: ({ children, presentationDirection, presentationProgress }: {
      children: React.ReactNode;
      presentationDirection: 'entering' | 'exiting';
      presentationProgress: number;
    }) => {
      const p = presentationProgress;
      const translateX = presentationDirection === 'entering' ? (1 - p) * 40 : -p * 40;
      const opacity = presentationDirection === 'entering' ? p : 1 - p;
      const blur = presentationDirection === 'entering' ? 6 * (1 - p) : 6 * p;
      return (
        <div style={{ transform: `translateX(${translateX}px)`, opacity, filter: `blur(${blur}px)`, width: '100%', height: '100%' }}>
          {children}
        </div>
      );
    },
    props: {},
  };
}

/** Maps pause type + visual-change status + section key → transition kind */
export function mapPauseToTransition(
  pause: PauseAfter,
  visualChanging: boolean,
  beatIndex: number,
  sectionKey?: string,
): TransitionKind {
  if (!visualChanging) return 'cut';
  if (sectionKey === 'hook') return 'iris';
  if (sectionKey === 'outro') return 'dreamyZoom';
  if (pause === 'breath') return 'crossfade';
  if (pause === 'beat') return 'wipe';
  return beatIndex % 3 === 0 ? 'linearBlur' : 'crossZoom';
}

function transitionFrameCount(kind: TransitionKind): number {
  if (kind === 'crossfade') return CROSSFADE_FRAMES;
  if (kind === 'wipe') return WIPE_FRAMES;
  if (kind === 'slide') return SLIDE_FRAMES;
  if (kind === 'iris') return IRIS_FRAMES;
  if (kind === 'crossZoom') return CROSSZOOM_FRAMES;
  if (kind === 'dreamyZoom') return DREAMYZOOM_FRAMES;
  if (kind === 'linearBlur') return LINEARBLUR_FRAMES;
  return 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransitionPresentation(kind: TransitionKind, beatIndex: number): any {
  if (kind === 'crossfade') return fade();
  if (kind === 'wipe') {
    const dirs = ['from-left', 'from-right', 'from-top', 'from-bottom'] as const;
    return wipe({ direction: dirs[beatIndex % dirs.length] });
  }
  if (kind === 'slide') {
    return slide({ direction: beatIndex % 2 === 0 ? 'from-right' : 'from-left' });
  }
  if (kind === 'iris') return iris();
  if (kind === 'crossZoom') return crossZoom();
  if (kind === 'dreamyZoom') return dreamyZoom();
  if (kind === 'linearBlur') return linearBlur();
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

    const transitionOut = mapPauseToTransition(pauseAfter, visualChanging, i, beat.sectionKey);

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
