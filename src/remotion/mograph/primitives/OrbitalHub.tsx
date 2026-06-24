import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface OrbitalHubProps {
  keywords?: string[];
  accentColor?: string;
  backgroundColor?: string;
}

export const OrbitalHub: React.FC<OrbitalHubProps> = ({
  keywords = ['Speed', 'Scale', 'Trust', 'Value'],
  accentColor = '#4f46e5',
  backgroundColor = '#0a0a0f',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 30;

  const cx = 540;
  const cy = 960;
  const rx = 280;
  const ry = 120;

  const dots = keywords.slice(0, 4).map((kw, i) => {
    const angle = (rotation + i * 90) * (Math.PI / 180);
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const depth = Math.sin(angle);
    const scale = 0.7 + 0.3 * ((depth + 1) / 2);
    const opacity = 0.5 + 0.5 * ((depth + 1) / 2);
    return { x, y, kw, scale, opacity, depth };
  });

  const sorted = [...dots].sort((a, b) => a.depth - b.depth);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor, position: 'relative', overflow: 'hidden' }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <ellipse
          cx={cx} cy={cy} rx={rx} ry={ry}
          fill="none" stroke={accentColor} strokeWidth={2}
          strokeOpacity={0.3} strokeDasharray="8 6"
        />
        <circle cx={cx} cy={cy} r={24} fill={accentColor} opacity={0.9} />
        <circle cx={cx} cy={cy} r={40} fill={accentColor} opacity={0.15} />
        {sorted.map(({ x, y, kw, scale, opacity }) => (
          <g key={kw}>
            <circle cx={x} cy={y} r={16 * scale} fill={accentColor} opacity={opacity} />
            <text
              x={x} y={y - 28 * scale}
              textAnchor="middle" fill="#ffffff"
              fontSize={28 * scale} fontWeight={600} opacity={opacity}
            >
              {kw}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};
