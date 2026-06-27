import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Props {
  value?: number;
  accentColor?: string;
  label?: string;
  color?: string;
}

export const ShapeCircularProgress: React.FC<Props> = ({
  value = 75,
  accentColor = '#0097a7',
  label = '75%',
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE, durationInFrames: 60 });
  const pct = interpolate(progress, [0, 1], [0, value / 100]);
  const r = 200;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <svg width="500" height="500" viewBox="0 0 500 500">
        <circle cx="250" cy="250" r={r} fill="none" stroke={`${accentColor}22`} strokeWidth="20" />
        <circle
          cx="250"
          cy="250"
          r={r}
          fill="none"
          stroke={accentColor}
          strokeWidth="20"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 250 250)"
        />
        <text x="250" y="260" textAnchor="middle" fill={accentColor} fontSize="80" fontFamily="Anton, sans-serif" fontWeight="900">
          {label}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
