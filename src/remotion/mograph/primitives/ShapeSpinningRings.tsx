import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const RINGS = [
  { r: 300, speed: 0.8, width: 3, op: 1.0 },
  { r: 240, speed: -1.2, width: 4, op: 0.7 },
  { r: 180, speed: 1.6, width: 5, op: 0.5 },
  { r: 120, speed: -2.0, width: 6, op: 0.8 },
  { r: 60, speed: 2.5, width: 8, op: 1.0 },
];

export const ShapeSpinningRings: React.FC<{
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(frame / 30, 0.9);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity,
      }}
    >
      <svg width={700} height={700} viewBox="0 0 700 700">
        {RINGS.map((ring, i) => {
          const angle = (frame * ring.speed) % 360;
          const dashLen = ring.r * 2 * Math.PI;
          return (
            <ellipse
              key={i}
              cx={350} cy={350}
              rx={ring.r} ry={ring.r * 0.5}
              stroke={accentColor}
              strokeWidth={ring.width}
              strokeOpacity={ring.op * 0.6}
              strokeDasharray={`${dashLen * 0.6} ${dashLen * 0.15}`}
              fill="none"
              transform={`rotate(${angle} 350 350)`}
            />
          );
        })}
        <circle cx={350} cy={350} r={24} fill={accentColor} opacity={0.8} />
      </svg>
    </AbsoluteFill>
  );
};
