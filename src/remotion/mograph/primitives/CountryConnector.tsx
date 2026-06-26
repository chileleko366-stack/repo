import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Line { x1: number; y1: number; x2: number; y2: number; label?: string; }
interface Props { accentColor: string; lines?: Line[]; staggerFrames?: number; }

const DEFAULT_LINES: Line[] = [
  { x1: 200, y1: 480, x2: 540, y2: 360, label: 'NYC → LON' },
  { x1: 540, y1: 360, x2: 760, y2: 520, label: 'LON → DXB' },
  { x1: 760, y1: 520, x2: 880, y2: 700, label: 'DXB → BOM' },
  { x1: 200, y1: 480, x2: 380, y2: 900, label: 'NYC → SAO' },
  { x1: 880, y1: 700, x2: 920, y2: 1100, label: 'BOM → SYD' },
];

function lineLength(l: Line) {
  return Math.sqrt((l.x2 - l.x1) ** 2 + (l.y2 - l.y1) ** 2);
}

export const CountryConnector: React.FC<Props> = ({ accentColor, lines = DEFAULT_LINES, staggerFrames = 8 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {lines.map((line, i) => {
          const len = lineLength(line);
          const start = i * staggerFrames;
          const progress = interpolate(frame, [start, start + 40], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const dashOffset = len * (1 - progress);

          return (
            <g key={i}>
              <line
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke={accentColor}
                strokeWidth={3}
                strokeDasharray={`12 6`}
                strokeDashoffset={dashOffset}
                opacity={progress > 0 ? 0.85 : 0}
              />
              {line.label && progress > 0.8 && (
                <text
                  x={(line.x1 + line.x2) / 2}
                  y={(line.y1 + line.y2) / 2 - 12}
                  fill={accentColor}
                  fontSize={28}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                  opacity={interpolate(progress, [0.8, 1], [0, 1])}
                >
                  {line.label}
                </text>
              )}
              <circle cx={line.x1} cy={line.y1} r={8} fill={accentColor} opacity={progress > 0 ? 1 : 0} />
              <circle cx={line.x2} cy={line.y2} r={8} fill={accentColor} opacity={progress} />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
