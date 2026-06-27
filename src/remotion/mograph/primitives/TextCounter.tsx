import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Props {
  from?: number;
  to?: number;
  prefix?: string;
  suffix?: string;
  accentColor?: string;
  fontSize?: number;
  duration?: number;
}

export const TextCounter: React.FC<Props> = ({
  from = 0,
  to = 100,
  prefix = '',
  suffix = '',
  accentColor = '#00ff88',
  fontSize = 120,
  duration = 60,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE, durationInFrames: duration });
  const value = interpolate(progress, [0, 1], [from, to]);
  const display = Number.isInteger(to) ? Math.round(value).toLocaleString() : value.toFixed(1);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div
        style={{
          fontSize,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 900,
          color: accentColor,
          textShadow: `0 0 40px ${accentColor}88`,
        }}
      >
        {prefix}{display}{suffix}
      </div>
    </AbsoluteFill>
  );
};
