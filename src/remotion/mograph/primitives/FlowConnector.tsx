import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Node {
  label?: string;
  color?: string;
  xPct?: number;
  yPct?: number;
}

interface Props {
  nodes?: Node[];
  lineColor?: string;
  accentColor?: string;
  backgroundColor?: string;
}

const DEFAULT_NODES: Node[] = [
  { label: 'Stimulus', color: '#d400ff', xPct: 50, yPct: 20 },
  { label: 'Dopamine', color: '#00f0ff', xPct: 50, yPct: 45 },
  { label: 'Action', color: '#00ff88', xPct: 50, yPct: 70 },
];

export const FlowConnector: React.FC<Props> = ({
  nodes = DEFAULT_NODES,
  lineColor = 'rgba(255,255,255,0.4)',
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 1080, H = 1920;

  const points = nodes.map(n => ({
    x: ((n.xPct ?? 50) / 100) * W,
    y: ((n.yPct ?? 50) / 100) * H,
    label: n.label ?? '',
    color: n.color ?? accentColor,
  }));

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const len = Math.hypot(next.x - p.x, next.y - p.y);
          const progress = spring({ frame: frame - i * 12, fps, config: SPRING_GENTLE });
          const drawn = interpolate(progress, [0, 1], [len, 0]);

          return (
            <line
              key={i}
              x1={p.x} y1={p.y}
              x2={next.x} y2={next.y}
              stroke={lineColor}
              strokeWidth="3"
              strokeDasharray={len}
              strokeDashoffset={drawn}
              strokeLinecap="round"
            />
          );
        })}

        {points.map((p, i) => {
          const progress = spring({ frame: frame - i * 12 - 6, fps, config: SPRING_GENTLE });
          const scale = interpolate(progress, [0, 1], [0, 1]);

          return (
            <g key={i} transform={`translate(${p.x}, ${p.y}) scale(${scale})`}>
              <circle r="24" fill={p.color} opacity={0.9} />
              <circle r="24" fill="none" stroke={p.color} strokeWidth="2" opacity={0.4} />
              <text y="72" textAnchor="middle" fill="#ffffff" fontSize="28" fontFamily="Space Grotesk, sans-serif">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
