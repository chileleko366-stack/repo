/**
 * CaptionTrack — word-level captions using neutral-Stage/remotion-captioneer styles.
 * Each channel gets its own caption personality matching the AE tutorial mograph aesthetic:
 * active word lights up in accent colour, surrounding words fade, clean text only — no boxes.
 *
 * Channel mapping:
 *  ch1 Dopamine Loop    → WordHighlight (word lights up, purple)
 *  ch2 FinanceFiction   → Scale         (word grows, green)
 *  ch3 Redacted         → Flicker       (neon flicker, red flash)
 *  ch4 The Grey Matter  → Glow          (pulsing neon halo, pink)
 *  ch5 The Quiet Record → Wave          (sequential rise/fall, gold)
 *  ch6 Red Space Facts  → Karaoke       (left-to-right fill, orange)
 */

import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { type Caption } from '@remotion/captions';
import type { TimedBeat } from '../transitions/BeatCompositor';
import { captionsToData } from './captioneer/utils';
import { WordHighlight } from './captioneer/WordHighlight';
import { Scale } from './captioneer/Scale';
import { Flicker } from './captioneer/Flicker';
import { Glow } from './captioneer/Glow';
import { Wave } from './captioneer/Wave';
import { Karaoke } from './captioneer/Karaoke';

export interface WordBoundary {
  word: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

export interface CaptionTrackProps {
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
  bodyFont,
}) => {
  const { fps } = useVideoConfig();

  // Build flat Caption[] from word boundaries — KEEP THIS EXACT LOGIC (it is correct)
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
              endMs:   beatStartMs + wb.endMs,
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

  const totalMs = (beats.reduce((s, b) => s + b.audioFrames, 0) / fps) * 1000;

  const captionData = useMemo(
    () => captionsToData(allCaptions, totalMs),
    [allCaptions, totalMs],
  );

  if (!captionData || captionData.segments.length === 0) return null;

  // Shared props — clean mograph text, no background, no box, bottom of frame
  const common = {
    captions: captionData,
    fontFamily: bodyFont,
    fontSize: 48,
    fontColor: 'rgba(255,255,255,0.38)' as const,
    position: 'bottom' as const,
    maxWidth: 900,
    wordsPerLine: 5,
    useSmartWrap: true,
  };

  const component = (() => {
    switch (channelId) {
      case 'ch1': return <WordHighlight {...common} highlightColor={accentColor} />;
      case 'ch2': return <Scale        {...common} scaleColor={accentColor} maxScale={1.25} />;
      case 'ch3': return <Flicker      {...common} flickerColor="#cc0000" />;
      case 'ch4': return <Glow         {...common} glowColor={accentColor} glowIntensity={22} />;
      case 'ch5': return <Wave         {...common} waveColor="#c8a96e" waveHeight={18} />;
      case 'ch6': return <Karaoke      {...common} fillColor="#ff4500" />;
      default:    return <WordHighlight {...common} highlightColor={accentColor} />;
    }
  })();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {component}
    </AbsoluteFill>
  );
};
