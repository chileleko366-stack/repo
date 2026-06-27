import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  dotColor?: string;
  dotSize?: number;
  spacing?: number;
  backgroundColor?: string;
}

export const BackgroundDotGrid: React.FC<Props> = ({
  dotColor = '#ffffff',
  dotSize = 2,
  spacing = 40,
  backgroundColor = '#0d1117',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(
    Math.sin(frame / fps * 0.8),
    [-1, 1],
    [0.08, 0.18],
  );

  const patternId = 'dotgrid';

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id={patternId} x={0} y={0} width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <circle cx={spacing / 2} cy={spacing / 2} r={dotSize} fill={dotColor} opacity={opacity} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </AbsoluteFill>
  );
};
