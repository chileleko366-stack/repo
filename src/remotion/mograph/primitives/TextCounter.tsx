import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const TextCounter: React.FC<{
  target: number;
  prefix?: string;
  suffix?: string;
  accentColor?: string;
  fontSize?: number;
  formatWithCommas?: boolean;
  backgroundColor?: string;
  fontFamily?: string;
}> = ({
  target,
  prefix = '',
  suffix = '',
  accentColor = '#d400ff',
  fontSize = 140,
  formatWithCommas = true,
  backgroundColor = '#000000',
  fontFamily = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const DURATION = 90;
  const t = Math.min(frame / DURATION, 1);
  const eased = 1 - Math.pow(1 - t, 3);
  const current = Math.round(eased * target);
  const formatted = formatWithCommas
    ? new Intl.NumberFormat('en-US').format(current)
    : String(current);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Math.min(frame / 15, 1),
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
          textShadow: `0 0 40px ${accentColor}66`,
          letterSpacing: '-0.04em',
        }}
      >
        {prefix}{formatted}{suffix}
      </div>
    </AbsoluteFill>
  );
};
