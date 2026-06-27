import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  values?: number[];
  accentColor?: string;
  label?: string;
}

export const DataLineChart: React.FC<Props> = ({
  values = [10, 25, 18, 42, 38, 67, 55, 80, 72, 95],
  accentColor = '#00ff88',
  label = 'Growth',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const W = 880, H = 500;
  const pad = 60;
  const iW = W - pad * 2;
  const iH = H - pad * 2;

  const minV = Math.min(...values);
  const maxV = Math.max(...values);

  const toX = (i: number) => pad + (i / (values.length - 1)) * iW;
  const toY = (v: number) => pad + iH - ((v - minV) / (maxV - minV)) * iH;

  const totalLen = values.reduce((acc, v, i) => {
    if (i === 0) return 0;
    return acc + Math.hypot(toX(i) - toX(i - 1), toY(v) - toY(values[i - 1]));
  }, 0);

  const progress = Math.min(frame / 40, 1);
  const drawn = totalLen * progress;

  const polyline = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPath = `M ${toX(0)},${toY(values[0])} ` +
    values.slice(1).map((v, i) => `L ${toX(i + 1)},${toY(v)}`).join(' ') +
    ` L ${toX(values.length - 1)},${pad + iH} L ${pad},${pad + iH} Z`;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <svg width={W} height={H + 60} viewBox={`0 0 ${W} ${H + 60}`}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lineGrad)" opacity={progress} />
        <polyline
          points={polyline}
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          strokeDashoffset={totalLen - drawn}
        />
        <text x={W / 2} y={H + 48} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="24" fontFamily="Space Grotesk, sans-serif">
          {label}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
