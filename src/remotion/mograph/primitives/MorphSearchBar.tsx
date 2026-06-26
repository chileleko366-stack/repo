import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; }

export const MorphSearchBar: React.FC<Props> = ({ accentColor }) => {
  const frame = useCurrentFrame();

  // Phase 1: slide in from right (0–25)
  const slideX = interpolate(frame, [0, 25], [200, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Phase 2: compress width (25–60)
  const width = interpolate(frame, [25, 60], [600, 120], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const radius = interpolate(frame, [25, 60], [60, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Phase 3: fade out (60–90)
  const opacity = interpolate(frame, [60, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width,
        height: 88,
        borderRadius: radius,
        backgroundColor: accentColor,
        transform: `translateX(${slideX}px)`,
        opacity,
        boxShadow: `0 8px 32px ${accentColor}66`,
      }} />
    </div>
  );
};
