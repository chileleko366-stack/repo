import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const EffectGlow: React.FC<{
  accentColor?: string;
  pulseSpeed?: number;
}> = ({
  accentColor = '#d400ff',
  pulseSpeed = 0.1,
}) => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + Math.sin(frame * pulseSpeed) * 0.5;
  const scale = 0.8 + pulse * 0.4;

  return (
    <AbsoluteFill style={{ opacity: Math.min(frame / 30, 0.8), pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 600, height: 600,
        transform: `translate(-50%, -50%) scale(${scale})`,
        background: `radial-gradient(ellipse at center, ${accentColor}66 0%, ${accentColor}33 40%, transparent 70%)`,
        filter: 'blur(60px)',
      }} />
    </AbsoluteFill>
  );
};
