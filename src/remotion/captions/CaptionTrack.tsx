/**
 * CaptionTrack — full-video caption overlay driven by word-boundary JSON.
 *
 * Usage:
 *   <CaptionTrack
 *     wordBoundariesByBeat={...}
 *     beats={timedBeats}
 *     channelId="ch1"
 *   />
 *
 * Rules (hardcoded, no exceptions):
 * - Captions ALWAYS shown (captionsVisible is always true from manifest_builder)
 * - Timing derived from cumulative audioFrames (actual TTS duration), not static startFrame
 * - One page per ~400ms of narration (word-by-word)
 * - Active word: spring scale 1.0→1.18, accent colour, accent font
 * - Page entrance: spring translateY +20→0, damping 14, stiffness 240
 * - Vertical position is per-beat, not a fixed offset: centered in whichever
 *   space (above or below) beat.shotBrief's primaryAnchor primitive box
 *   doesn't occupy — see computeCaptionCenterPct below. A fixed ~12%-from-top
 *   position collided with the primitive card whenever the LLM centered it
 *   (the common case, since ShotBriefLayer defaults composition.grid to
 *   "center" — see shot_brief.py's HARD RULES).
 *
 * Word boundaries JSON format (public/audio/{beatId}_words.json):
 *   [ { word, startMs, durationMs, endMs }, ... ]
 *
 * This component converts word-boundaries → Caption[] → TikTok pages → Sequences.
 */

import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  createTikTokStyleCaptions,
  type Caption,
} from '@remotion/captions';
import type { TimedBeat } from '../transitions/BeatCompositor';
import type { ShotBrief } from '../../pipeline/shotBrief';
import { clampYPctToSafeZone } from '../mograph/ShotBriefLayer';
import { SOCIAL_SAFE_ZONE } from '../mograph/primitives';
import { CaptionPage } from './CaptionPage';

// Word-by-word: one page per 400ms
const COMBINE_WITHIN_MS = 800;

const SAFE_TOP_PCT = SOCIAL_SAFE_ZONE.topPct * 100;
const SAFE_BOTTOM_PCT = 100 - SOCIAL_SAFE_ZONE.bottomPct * 100;
const DEFAULT_CENTER_PCT = (SAFE_TOP_PCT + SAFE_BOTTOM_PCT) / 2;

/**
 * Vertical center (in % of video height) for captions during a beat, chosen
 * to avoid beat.shotBrief's primaryAnchor primitive box: centered in
 * whichever of "space above the box" / "space below the box" (within the
 * platform-UI safe area) is larger. Falls back to the safe area's own
 * midpoint when there's no usable primaryAnchor — either no shot brief
 * (shouldn't happen post-fail-loud, but this is a rendering fallback, not a
 * pipeline invariant check) or the anchor box fills the safe area with no
 * non-overlapping space to prefer.
 */
function computeCaptionCenterPct(
  brief: ShotBrief | null | undefined,
  videoHeight: number,
): number {
  if (!brief?.composition?.primaryAnchor) {
    return DEFAULT_CENTER_PCT;
  }

  const { heightPct } = brief.composition.primaryAnchor;
  const yPct = clampYPctToSafeZone(brief, videoHeight);
  const anchorTop = yPct - heightPct / 2;
  const anchorBottom = yPct + heightPct / 2;

  const spaceAbove = anchorTop - SAFE_TOP_PCT;
  const spaceBelow = SAFE_BOTTOM_PCT - anchorBottom;

  if (spaceAbove <= 0 && spaceBelow <= 0) {
    return DEFAULT_CENTER_PCT;
  }
  return spaceBelow > spaceAbove
    ? anchorBottom + spaceBelow / 2
    : SAFE_TOP_PCT + spaceAbove / 2;
}

export interface WordBoundary {
  word: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

export interface CaptionTrackProps {
  /** beatId → word boundaries array */
  wordBoundariesByBeat: Record<string, WordBoundary[]>;
  beats: TimedBeat[];
  channelId: string;
  accentColor: string;
  accentFont: string;
  bodyFont: string;
}

export const CaptionTrack: React.FC<CaptionTrackProps> = ({
  wordBoundariesByBeat,
  beats,
  channelId,
  accentColor,
  accentFont,
  bodyFont,
}) => {
  const { fps, height: videoHeight } = useVideoConfig();

  // Build flat Caption[] using cumulative audioFrames for accurate timing
  const allCaptions = useMemo<Caption[]>(() => {
    const out: Caption[] = [];
    let cumulativeFrames = 0;
    for (const beat of beats) {
      const beatStartMs = Math.round((cumulativeFrames / fps) * 1000);
      if (beat.captionsVisible !== false) {
        const wbs = wordBoundariesByBeat[beat.beatId];
        if (wbs && wbs.length > 0) {
          for (let i = 0; i < wbs.length; i++) {
            const wb = wbs[i];
            const text = i === 0 ? wb.word : ` ${wb.word}`;
            out.push({
              text,
              startMs: beatStartMs + wb.startMs,
              endMs: beatStartMs + wb.endMs,
              timestampMs: beatStartMs + wb.startMs,
              confidence: 1,
            });
          }
        }
      }
      cumulativeFrames += beat.audioFrames;
    }
    return out;
  }, [wordBoundariesByBeat, beats, fps]);

  // Per-beat frame ranges + caption vertical center, keyed by cumulative
  // frame position — same cumulative-sum timeline as allCaptions above, so
  // a page's startFrame maps back to the beat it was spoken during.
  const beatRanges = useMemo(() => {
    const ranges: { startFrame: number; endFrame: number; centerPct: number }[] = [];
    let cumulativeFrames = 0;
    for (const beat of beats) {
      const startFrame = cumulativeFrames;
      const endFrame = cumulativeFrames + beat.audioFrames;
      ranges.push({
        startFrame,
        endFrame,
        centerPct: computeCaptionCenterPct(beat.shotBrief, videoHeight),
      });
      cumulativeFrames = endFrame;
    }
    return ranges;
  }, [beats, videoHeight]);

  const captionCenterForFrame = (frame: number): number => {
    const range = beatRanges.find((r) => frame >= r.startFrame && frame < r.endFrame);
    return range?.centerPct ?? DEFAULT_CENTER_PCT;
  };

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions: allCaptions,
        combineTokensWithinMilliseconds: COMBINE_WITHIN_MS,
      }),
    [allCaptions],
  );

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const endFrame = nextPage
          ? Math.round((nextPage.startMs / 1000) * fps)
          : startFrame + Math.round((COMBINE_WITHIN_MS / 1000) * fps);

        const durationInFrames = Math.max(1, endFrame - startFrame);

        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={durationInFrames}
            layout="none"
          >
            <CaptionPageAnimated
              page={page}
              accentColor={accentColor}
              accentFont={accentFont}
              bodyFont={bodyFont}
              verticalCenterPct={captionCenterForFrame(startFrame)}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Animated page wrapper (spring entrance) ───────────────────────────────────

const CaptionPageAnimated: React.FC<{
  page: ReturnType<typeof createTikTokStyleCaptions>['pages'][number];
  accentColor: string;
  accentFont: string;
  bodyFont: string;
  verticalCenterPct: number;
}> = ({ page, accentColor, accentFont, bodyFont, verticalCenterPct }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 240, mass: 0.8 },
    durationInFrames: 6,
  });

  return (
    <CaptionPage
      page={page}
      enterProgress={enterProgress}
      accentColor={accentColor}
      accentFont={accentFont}
      bodyFont={bodyFont}
      verticalCenterPct={verticalCenterPct}
    />
  );
};
