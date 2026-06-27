import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';

function seededChar(seed: number): string {
  return CHARS[Math.abs(seed) % CHARS.length];
}

export const TextScramble: React.FC<{
  text: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  text,
  color = '#00ff88',
  fontSize = 80,
  fontFamily = "'JetBrains Mono', monospace",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const totalFrames = 60;
  const progress = Math.min(frame / totalFrames, 1);

  const rendered = text.split('').map((char, i) => {
    if (char === ' ') return char;
    const charProgress = Math.max(0, (progress - (i / text.length) * 0.6) / 0.4);
    if (charProgress >= 1) return char;
    return seededChar(Math.floor(frame * 2 + i * 7) + i * 13);
  }).join('');

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 700,
          color,
          textAlign: 'center',
          letterSpacing: '0.05em',
          opacity: Math.min(frame / 10, 1),
        }}
      >
        {rendered}
      </div>
    </AbsoluteFill>
  );
};
