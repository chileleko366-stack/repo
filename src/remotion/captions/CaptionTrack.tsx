/**
 * CaptionTrack — full-video caption overlay driven by word-boundary JSON.
 *
 * Usage:
 *   <CaptionTrack
 *     wordBoundariesByBeat={...}
 *     beats={manifest.beats}
 *     channelId="ch1"
 *   />
 *
 * Rules (hardcoded, no exceptions):
 * - Captions HIDDEN on beats where captionsVisible === false
 *   (person / brand / place / map / anatomy / celestial / stock_video)
 * - Captions RESUME only after the beat's own durationFrames ends
 * - One page per ~1200ms of narration (combineTokensWithinMilliseconds)
 * - Active word: spring scale 1.0→1.12, accent colour, accent font
 * - Page entrance: spring translateY +28→0, damping 14, stiffness 240
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
import type { ManifestBeat } from '../../pipeline/types';
import { CaptionPage } from './CaptionPage';

// How many ms of narration to group into one caption page
const COMBINE_WITHIN_MS = 1200;

export interface WordBoundary {
  word: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

export interface CaptionTrackProps {
  /** beatId → word boundaries array */
  wordBoundariesByBeat: Record<string, WordBoundary[]>;
  beats: ManifestBeat[];
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
  const { fps } = useVideoConfig();

  // Build flat Caption[] for the whole video, skipping hidden beats
  const allCaptions = useMemo<Caption[]>(() => {
    const out: Caption[] = [];
    for (const beat of beats) {
      if (!beat.captionsVisible) continue;
      const wbs = wordBoundariesByBeat[beat.beatId];
      if (!wbs || wbs.length === 0) continue;

      const beatStartMs = Math.round((beat.startFrame / fps) * 1000);
      for (let i = 0; i < wbs.length; i++) {
        const wb = wbs[i];
        // Prepend space on every word after the first within a beat
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
    return out;
  }, [wordBoundariesByBeat, beats, fps]);

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
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Animated page wrapper (spring entrance, ported from tiktok template) ─────

const CaptionPageAnimated: React.FC<{
  page: ReturnType<typeof createTikTokStyleCaptions>['pages'][number];
  accentColor: string;
  accentFont: string;
  bodyFont: string;
}> = ({ page, accentColor, accentFont, bodyFont }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance: 0→1 over first 6 frames of this Sequence
  // frame is relative to the Sequence's from= because we're inside a <Sequence>
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
    />
  );
};
