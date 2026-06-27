import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  text?: string;
  accentColor?: string;
  color?: string;
  fontSize?: number;
  amplitude?: number;
}

export const TextWave: React.FC<Props> = ({
  text = 'WAVE',
  accentColor = '#0097a7',
  color = '#ffffff',
  fontSize = 96,
  amplitude = 20,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex' }}>
        {text.split('').map((char, i) => {
          const y = amplitude * Math.sin(t * 3 + i * 0.5);
          const isVowel = 'AEIOU'.includes(char.toUpperCase());
          return (
            <span
              key={i}
              style={{
                fontSize,
                fontFamily: 'Anton, sans-serif',
                fontWeight: 900,
                color: isVowel ? accentColor : color,
                transform: `translateY(${y}px)`,
                display: 'inline-block',
                textTransform: 'uppercase',
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
