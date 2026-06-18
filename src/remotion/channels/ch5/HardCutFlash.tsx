/**
 * HardCutFlash — brief opacity flash at beat boundary (frames 0-4).
 * Ch5 uses a dark fade instead of a coloured flash for the cinematic feel.
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const HardCutFlash: React.FC<{
  color?: string;
  peakOpacity?: number;
}> = ({ color = '#000000', peakOpacity = 0.7 }) => {
  const frame = useCurrentFrame();
  if (frame > 8) return null;
  const opacity = interpolate(frame, [0, 8], [peakOpacity, 0], {
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
