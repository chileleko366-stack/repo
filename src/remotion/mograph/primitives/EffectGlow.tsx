import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  color?: string;
  radius?: number;
  opacity?: number;
  x?: number;
  y?: number;
}

export const EffectGlow: React.FC<Props> = ({
  color = '#d400ff',
  radius = 400,
  opacity = 0.6,
  x = 50,
  y = 50,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = opacity * (0.85 + 0.15 * Math.sin(frame / fps * Math.PI * 1.5));

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen' }}>
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: radius * 2,
          height: radius * 2,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${color} 0%, ${color}44 40%, transparent 70%)`,
          opacity: pulse,
          filter: `blur(${radius / 4}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
