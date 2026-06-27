import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_WORD } from './SpringConfigs';

interface Props {
  words?: string[];
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  staggerFrames?: number;
  accentWordIndex?: number;
  color?: string;
}

export const TextHorizontalSlide: React.FC<Props> = ({
  words = ['The', 'truth', 'is', 'here'],
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
  fontFamily = 'Anton, sans-serif',
  fontSize = 88,
  staggerFrames = 5,
  accentWordIndex = -1,
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        flexDirection: 'column',
        gap: 8,
        padding: 48,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {words.map((word, i) => {
          const delay = i * staggerFrames;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_WORD });
          const x = interpolate(progress, [0, 1], [320, 0]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 0, 1]);

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateX(${x}px)`,
                opacity,
                fontSize,
                fontFamily,
                fontWeight: 900,
                color: i === accentWordIndex ? accentColor : color,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
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
