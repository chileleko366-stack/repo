/**
 * TickerTape — frame-driven scrolling financial ticker strip.
 * translateX driven by interpolate over the beat duration.
 * No CSS animation, no requestAnimationFrame.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

const SYMBOLS =
  'AAPL +2.3%  ·  TSLA −1.1%  ·  NVDA +4.7%  ·  SPX +0.4%  ·  BTC +1.2%  ·  GME +12.4%  ·  META +0.9%  ·  NFLX −2.1%  ·  ';

export const TickerTape: React.FC<{
  durationFrames: number;
  accent?: string;
}> = ({ durationFrames, accent = '#00ff88' }) => {
  const frame = useCurrentFrame();

  const offset = interpolate(frame, [0, durationFrames], [1080, -1920], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 248,
        left: 0,
        right: 0,
        height: 54,
        background: 'rgba(0,0,0,0.72)',
        borderTop: `1px solid ${accent}44`,
        borderBottom: `1px solid ${accent}44`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          whiteSpace: 'nowrap',
          transform: `translateX(${offset}px)`,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 27,
          color: accent,
          letterSpacing: '0.04em',
        }}
      >
        {SYMBOLS}{SYMBOLS}
      </div>
    </div>
  );
};
