/**
 * NeuronPulse — SVG neuron-network diagram for anatomy beats.
 *
 * Nodes pulse on a per-node phase offset derived from index.
 * Axon lines grow in from 0% to 100% length, staggered by index.
 * Everything is a pure function of useCurrentFrame().
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const NODES = [
  { cx: 540, cy: 960, r: 22 },   // soma (centre)
  { cx: 300, cy: 700, r: 14 },
  { cx: 760, cy: 680, r: 14 },
  { cx: 200, cy: 1050, r: 12 },
  { cx: 860, cy: 1020, r: 12 },
  { cx: 420, cy: 500,  r: 10 },
  { cx: 660, cy: 480,  r: 10 },
  { cx: 140, cy: 820,  r: 10 },
  { cx: 940, cy: 800,  r: 10 },
];

// Axons: pairs of node indices
const AXONS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 5], [2, 6], [1, 7], [2, 8],
  [3, 7], [4, 8], [5, 6],
];

export const NeuronPulse: React.FC<{ durationFrames: number }> = ({ durationFrames }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <svg
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* Axon lines — each grows in over 20 frames, staggered by index */}
        {AXONS.map(([ai, bi], i) => {
          const a = NODES[ai];
          const b = NODES[bi];
          const growIn = interpolate(frame, [i * 3, i * 3 + 22], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          // Lerp end-point from a toward b so line 'grows'
          const ex = a.cx + (b.cx - a.cx) * growIn;
          const ey = a.cy + (b.cy - a.cy) * growIn;
          return (
            <line
              key={i}
              x1={a.cx} y1={a.cy}
              x2={ex}   y2={ey}
              stroke="#4cc9f0"
              strokeWidth={2}
              strokeOpacity={0.55}
            />
          );
        })}

        {/* Nodes — pulse opacity on a per-node phase */}
        {NODES.map((n, i) => {
          const cycle = (frame + i * 7) % 30;
          const glow  = interpolate(cycle, [0, 10, 30], [0.5, 1.0, 0.5], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const enterScale = interpolate(frame, [i * 4, i * 4 + 18], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <circle
              key={i}
              cx={n.cx}
              cy={n.cy}
              r={n.r * enterScale}
              fill={i === 0 ? '#e94560' : '#4cc9f0'}
              fillOpacity={glow}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
