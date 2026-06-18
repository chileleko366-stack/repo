/**
 * FilmGrain — SVG feTurbulence noise overlay for The Quiet Record.
 *
 * The turbulence seed advances every 2 frames to create a subtle flicker.
 * Rendered at ~3.5% opacity so it never dominates.
 * Pure function of useCurrentFrame() — no CSS animation.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.035 }) => {
  const frame = useCurrentFrame();
  const seed  = Math.floor(frame / 2);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      <svg
        viewBox="0 0 1080 1920"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.80"
            numOctaves={4}
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          x={0} y={0}
          width={1080} height={1920}
          filter="url(#grain)"
          fill="white"
        />
      </svg>
    </AbsoluteFill>
  );
};
