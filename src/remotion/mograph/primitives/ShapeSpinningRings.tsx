import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  accentColor?: string;
  count?: number;
  baseRadius?: number;
  backgroundColor?: string;
}

export const ShapeSpinningRings: React.FC<Props> = ({
  accentColor = '#d400ff',
  count = 4,
  baseRadius = 120,
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cx = 540;
  const cy = 960;

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: count }).map((_, i) => {
          const r = baseRadius + i * 80;
          const circumference = 2 * Math.PI * r;
          const dashOffset = circumference - (circumference * (0.4 + i * 0.12));
          const rotation = t * (30 + i * 15) * (i % 2 === 0 ? 1 : -1);
          const opacity = 0.6 - i * 0.1;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={accentColor}
              strokeWidth={2 + i * 0.5}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              opacity={opacity}
              transform={`rotate(${rotation}, ${cx}, ${cy})`}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
