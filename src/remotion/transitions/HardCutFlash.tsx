/**
 * HardCutFlash — brief accent-coloured flash at the start of a beat's Sequence.
 *
 * Creates a punchy hard-cut feel when placed inside every beat's Sequence.
 * Returns null once the flash completes (no DOM overhead for the rest of the beat).
 * All animation is a pure function of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const HardCutFlash: React.FC<{
  color?: string;
  peakOpacity?: number;
  durationFrames?: number;
}> = ({ color = '#ffffff', peakOpacity = 0.55, durationFrames = 5 }) => {
  const frame = useCurrentFrame();

  if (frame >= durationFrames) return null;

  const opacity = interpolate(frame, [0, durationFrames], [peakOpacity, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
