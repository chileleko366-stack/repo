import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const TextWave: React.FC<{
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
  fontSize = 80,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const chars = text.split('');
  const accentEvery = Math.max(1, Math.floor(chars.length / 3));

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {chars.map((char, i) => {
          const wave = Math.sin(frame * 0.1 + i * 0.4) * 20;
          const opacity = Math.max(0, Math.min(1, (frame - i * 1.5) / 15));
          const isAccent = i % accentEvery === 0 && char !== ' ';
          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isAccent ? accentColor : color,
                transform: `translateY(${wave}px)`,
                opacity,
                display: 'inline-block',
              }}
            >
              {char === ' ' ? ' ' : char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
