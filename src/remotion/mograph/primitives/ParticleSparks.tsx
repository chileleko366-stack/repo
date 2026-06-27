import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  count?: number;
  accentColor?: string;
  originXPct?: number;
  originYPct?: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export const ParticleSparks: React.FC<Props> = ({
  count = 20,
  accentColor = '#ff4500',
  originXPct = 50,
  originYPct = 60,
}) => {
  const frame = useCurrentFrame();
  const W = 1080, H = 1920;
  const ox = (originXPct / 100) * W;
  const oy = (originYPct / 100) * H;

  const sparks = Array.from({ length: count }).map((_, i) => {
    const angle = seededRandom(i * 3) * Math.PI * 2;
    const speed = 3 + seededRandom(i * 7) * 8;
    const life = 20 + Math.floor(seededRandom(i * 11) * 30);
    const progress = Math.min(frame / life, 1);
    const x = ox + Math.cos(angle) * speed * frame;
    const y = oy + Math.sin(angle) * speed * frame + 0.1 * frame * frame;
    const opacity = interpolate(progress, [0, 0.3, 1], [1, 0.8, 0]);
    const size = interpolate(progress, [0, 1], [4, 1]);

    return { x, y, opacity, size };
  });

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {sparks.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.size} fill={accentColor} opacity={Math.max(0, s.opacity)} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
