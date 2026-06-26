import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props { accentColor: string; }

export const StarTransition: React.FC<Props> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  if (frame > 18) return null;

  const scale = interpolate(frame, [0, 18], [0.02, 8], { extrapolateRight: 'clamp' });
  const rotate = frame * 8;
  const opacity = interpolate(frame, [14, 18], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      <div style={{
        width: 200,
        height: 200,
        backgroundColor: accentColor,
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        opacity,
      }} />
    </div>
  );
};
