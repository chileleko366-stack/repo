import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface Props {
  sweepColor?: string;
  sweepAngle?: number;
  sweepWidth?: number;
  startFrame?: number;
  duration?: number;
  children?: React.ReactNode;
}

export const LightSweep: React.FC<Props> = ({
  sweepColor = 'rgba(255,255,255,0.15)',
  sweepAngle = 20,
  sweepWidth = 120,
  startFrame = 0,
  duration = 40,
  children,
}) => {
  const frame = useCurrentFrame();
  const progress = Math.max(0, Math.min((frame - startFrame) / duration, 1));
  const sweepX = interpolate(progress, [0, 1], [-sweepWidth * 2, 1200]);

  return (
    <AbsoluteFill style={{ position: 'relative', overflow: 'hidden' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: sweepX,
            width: sweepWidth,
            background: `linear-gradient(90deg, transparent, ${sweepColor}, transparent)`,
            transform: `rotate(${sweepAngle}deg) scaleY(2)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
