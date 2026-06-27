import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';

interface Props {
  text?: string;
  accentColor?: string;
  fontSize?: number;
  revealDuration?: number;
}

export const TextScramble: React.FC<Props> = ({
  text = 'CLASSIFIED',
  accentColor = '#00ff88',
  fontSize = 80,
  revealDuration = 30,
}) => {
  const frame = useCurrentFrame();

  const revealed = Math.floor((frame / revealDuration) * text.length);

  const displayed = text
    .split('')
    .map((char, i) => {
      if (i < revealed) return char;
      const seed = frame * 7 + i * 13;
      return CHARS[seed % CHARS.length];
    })
    .join('');

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          fontSize,
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: accentColor,
          textShadow: `0 0 20px ${accentColor}88`,
        }}
      >
        {displayed}
      </div>
    </AbsoluteFill>
  );
};
