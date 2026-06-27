import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Props {
  value?: number;
  label?: string;
  accentColor?: string;
  suffix?: string;
}

export const DataGauge: React.FC<Props> = ({
  value = 78,
  label = 'Efficiency',
  accentColor = '#0097a7',
  suffix = '%',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE, durationInFrames: 60 });
  const displayValue = interpolate(progress, [0, 1], [0, value]);

  const r = 200;
  const cx = 400, cy = 380;
  const startAngle = -210;
  const sweepAngle = 240 * (value / 100);
  const total = 240;
  const circumference = (total / 360) * 2 * Math.PI * r;
  const drawn = (sweepAngle / 360) * 2 * Math.PI * r;

  const polarToXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle * Math.PI) / 180),
    y: cy + radius * Math.sin((angle * Math.PI) / 180),
  });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <svg width="800" height="700" viewBox="0 0 800 700">
        {/* Track */}
        <path
          d={`M ${polarToXY(-210, r).x} ${polarToXY(-210, r).y} A ${r} ${r} 0 1 1 ${polarToXY(30, r).x} ${polarToXY(30, r).y}`}
          fill="none"
          stroke={`${accentColor}22`}
          strokeWidth="24"
          strokeLinecap="round"
        />
        {/* Arc */}
        <path
          d={`M ${polarToXY(-210, r).x} ${polarToXY(-210, r).y} A ${r} ${r} 0 1 1 ${polarToXY(30, r).x} ${polarToXY(30, r).y}`}
          fill="none"
          stroke={accentColor}
          strokeWidth="24"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - drawn * progress}
        />
        <text x={cx} y={cy + 20} textAnchor="middle" fill={accentColor} fontSize="88" fontFamily="Anton, sans-serif" fontWeight="900">
          {Math.round(displayValue)}{suffix}
        </text>
        <text x={cx} y={cy + 70} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="28" fontFamily="Space Grotesk, sans-serif">
          {label}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
