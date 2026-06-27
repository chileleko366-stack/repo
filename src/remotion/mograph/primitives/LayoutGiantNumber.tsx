import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_BOUNCE } from './SpringConfigs';

interface Props {
  value?: string;
  label?: string;
  sublabel?: string;
  accentColor?: string;
  color?: string;
}

export const LayoutGiantNumber: React.FC<Props> = ({
  value = '4.6B',
  label = 'YEARS',
  sublabel = 'age of the solar system',
  accentColor = '#ff4500',
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_BOUNCE });
  const scale = interpolate(progress, [0, 1], [0.3, 1]);
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 60, gap: 16 }}>
      <div
        style={{
          fontSize: 200,
          fontFamily: 'Anton, sans-serif',
          fontWeight: 900,
          color: accentColor,
          transform: `scale(${scale})`,
          textShadow: `0 0 80px ${accentColor}66`,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 48, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.12em', opacity }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 28, fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(255,255,255,0.5)', opacity }}>
          {sublabel}
        </div>
      )}
    </AbsoluteFill>
  );
};
