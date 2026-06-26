import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props { accentColor: string; }

export const CCLightSweep: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  if (frame > 20) return null;

  const tx = interpolate(frame, [0, 20], [-1080, 1080], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0,
        width: '100%',
        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
        transform: `translateX(${tx}px)`,
      }} />
    </div>
  );
};
