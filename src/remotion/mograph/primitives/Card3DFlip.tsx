import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_BOUNCE } from './SpringConfigs';

interface Props {
  primary?: string;
  label?: string;
  body?: string;
  accentColor?: string;
  backgroundColor?: string;
  startRotateY?: number;
  startRotateX?: number;
  startRotateZ?: number;
}

export const Card3DFlip: React.FC<Props> = ({
  primary = '$2.4B',
  label = 'MARKET CAP',
  body = 'In a single trading session.',
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
  startRotateY = -31,
  startRotateX = 32,
  startRotateZ = -5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_BOUNCE });
  const rotY = interpolate(progress, [0, 1], [startRotateY, 0]);
  const rotX = interpolate(progress, [0, 1], [startRotateX, 0]);
  const rotZ = interpolate(progress, [0, 1], [startRotateZ, 0]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', backgroundColor, perspective: 1200 }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${accentColor}44`,
          borderRadius: 28,
          padding: '52px 44px',
          width: 860,
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
          boxShadow: `0 0 60px ${accentColor}44`,
        }}
      >
        <div style={{ fontSize: 20, fontFamily: 'Space Grotesk, sans-serif', color: `${accentColor}88`, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          {label}
        </div>
        <div style={{ fontSize: 88, fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: accentColor, lineHeight: 1, marginBottom: 24 }}>
          {primary}
        </div>
        <div style={{ width: '100%', height: 1, background: `${accentColor}33`, marginBottom: 24 }} />
        <div style={{ fontSize: 30, fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
          {body}
        </div>
      </div>
    </AbsoluteFill>
  );
};
