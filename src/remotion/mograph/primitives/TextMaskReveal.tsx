import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const TextMaskReveal: React.FC<{
  text: string;
  color?: string;
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  text,
  color = '#ffffff',
  accentColor = '#d400ff',
  fontSize = 96,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 30, stiffness: 200 }, durationInFrames: 50 });
  const revealPct = interpolate(progress, [0, 1], [0, 100]);

  const baseStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: 700,
    textAlign: 'center' as const,
    letterSpacing: '-0.02em',
    textTransform: 'uppercase' as const,
    whiteSpace: 'nowrap' as const,
    padding: '0 60px',
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ ...baseStyle, color: `${accentColor}22` }}>{text}</div>
        <div
          style={{
            ...baseStyle,
            color,
            position: 'absolute',
            inset: 0,
            clipPath: `inset(0 ${100 - revealPct}% 0 0)`,
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
