/**
 * ScrambleReveal — chars scramble through random glyphs then snap to the real
 * character, staggered left-to-right. Fully deterministic: the 'random' glyph
 * at each frame is computed from (frame * 7 + charIndex * 13) % CHARSET.length
 * so renders are reproducible. No setInterval, no side effects.
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!$%&';

function scramble(char: string, frame: number, idx: number, revealAt: number): string {
  if (frame >= revealAt || char === ' ') return char;
  return CHARSET[(frame * 7 + idx * 13) % CHARSET.length];
}

export const ScrambleReveal: React.FC<{
  text: string;
  startFrame?: number;
  staggerFrames?: number;
  scrambleFrames?: number;
  color?: string;
  fontSize?: number;
}> = ({
  text,
  startFrame = 0,
  staggerFrames = 3,
  scrambleFrames = 18,
  color = '#e0e0e0',
  fontSize = 64,
}) => {
  const frame = useCurrentFrame();
  const chars = text.split('');

  return (
    <div
      style={{
        fontFamily: "'Special Elite', cursive",
        fontSize,
        color,
        letterSpacing: '0.06em',
        lineHeight: 1.35,
        textAlign: 'center' as const,
        padding: '0 60px',
        wordBreak: 'break-word' as const,
      }}
    >
      {chars.map((char, i) => {
        const revealAt = startFrame + scrambleFrames + i * staggerFrames;
        const displayed = scramble(char, frame, i, revealAt);
        const isRevealed = frame >= revealAt || char === ' ';
        return (
          <span
            key={i}
            style={{
              color: isRevealed ? color : 'rgba(204,0,0,0.75)',
              textShadow: isRevealed ? 'none' : '0 0 8px rgba(204,0,0,0.5)',
              transition: 'none',
            }}
          >
            {displayed}
          </span>
        );
      })}
    </div>
  );
};
