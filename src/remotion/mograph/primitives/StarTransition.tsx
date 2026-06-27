import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  arrivalFrame?: number;
  exitFrame?: number;
  color?: string;
  size?: number;
  accentColor?: string;
}

function starPath(cx: number, cy: number, outerR: number, innerR: number, points = 4): string {
  const step = Math.PI / points;
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
  }
  return d + 'Z';
}

export const StarTransition: React.FC<Props> = ({
  arrivalFrame = 60,
  exitFrame = 120,
  color = '#ffffff',
  size = 1200,
  accentColor = '#d400ff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = interpolate(frame, [0, arrivalFrame], [0.05, 1], { extrapolateRight: 'clamp' });
  const rotation = interpolate(frame, [0, arrivalFrame], [0, 500], { extrapolateRight: 'clamp' });
  const opacity = frame > exitFrame
    ? interpolate(frame, [exitFrame, exitFrame + 20], [1, 0], { extrapolateRight: 'clamp' })
    : 1;

  const cx = 540;
  const cy = 960;
  const outerR = (size / 2) * scale;
  const innerR = outerR * 0.35;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <g transform={`rotate(${rotation}, ${cx}, ${cy})`}>
          <path d={starPath(cx, cy, outerR, innerR)} fill={color} opacity={0.9} />
          <path d={starPath(cx, cy, outerR * 0.7, innerR * 0.7)} fill={accentColor} opacity={0.5} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
