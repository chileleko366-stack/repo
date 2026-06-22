import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const CinematicSciFi: React.FC<{
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  accentColor = '#00ff88',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const scan = (frame * 2) % 1920;
  const opacity = Math.min(frame / 30, 0.9);

  const corners: [number, number, number, number][] = [
    [60, 80, 1, 1],
    [1020, 80, -1, 1],
    [60, 1840, 1, -1],
    [1020, 1840, -1, -1],
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
        opacity,
        pointerEvents: 'none',
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={(i + 1) * (1920 / 12)} x2={1080} y2={(i + 1) * (1920 / 12)}
            stroke={accentColor} strokeWidth={0.5} strokeOpacity={0.15} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * (1080 / 6)} y1={0} x2={(i + 1) * (1080 / 6)} y2={1920}
            stroke={accentColor} strokeWidth={0.5} strokeOpacity={0.15} />
        ))}
        <line x1={0} y1={scan} x2={1080} y2={scan} stroke={accentColor} strokeWidth={2} strokeOpacity={0.5} />
        {corners.map(([cx, cy, sx, sy], i) => (
          <g key={i}>
            <line x1={cx} y1={cy} x2={cx + sx * 40} y2={cy} stroke={accentColor} strokeWidth={3} strokeOpacity={0.7} />
            <line x1={cx} y1={cy} x2={cx} y2={cy + sy * 40} stroke={accentColor} strokeWidth={3} strokeOpacity={0.7} />
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
};
