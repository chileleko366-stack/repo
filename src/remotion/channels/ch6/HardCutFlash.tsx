/**
 * HardCutFlash — brief opacity flash at beat boundary (frames 0-4).
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const HardCutFlash: React.FC<{
  color?: string;
  peakOpacity?: number;
}> = ({ color = '#ffffff', peakOpacity = 0.55 }) => {
  const frame = useCurrentFrame();
  if (frame > 5) return null;
  const opacity = interpolate(frame, [0, 5], [peakOpacity, 0], {
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        background: color,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
