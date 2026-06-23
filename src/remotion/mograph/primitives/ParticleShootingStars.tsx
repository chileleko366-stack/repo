import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface Star { x: number; y: number; dx: number; dy: number; len: number; op: number; offset: number; }

const STARS: Star[] = Array.from({ length: 20 }, (_, i) => ({
  x: (i * 137.508 + 20) % 80 + 10,
  y: (i * 97.3 + 5) % 90 + 5,
  dx: ((i * 53 + 7) % 3 - 1.5) * 2,
  dy: ((i * 71 + 11) % 3 - 1.5),
  len: 40 + (i * 31) % 80,
  op: 0.4 + (i % 5) * 0.12,
  offset: (i * 13) % 60,
}));

export const ParticleShootingStars: React.FC<{
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  accentColor = '#ffffff',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {STARS.map((star, i) => {
          const period = 80 + i * 7;
          const phase = ((frame + star.offset) % period) / period;
          if (phase > 0.4) return null;
          const fade = phase < 0.1 ? phase / 0.1 : phase > 0.3 ? 1 - (phase - 0.3) / 0.1 : 1;
          const x1 = (star.x / 100) * 1080 + star.dx * phase * 200;
          const y1 = (star.y / 100) * 1920 + star.dy * phase * 200;
          const x2 = x1 - star.dx * (star.len / 10);
          const y2 = y1 - star.dy * (star.len / 10);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={accentColor} strokeWidth={2} strokeOpacity={star.op * fade} strokeLinecap="round" />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
