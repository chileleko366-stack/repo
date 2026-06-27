import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const EffectFilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      <svg viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <filter id="efg-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves={4} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect x={0} y={0} width={1080} height={1920} filter="url(#efg-grain)" fill="white" />
      </svg>
    </AbsoluteFill>
  );
};
