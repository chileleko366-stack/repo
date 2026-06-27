import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export interface LineChartPoint { x: number; y: number; }

export const DataLineChart: React.FC<{
  data: LineChartPoint[];
  accentColor?: string;
  label?: string;
  backgroundColor?: string;
}> = ({
  data,
  accentColor = '#00ff88',
  label = '',
  backgroundColor = '#0a0a0a',
}) => {
  const frame = useCurrentFrame();
  const DRAW_FRAMES = 60;
  const progress = Math.min(frame / DRAW_FRAMES, 1);

  const W = 900, H = 500, PAD = 60;
  const xs = data.map(d => d.x);
  const ys = data.map(d => d.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rX = maxX - minX || 1;
  const rY = maxY - minY || 1;
  const svgX = (x: number) => PAD + ((x - minX) / rX) * (W - PAD * 2);
  const svgY = (y: number) => H - PAD - ((y - minY) / rY) * (H - PAD * 2);

  const visible = data.slice(0, Math.ceil(progress * (data.length - 1)) + 1);
  const pathD = visible.map((p, i) => `${i === 0 ? 'M' : 'L'} ${svgX(p.x)} ${svgY(p.y)}`).join(' ');

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Math.min(frame / 20, 1),
      }}
    >
      {label && (
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 48, fontWeight: 700, color: accentColor, marginBottom: 24 }}>
          {label}
        </div>
      )}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0, 25, 50, 75, 100].map(pct => (
          <line key={pct} x1={PAD} y1={PAD + (pct / 100) * (H - PAD * 2)} x2={W - PAD} y2={PAD + (pct / 100) * (H - PAD * 2)}
            stroke={`${accentColor}22`} strokeWidth={1} />
        ))}
        {visible.length > 1 && (
          <path
            d={`${pathD} L ${svgX(visible[visible.length - 1].x)} ${H - PAD} L ${PAD} ${H - PAD} Z`}
            fill={`${accentColor}22`}
          />
        )}
        {visible.length > 1 && (
          <path d={pathD} stroke={accentColor} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {visible.map((p, i) => (
          <circle key={i} cx={svgX(p.x)} cy={svgY(p.y)} r={6} fill={accentColor} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
