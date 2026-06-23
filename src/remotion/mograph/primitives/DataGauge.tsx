import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const DataGauge: React.FC<{
  value: number;
  max?: number;
  label?: string;
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  value,
  max = 100,
  label = '',
  accentColor = '#d400ff',
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 30, stiffness: 150 }, durationInFrames: 80 });
  const pct = Math.min(value / max, 1);
  const angle = interpolate(progress, [0, 1], [0, pct * 180]);

  const R = 200, CX = 300, CY = 300;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const ax = (a: number) => CX + R * Math.cos(toRad(a));
  const ay = (a: number) => CY + R * Math.sin(toRad(a));

  const endAngle = 180 + angle;
  const largeArc = angle > 180 ? 1 : 0;

  const trackPath = `M ${ax(180)} ${ay(180)} A ${R} ${R} 0 1 1 ${ax(0)} ${ay(0)}`;
  const fillPath = angle > 0
    ? `M ${ax(180)} ${ay(180)} A ${R} ${R} 0 ${largeArc} 1 ${ax(endAngle)} ${ay(endAngle)}`
    : '';

  const displayValue = Math.round(interpolate(progress, [0, 1], [0, value]));

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
      <svg width={600} height={340} viewBox="0 0 600 340">
        <path d={trackPath} stroke={`${accentColor}33`} strokeWidth={24} fill="none" strokeLinecap="round" />
        {fillPath && (
          <path d={fillPath} stroke={accentColor} strokeWidth={24} fill="none" strokeLinecap="round" />
        )}
        <text x={CX} y={CY + 30} textAnchor="middle"
          fontFamily="'Anton', sans-serif" fontSize={80} fontWeight="700" fill={accentColor}>
          {displayValue}
        </text>
        {label && (
          <text x={CX} y={CY + 80} textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif" fontSize={32} fill="rgba(255,255,255,0.7)">
            {label}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};
