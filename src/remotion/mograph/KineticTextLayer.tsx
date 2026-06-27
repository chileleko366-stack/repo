import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { SPRING_WORD } from './primitives/SpringConfigs';
import { WordBoundary } from '../../pipeline/types';

interface Props {
  narration: string;
  accentColor: string;
  emphasisKeyword?: string;
  color?: string;
  wordBoundaries?: WordBoundary[];
  currentTimeMs?: number;
  fontSize?: number;
  fontFamily?: string;
}

export const KineticTextLayer: React.FC<Props> = ({
  narration,
  accentColor,
  emphasisKeyword = '',
  color = '#ffffff',
  wordBoundaries,
  currentTimeMs,
  fontSize = 68,
  fontFamily = 'Space Grotesk, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = narration.trim().split(/\s+/);

  return (
    <AbsoluteFill
      style={{
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 180,
        paddingLeft: 40,
        paddingRight: 40,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 10px', justifyContent: 'center', maxWidth: 960 }}>
        {words.map((word, i) => {
          const delay = i * 4;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_WORD });
          const y = interpolate(progress, [0, 1], [20, 0]);
          const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);
          const isEmphasis = word.toLowerCase().replace(/[^a-z]/g, '') === emphasisKeyword.toLowerCase().replace(/[^a-z]/g, '');

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateY(${y}px)`,
                opacity,
                fontSize: isEmphasis ? fontSize * 1.15 : fontSize,
                fontFamily,
                fontWeight: isEmphasis ? 900 : 600,
                color: isEmphasis ? accentColor : color,
                lineHeight: 1.3,
                textShadow: isEmphasis ? `0 0 24px ${accentColor}88` : undefined,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
