import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const ShapeCircularProgress: React.FC<{
  progress: number;
  label?: string;
  accentColor?: string;
  size?: number;
  backgroundColor?: string;
}> = ({
  progress: targetPct,
  label = '',
  accentColor = '#d400ff',
  size = 400,
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const anim = spring({ frame, fps, config: { damping: 32, stiffness: 160 }, durationInFrames: 90 });
  const currentPct = interpolate(anim, [0, 1], [0, targetPct / 100]);

  const R = size / 2 - 30;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference * (1 - currentPct);
  const displayValue = Math.round(interpolate(anim, [0, 1], [0, targetPct]));

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Math.min(frame / 20, 1),
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={R} stroke={`${accentColor}22`} strokeWidth={24} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={R}
          stroke={accentColor} strokeWidth={24} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text x={size / 2} y={size / 2 + 20} textAnchor="middle"
          fontFamily="'Anton', sans-serif" fontSize={size * 0.25} fontWeight="700" fill={accentColor}>
          {displayValue}%
        </text>
      </svg>
      {label && (
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 44, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};
