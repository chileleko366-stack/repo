import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { type Caption } from '@remotion/captions';
import type { TimedBeat } from '../transitions/BeatCompositor';
import { captionsToData } from './captioneer/utils';
import { CHANNEL_CAPTION_STYLE, CHANNEL_CAPTION_PROPS } from './captioneer/channelStyles';
import { WordHighlight } from './captioneer/WordHighlight';
import { Karaoke } from './captioneer/Karaoke';
import { Glow } from './captioneer/Glow';
import { Bounce } from './captioneer/Bounce';
import { Typewriter } from './captioneer/Typewriter';
import { Flicker } from './captioneer/Flicker';
import { Highlighter } from './captioneer/Highlighter';
import { Scale } from './captioneer/Scale';
import { Wave } from './captioneer/Wave';

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

  const totalMs = (beats.reduce((s, b) => s + b.audioFrames, 0) / fps) * 1000;

  const captionData = useMemo(
    () => captionsToData(allCaptions, totalMs),
    [allCaptions, totalMs],
  );

  if (!captionData || captionData.segments.length === 0) return null;

  const style = CHANNEL_CAPTION_STYLE[channelId] ?? 'WordHighlight';
  const extraProps = CHANNEL_CAPTION_PROPS[channelId] ?? {};

  const commonProps = {
    captions: captionData,
    fontFamily: bodyFont,
    fontSize: 50,
    position: 'bottom' as const,
    maxWidth: 900,
    wordsPerLine: 5,
    useSmartWrap: true,
    ...extraProps,
  };

  const component = (() => {
    switch (style) {
      case 'WordHighlight': return <WordHighlight {...commonProps} highlightColor={accentColor} />;
      case 'Karaoke':      return <Karaoke {...commonProps} fillColor={accentColor} />;
      case 'Glow':         return <Glow {...commonProps} glowColor={accentColor} />;
      case 'Bounce':       return <Bounce {...commonProps} bounceColor={accentColor} />;
      case 'Typewriter':   return <Typewriter {...commonProps} cursorColor={accentColor} />;
      case 'Flicker':      return <Flicker {...commonProps} flickerColor={accentColor} />;
      case 'Highlighter':  return <Highlighter {...commonProps} highlightColor={accentColor} />;
      case 'Scale':        return <Scale {...commonProps} scaleColor={accentColor} />;
      case 'Wave':         return <Wave {...commonProps} waveColor={accentColor} />;
      default:             return <WordHighlight {...commonProps} highlightColor={accentColor} />;
    }
  })();

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {component}
    </AbsoluteFill>
  );
};
