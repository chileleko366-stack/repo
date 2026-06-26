import React from 'react';
import { useCurrentFrame } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; }

export const BackgroundFluidWave: React.FC<Props> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  const baseFreqY = 0.008 + frame * 0.0003;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="wave-warp">
          <feTurbulence
            type="turbulence"
            baseFrequency={`0.012 ${baseFreqY}`}
            numOctaves={4}
            seed={seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={120}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${backgroundColor} 0%, ${accentColor}33 40%, ${accentColor}66 70%, ${accentColor}22 100%)`,
        filter: 'url(#wave-warp)',
      }} />
    </div>
  );
};
