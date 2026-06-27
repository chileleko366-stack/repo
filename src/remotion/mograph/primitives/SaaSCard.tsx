import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_SNAPPY, SPRING_GENTLE } from './SpringConfigs';
import { CARD_RADIUS } from './SaaSTokens';

interface Props {
  primary?: string;
  label?: string;
  body?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  accentFont?: string;
}

export const SaaSCard: React.FC<Props> = ({
  primary = '2.4M',
  label = 'Daily Users',
  body = 'Growing 34% month over month across all channels.',
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
  fontFamily = 'Space Grotesk, sans-serif',
  accentFont = 'JetBrains Mono, monospace',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_SNAPPY });
  const scale = interpolate(progress, [0, 1], [0.88, 1]);
  const y = interpolate(progress, [0, 1], [28, 0]);
  const primarySize = Math.max(48, 96 - primary.length * 4);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: CARD_RADIUS,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 900,
          boxShadow: '0 17px 40px rgba(0,0,0,0.4)',
          border: `1px solid rgba(255,255,255,0.1)`,
          transform: `scale(${scale}) translateY(${y}px)`,
        }}
      >
        <div style={{ fontSize: 18, fontFamily, color: `${accentColor}99`, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          {label}
        </div>
        <div style={{ fontSize: primarySize, fontFamily: accentFont, fontWeight: 900, color: accentColor, marginBottom: 20, lineHeight: 1 }}>
          {primary}
        </div>
        <div style={{ width: '100%', height: 1, background: `${accentColor}33`, marginBottom: 20 }} />
        <div style={{ fontSize: 28, fontFamily, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
          {body}
        </div>
      </div>
    </AbsoluteFill>
  );
};
