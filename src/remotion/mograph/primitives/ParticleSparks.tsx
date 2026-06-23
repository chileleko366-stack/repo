import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface Spark { angle: number; speed: number; size: number; offset: number; fade: number; }

const SPARKS: Spark[] = Array.from({ length: 30 }, (_, i) => ({
  angle: (i / 30) * Math.PI * 2 + i * 0.3,
  speed: 2 + (i * 1.7) % 4,
  size: 4 + (i * 2.3) % 6,
  offset: (i * 11) % 40,
  fade: 0.5 + (i % 5) * 0.1,
}));

export const ParticleSparks: React.FC<{
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const CX = 540, CY = 960;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {SPARKS.map((spark, i) => {
          const age = (frame + spark.offset) % 80;
          const life = age / 80;
          if (life > 0.7) return null;
          const dist = spark.speed * life * 200;
          const x = CX + Math.cos(spark.angle) * dist;
          const y = CY + Math.sin(spark.angle) * dist;
          const opacity = spark.fade * (1 - life / 0.7);
          const size = spark.size * (1 - life * 0.5);
          return <circle key={i} cx={x} cy={y} r={size} fill={accentColor} opacity={opacity} />;
        })}
        <circle cx={CX} cy={CY} r={30} fill={accentColor} opacity={0.4 + Math.sin(frame * 0.15) * 0.2} />
        <circle cx={CX} cy={CY} r={15} fill={accentColor} opacity={0.8} />
      </svg>
    </AbsoluteFill>
  );
};
