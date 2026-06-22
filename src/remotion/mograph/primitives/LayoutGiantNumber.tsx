import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const LayoutGiantNumber: React.FC<{
  number: string | number;
  label?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}> = ({
  number,
  label = '',
  accentColor = '#d400ff',
  backgroundColor = '#000000',
  fontFamily = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 24, stiffness: 260 }, durationInFrames: 40 });
  const scale = interpolate(progress, [0, 1], [0.7, 1]);
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 1, 1]);

  const numStr = typeof number === 'number'
    ? new Intl.NumberFormat('en-US').format(number)
    : String(number);

  const fontSize = numStr.length <= 4 ? 320 : numStr.length <= 7 ? 220 : numStr.length <= 10 ? 160 : 120;

  return (
    <AbsoluteFill style={{ backgroundColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity }}>
      <div style={{
        fontFamily,
        fontSize,
        fontWeight: 700,
        color: accentColor,
        lineHeight: 0.9,
        letterSpacing: '-0.06em',
        textShadow: `0 0 80px ${accentColor}66`,
        transform: `scale(${scale})`,
        textAlign: 'center',
        padding: '0 40px',
      }}>
        {numStr}
      </div>
      {label && (
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 52,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.75)',
          marginTop: 24,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: interpolate(progress, [0, 0.6, 1], [0, 0, 1]),
        }}>
          {label}
        </div>
      )}
    </AbsoluteFill>
  );
};
