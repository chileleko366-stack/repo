import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props { strength?: number; children?: React.ReactNode; }

export const EffectVignette: React.FC<Props> = ({ strength = 0.7, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {children}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${strength}) 100%)`,
        opacity,
        pointerEvents: 'none',
      }} />
    </div>
  );
};
