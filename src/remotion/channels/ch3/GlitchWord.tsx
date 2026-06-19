/**
 * GlitchWord — RGB-split digital glitch effect on a single word.
 *
 * Three copies of the text are layered: red channel shifted +X, blue channel
 * shifted −X, white main layer. The offset values are driven by
 * `(frame % 20)` so the glitch fires on a predictable cycle.
 * No CSS transitions or animations.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const GlitchWord: React.FC<{
  text: string;
  fontSize?: number;
  color?: string;
}> = ({ text, fontSize = 100, color = '#f0f0f0' }) => {
  const frame = useCurrentFrame();
  const cycle = frame % 20;
  const isGlitching = cycle < 3 || (cycle > 11 && cycle < 13);

  const rOffset = isGlitching
    ? interpolate(cycle, [0, 2], [0, 7], { extrapolateRight: 'clamp' })
    : 0;
  const bOffset = isGlitching
    ? interpolate(cycle, [0, 2], [0, -5], { extrapolateRight: 'clamp' })
    : 0;

  const shared: React.CSSProperties = {
    fontFamily: "'Special Elite', cursive",
    fontSize,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    lineHeight: 1,
    display: 'inline-block',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Red channel */}
      <span
        style={{
          ...shared,
          position: 'absolute',
          color: '#cc0000',
          opacity: 0.65,
          transform: `translateX(${rOffset}px)`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {text}
      </span>
      {/* Blue channel */}
      <span
        style={{
          ...shared,
          position: 'absolute',
          color: '#4488ff',
          opacity: 0.65,
          transform: `translateX(${bOffset}px)`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {text}
      </span>
      {/* Main */}
      <span style={{ ...shared, color }}>{text}</span>
    </div>
  );
};
