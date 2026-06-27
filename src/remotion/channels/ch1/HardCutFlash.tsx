/**
 * HardCutFlash — brief accent-coloured flash on the first 5 frames of a Sequence.
 *
 * Creates a punchy hard-cut feel when placed inside every beat's Sequence.
 * Returns null immediately after the flash completes (no DOM overhead).
 * All animation is a pure function of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const HardCutFlash: React.FC<{
  color?: string;
  peakOpacity?: number;
}> = ({ color = '#ffffff', peakOpacity = 0.55 }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 5], [peakOpacity, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (frame >= 5) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: color,
        opacity,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
};
