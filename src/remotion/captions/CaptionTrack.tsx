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
 * - Vertical position is a fixed true screen center (CAPTION_CENTER_PCT,
 *   the midpoint of the platform-UI safe area) for every beat. The
 *   primaryAnchor-positioned primitive card is the one that defers around
 *   the caption band when both are present in the same beat — see
 *   ShotBriefLayer.tsx's clampYPctToSafeZone. Previously captions deferred
 *   to primaryAnchor instead, which meant they landed in whatever thin
 *   leftover strip the card didn't occupy — usually off-center, since
 *   ShotBriefLayer defaults composition.grid to "center" (shot_brief.py's
 *   HARD RULES), so the card usually sits at true center already.
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
import { CAPTION_CENTER_PCT } from '../mograph/ShotBriefLayer';
import { CaptionPage } from './CaptionPage';

// Word-by-word: one page per 400ms
const COMBINE_WITHIN_MS = 800;

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
  const { fps } = useVideoConfig();

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
              verticalCenterPct={CAPTION_CENTER_PCT}
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
