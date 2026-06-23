import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const TextNeon: React.FC<{
  text: string;
  glowColor?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  text,
  glowColor = '#d400ff',
  fontSize = 100,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const pulse = 0.7 + Math.sin(frame * 0.12) * 0.3;
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
          color: '#ffffff',
          textAlign: 'center',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textShadow: [
            `0 0 ${20 * pulse}px ${glowColor}`,
            `0 0 ${50 * pulse}px ${glowColor}88`,
            `0 0 ${100 * pulse}px ${glowColor}44`,
            `0 0 200px ${glowColor}22`,
          ].join(', '),
          filter: `drop-shadow(0 0 8px ${glowColor})`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
