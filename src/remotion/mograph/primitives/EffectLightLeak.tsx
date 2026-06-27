import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const EffectLightLeak: React.FC<{
  warmColor?: string;
  coolColor?: string;
}> = ({
  warmColor = '#ff9900',
  coolColor = '#0044ff',
}) => {
  const frame = useCurrentFrame();
  const pulse = 0.6 + Math.sin(frame * 0.08) * 0.4;
  const opacity = Math.min(frame / 30, 0.6);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: -100, left: -100, width: 500, height: 500,
        background: `radial-gradient(ellipse at center, ${warmColor}88 0%, ${warmColor}44 40%, transparent 70%)`,
        filter: 'blur(30px)',
        opacity: pulse,
        transform: 'rotate(-20deg)',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, right: -100, width: 500, height: 500,
        background: `radial-gradient(ellipse at center, ${coolColor}66 0%, ${coolColor}33 40%, transparent 70%)`,
        filter: 'blur(30px)',
        opacity: 1 - pulse * 0.3,
        transform: 'rotate(20deg)',
      }} />
      <div style={{
        position: 'absolute', top: -50, right: 100, width: 300, height: 800,
        background: `linear-gradient(160deg, ${warmColor}44 0%, transparent 60%)`,
        filter: 'blur(20px)',
        opacity: pulse * 0.6,
      }} />
    </AbsoluteFill>
  );
};
