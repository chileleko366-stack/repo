/**
 * HardCutFlash — brief opacity flash at beat boundary (frames 0-4).
 * Returns null after frame 5 so it has zero render cost through the beat.
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
