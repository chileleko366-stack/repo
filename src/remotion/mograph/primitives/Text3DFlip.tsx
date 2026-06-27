import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Text3DFlip: React.FC<{
  text: string;
  color?: string;
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  text,
  color = '#ffffff',
  accentColor = '#d400ff',
  fontSize = 100,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 28, stiffness: 260 }, durationInFrames: 40 });
  const rotateX = interpolate(progress, [0, 1], [-90, 0]);
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize,
          fontWeight: 700,
          color,
          textAlign: 'center',
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          transform: `rotateX(${rotateX}deg)`,
          textShadow: `0 4px 24px ${accentColor}66`,
          padding: '0 60px',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
