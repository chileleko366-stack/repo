import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  intensity?: number;
  color?: string;
  radiusX?: number;
  radiusY?: number;
  animated?: boolean;
}

export const EffectVignette: React.FC<Props> = ({
  intensity = 0.6,
  color = '#000000',
  radiusX = 70,
  radiusY = 60,
  animated = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = animated ? intensity * (0.9 + 0.1 * Math.sin(frame / fps * 0.8)) : intensity;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" rx={`${radiusX}%`} ry={`${radiusY}%`}>
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="100%" stopColor={color} stopOpacity={pulse} />
          </radialGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#vignette)" />
      </svg>
    </AbsoluteFill>
  );
};
