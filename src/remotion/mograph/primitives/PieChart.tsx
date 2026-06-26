import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface PieChartProps {
  accentColor?: string;
  backgroundColor?: string;
}

const SLICES = [
  { pct: 0.42, label: '42%' },
  { pct: 0.28, label: '28%' },
  { pct: 0.18, label: '18%' },
  { pct: 0.12, label: '12%' },
];

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export const PieChart: React.FC<PieChartProps> = ({
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 50], [0, 1], { extrapolateRight: 'clamp' });

  const OPACITIES = [1, 0.65, 0.4, 0.25];

  let cumAngle = 0;
  const paths = SLICES.map((s, i) => {
    const start = cumAngle;
    const end = cumAngle + s.pct * 360 * progress;
    cumAngle += s.pct * 360;
    return { path: describeArc(270, 270, 230, start, end), opacity: OPACITIES[i] };
  });

  return (
    <AbsoluteFill style={{ background: backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <svg width={540} height={540} viewBox="0 0 540 540">
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill={accentColor} opacity={p.opacity} stroke={backgroundColor} strokeWidth={3} />
        ))}
        <circle cx={270} cy={270} r={90} fill={backgroundColor} />
      </svg>
    </AbsoluteFill>
  );
};
