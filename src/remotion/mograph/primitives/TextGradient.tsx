import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const TextGradient: React.FC<{
  text: string;
  gradientColors?: string[];
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  text,
  gradientColors = ['#d400ff', '#ff6b00', '#00ff88'],
  fontSize = 100,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const sweep = (frame * 2) % 360;
  const opacity = Math.min(frame / 20, 1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        opacity,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          background: `linear-gradient(${sweep}deg, ${gradientColors.join(', ')})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
