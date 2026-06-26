import React from 'react';
import { useCurrentFrame } from 'remotion';

interface Props { opacity?: number; }

export const EffectFilmGrain: React.FC<Props> = ({ opacity = 0.06 }) => {
  const frame = useCurrentFrame();
  const baseFreq = 0.65 + Math.sin(frame * 0.01) * 0.005;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id={`grain-${frame % 4}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFreq}
            numOctaves={3}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        filter: `url(#grain-${frame % 4})`,
        opacity,
        mixBlendMode: 'overlay',
        backgroundColor: 'transparent',
      }} />
    </div>
  );
};
