/**
 * Starfield — 180 deterministic stars that drift downward at layer-dependent speeds.
 *
 * Three layers (0/1/2) drift at 0.8/0.4/0.15 px per frame.
 * Each star wraps via modulo so it re-enters from top.
 * Stars pulse opacity on a per-star phase offset.
 * Pure function of useCurrentFrame() — no CSS animation.
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const SPEEDS = [0.8, 0.4, 0.15] as const;

const STARS = Array.from({ length: 180 }, (_, i) => ({
  x: ((i * 127 + 33) % 1000) / 1000,  // 0–1 horizontal
  y: ((i * 89  + 57) % 1000) / 1000,  // 0–1 initial vertical
  r: 1 + (i % 4) * 0.5,
  layer: i % 3 as 0 | 1 | 2,
}));

export const Starfield: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <svg
        viewBox="0 0 1080 1920"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {STARS.map((s, i) => {
          const dy     = (frame * SPEEDS[s.layer]) % 1920;
          const yPx    = (s.y * 1920 + dy) % 1920;
          const xPx    = s.x * 1080;
          const cycle  = (frame + i * 11) % 60;
          const pulse  = interpolate(cycle, [0, 20, 60], [0.5, 1.0, 0.5], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <circle
              key={i}
              cx={xPx}
              cy={yPx}
              r={s.r}
              fill="#ffffff"
              fillOpacity={pulse * (0.5 + s.layer * 0.15)}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
