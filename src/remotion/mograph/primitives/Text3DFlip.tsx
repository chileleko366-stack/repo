import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_BOUNCE } from './SpringConfigs';

interface Props {
  text?: string;
  accentColor?: string;
  color?: string;
  fontSize?: number;
}

export const Text3DFlip: React.FC<Props> = ({
  text = 'FLIP',
  accentColor = '#d400ff',
  color = '#ffffff',
  fontSize = 96,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_BOUNCE });
  const rotateX = interpolate(progress, [0, 1], [-90, 0]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
      <div
        style={{
          fontSize,
          fontFamily: 'Anton, sans-serif',
          fontWeight: 900,
          color,
          textTransform: 'uppercase',
          transform: `rotateX(${rotateX}deg)`,
          transformOrigin: 'center bottom',
          textShadow: `0 8px 32px ${accentColor}66`,
          letterSpacing: '0.04em',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
