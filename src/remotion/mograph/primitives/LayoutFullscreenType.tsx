import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_SNAPPY } from './SpringConfigs';

interface Props {
  lines?: string[];
  accentColor?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
}

export const LayoutFullscreenType: React.FC<Props> = ({
  lines = ['EVERY', 'SECOND', 'COUNTS'],
  accentColor = '#d400ff',
  color = '#ffffff',
  fontFamily = 'Anton, sans-serif',
  fontSize = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 60, gap: 0 }}>
      {lines.map((line, i) => {
        const delay = i * 8;
        const progress = spring({ frame: frame - delay, fps, config: SPRING_SNAPPY });
        const y = interpolate(progress, [0, 1], [60, 0]);
        const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);
        const isAccent = i % 2 === 1;

        return (
          <div
            key={i}
            style={{
              fontSize,
              fontFamily,
              fontWeight: 900,
              color: isAccent ? accentColor : color,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1,
              transform: `translateY(${y}px)`,
              opacity,
            }}
          >
            {line}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
