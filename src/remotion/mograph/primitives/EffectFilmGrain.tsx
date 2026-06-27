import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface Props {
  intensity?: number;
  monochromatic?: boolean;
}

export const EffectFilmGrain: React.FC<Props> = ({
  intensity = 0.15,
  monochromatic = false,
}) => {
  const frame = useCurrentFrame();
  const seed = frame * 7919;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: intensity }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <filter id={`grain-${frame}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
            seed={seed}
          />
          {monochromatic ? (
            <feColorMatrix type="saturate" values="0" />
          ) : null}
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${frame})`} opacity="1" />
      </svg>
    </AbsoluteFill>
  );
};
