import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface GShape { x: number; y: number; size: number; type: 0 | 1 | 2; rotSpeed: number; floatOffset: number; opacity: number; colorIdx: number; }

const SHAPES: GShape[] = Array.from({ length: 15 }, (_, i) => ({
  x: (i * 137.5 + 10) % 90 + 5,
  y: (i * 97.3 + 5) % 85 + 5,
  size: 30 + (i * 23) % 60,
  type: (i % 3) as 0 | 1 | 2,
  rotSpeed: ((i * 7) % 5 - 2.5) * 0.5,
  floatOffset: (i * 17) % 100,
  opacity: 0.05 + (i % 5) * 0.025,
  colorIdx: i % 3,
}));

export const BackgroundGeometric: React.FC<{
  accentColors?: string[];
  backgroundColor?: string;
}> = ({
  accentColors = ['#d400ff', '#00ccff', '#00ff88'],
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
        opacity: Math.min(frame / 40, 1),
        pointerEvents: 'none',
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {SHAPES.map((shape, i) => {
          const floatY = Math.sin(frame * 0.02 + shape.floatOffset * 0.063) * 20;
          const rotate = frame * shape.rotSpeed;
          const cx = (shape.x / 100) * 1080;
          const cy = (shape.y / 100) * 1920 + floatY;
          const color = accentColors[shape.colorIdx % accentColors.length];

          if (shape.type === 0) {
            return <circle key={i} cx={cx} cy={cy} r={shape.size} fill="none" stroke={color} strokeWidth={2} opacity={shape.opacity} transform={`rotate(${rotate} ${cx} ${cy})`} />;
          } else if (shape.type === 1) {
            const h = shape.size;
            return <rect key={i} x={cx - h} y={cy - h} width={h * 2} height={h * 2} fill="none" stroke={color} strokeWidth={2} opacity={shape.opacity} transform={`rotate(${rotate} ${cx} ${cy})`} />;
          } else {
            const pts = [[cx, cy - shape.size], [cx - shape.size * 0.866, cy + shape.size * 0.5], [cx + shape.size * 0.866, cy + shape.size * 0.5]].map(p => p.join(',')).join(' ');
            return <polygon key={i} points={pts} fill="none" stroke={color} strokeWidth={2} opacity={shape.opacity} transform={`rotate(${rotate} ${cx} ${cy})`} />;
          }
        })}
      </svg>
    </AbsoluteFill>
  );
};
