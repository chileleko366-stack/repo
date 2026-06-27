/**
 * CandlestickChart — 5 animated SVG candlestick bars.
 * Each bar draws in sequentially driven by interpolate.
 * Used as a decorative background for stat/none beats.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

const CANDLES = [
  { open: 50, close: 76, high: 83, low: 44, color: '#00ff88' },
  { open: 76, close: 58, high: 80, low: 54, color: '#ff4444' },
  { open: 58, close: 90, high: 96, low: 55, color: '#00ff88' },
  { open: 90, close: 68, high: 97, low: 63, color: '#ff4444' },
  { open: 68, close: 95, high: 99, low: 66, color: '#00ff88' },
];

const W = 900;
const H = 480;
const CAND_W = 120;
const GAP = 60;
const SCALE = (H - 40) / 100;

export const CandlestickChart: React.FC<{ durationFrames: number }> = ({
  durationFrames,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 340,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {CANDLES.map((c, i) => {
          const progress = interpolate(frame, [i * 16, i * 16 + 40], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const x = i * (CAND_W + GAP) + GAP;
          const bodyTop = (100 - Math.max(c.open, c.close)) * SCALE;
          const bodyH = Math.abs(c.close - c.open) * SCALE * progress;
          const wickTop = (100 - c.high) * SCALE;
          const wickH = (c.high - c.low) * SCALE * progress;

          return (
            <g key={i}>
              <rect
                x={x + CAND_W / 2 - 3}
                y={wickTop}
                width={6}
                height={wickH}
                fill={c.color}
                opacity={0.6}
              />
              <rect
                x={x}
                y={bodyTop}
                width={CAND_W}
                height={Math.max(0, bodyH)}
                fill={c.color}
                rx={5}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
