/**
 * FlowConnector — animated SVG lines connecting 2-4 nodes.
 *
 * Lesson source: AE storyboard scene — pen tool lines with rounded corners
 * and circle endpoints connecting document tabs. Trim paths animate the
 * draw-on effect. Used horizontally (cards side by side) or vertically.
 *
 * Usage: workflow beats, neural pathway beats (ch4), timeline beats (ch5),
 * orbit/system beats (ch6), psychology cause-effect (ch1).
 * LLM key: "FlowConnector"
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface FlowNode {
  label: string;
  color?: string;
  xPct: number;   // 0-100 % of 1080px
  yPct: number;   // 0-100 % of 1920px
}

export const FlowConnector: React.FC<{
  nodes: FlowNode[];
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  accentColor?: string;
  fontFamily?: string;
}> = ({
  nodes,
  lineColor = 'rgba(255,255,255,0.35)',
  lineWidth = 3,
  backgroundColor = 'transparent',
  accentColor = '#00ff88',
  fontFamily = "'Space Grotesk', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const W = 1080, H = 1920;

  // Convert % to absolute coords
  const pts = nodes.map(n => ({ x: (n.xPct / 100) * W, y: (n.yPct / 100) * H, ...n }));

  // Total SVG path length estimate for dashoffset animation
  const totalLen = pts.reduce((acc, pt, i) => {
    if (i === 0) return acc;
    const prev = pts[i - 1];
    return acc + Math.hypot(pt.x - prev.x, pt.y - prev.y);
  }, 0);

  // Draw-on: strokeDashoffset animates from totalLen → 0
  const drawProgress = interpolate(frame, [0, 45], [0, 1], {
    extrapolateRight: 'clamp',
    easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  });
  const dashOffset = totalLen * (1 - drawProgress);

  // Node entrance spring: staggered per node
  const nodeEntrance = (i: number) => spring({
    frame: frame - i * 8,
    fps,
    config: { damping: 22, stiffness: 300 },
    durationInFrames: 30,
  });

  // Build SVG path through all nodes
  const pathD = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>

        {/* Connector line with draw-on animation */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          strokeDashoffset={dashOffset}
        />

        {/* Nodes */}
        {pts.map((pt, i) => {
          const ent = nodeEntrance(i);
          const scale = interpolate(ent, [0, 1], [0, 1]);
          const color = pt.color ?? accentColor;

          return (
            <g key={i} transform={`translate(${pt.x} ${pt.y})`}>
              {/* Outer glow ring */}
              <circle r={28 * scale} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.25} />
              {/* Main node circle */}
              <circle r={18 * scale} fill={color} fillOpacity={0.9} />
              {/* White dot centre */}
              <circle r={6 * scale} fill="white" fillOpacity={0.9} />
              {/* Label */}
              <text
                y={38 * scale}
                textAnchor="middle"
                fill="white"
                fontSize={28}
                fontFamily={fontFamily}
                fontWeight={600}
                opacity={ent}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
