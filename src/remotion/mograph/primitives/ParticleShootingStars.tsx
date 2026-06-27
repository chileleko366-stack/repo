import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  count?: number;
  accentColor?: string;
  backgroundColor?: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export const ParticleShootingStars: React.FC<Props> = ({
  count = 12,
  accentColor = '#ff4500',
  backgroundColor = '#050010',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 1080, H = 1920;

  const stars = Array.from({ length: count }).map((_, i) => {
    const period = 40 + seededRandom(i * 3) * 60;
    const localFrame = (frame + i * 17) % period;
    const progress = localFrame / period;
    const startX = seededRandom(i * 7) * W;
    const startY = seededRandom(i * 11) * H * 0.5;
    const angle = 20 + seededRandom(i * 5) * 30;
    const length = 80 + seededRandom(i * 9) * 120;
    const dx = Math.cos((angle * Math.PI) / 180) * length;
    const dy = Math.sin((angle * Math.PI) / 180) * length;
    const x = startX + dx * progress;
    const y = startY + dy * progress;
    const opacity = interpolate(progress, [0, 0.1, 0.8, 1], [0, 1, 0.8, 0]);

    return { x, y, dx: -dx * 0.4, dy: -dy * 0.4, opacity };
  });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {stars.map((s, i) => (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={s.x + s.dx}
            y2={s.y + s.dy}
            stroke={accentColor}
            strokeWidth={1.5}
            opacity={s.opacity}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
