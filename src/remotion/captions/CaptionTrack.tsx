import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { FlatWordBoundary, getActiveWords } from './useWordBoundaries';

interface Props {
  words: FlatWordBoundary[];
  accentColor?: string;
  fontFamily?: string;
}

export const CaptionTrack: React.FC<Props> = ({
  words,
  accentColor = '#d400ff',
  fontFamily = 'Space Grotesk, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const active = getActiveWords(words, currentMs);
  const lastIdx = active.length - 1;

  return (
    <AbsoluteFill
      style={{
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 80,
        paddingLeft: 40,
        paddingRight: 40,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 8px', justifyContent: 'center', maxWidth: 960 }}>
        {active.map((w, i) => {
          const isActive = i === lastIdx;
          return (
            <span
              key={`${w.beatId}-${w.globalStartMs}`}
              style={{
                fontFamily,
                fontWeight: isActive ? 900 : 600,
                fontSize: isActive ? 52 : 44,
                color: isActive ? accentColor : 'rgba(255,255,255,0.55)',
                display: 'inline-block',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'none',
                textShadow: isActive ? `0 2px 12px ${accentColor}88` : undefined,
                lineHeight: 1.3,
              }}
            >
              {w.word.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
