import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  text?: string;
  color1?: string;
  color2?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const TextGradient: React.FC<Props> = ({
  text = 'AMAZING',
  color1 = '#d400ff',
  color2 = '#00f0ff',
  fontSize = 96,
  fontFamily = 'Anton, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const angle = interpolate(frame / fps, [0, 5], [0, 360], { extrapolateRight: 'wrap' }) % 360;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div
        style={{
          fontSize,
          fontFamily,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textAlign: 'center',
          background: `linear-gradient(${angle}deg, ${color1}, ${color2}, ${color1})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
