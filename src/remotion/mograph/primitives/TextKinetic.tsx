import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_WORD } from './SpringConfigs';

interface Props {
  words?: string[];
  accentColor?: string;
  accentWordIndex?: number;
  staggerFrames?: number;
  fontSize?: number;
  color?: string;
}

export const TextKinetic: React.FC<Props> = ({
  words = ['Hello', 'World'],
  accentColor = '#d400ff',
  accentWordIndex = 0,
  staggerFrames = 6,
  fontSize = 96,
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, padding: 48 }}>
      {words.map((word, i) => {
        const delay = i * staggerFrames;
        const progress = spring({ frame: frame - delay, fps, config: SPRING_WORD });
        const scale = interpolate(progress, [0, 1], [0, 1]);
        const y = interpolate(progress, [0, 1], [30, 0]);
        const blur = interpolate(progress, [0, 1], [4, 0]);
        const isAccent = i === accentWordIndex;

        return (
          <span
            key={i}
            style={{
              fontSize,
              fontWeight: 900,
              fontFamily: 'Anton, sans-serif',
              color: isAccent ? accentColor : color,
              transform: `scale(${scale}) translateY(${y}px)`,
              filter: `blur(${blur}px)`,
              display: 'inline-block',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            {word}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};
