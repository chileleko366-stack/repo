import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Props {
  value?: number;
  label?: string;
  accentColor?: string;
  backgroundColor?: string;
  prefix?: string;
  suffix?: string;
}

export const ProgressBar: React.FC<Props> = ({
  value = 75,
  label = 'Progress',
  accentColor = '#00ff88',
  backgroundColor = 'transparent',
  prefix = '',
  suffix = '%',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE, durationInFrames: 60 });
  const pct = interpolate(progress, [0, 1], [0, value]);

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 32, fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
          <span style={{ fontSize: 36, fontFamily: 'JetBrains Mono, monospace', color: accentColor, fontWeight: 700 }}>
            {prefix}{Math.round(pct)}{suffix}
          </span>
        </div>
        <div style={{ height: 20, background: `${accentColor}22`, borderRadius: 10, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
              borderRadius: 10,
              boxShadow: `0 0 16px ${accentColor}88`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
