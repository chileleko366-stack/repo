import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  text?: string;
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export const TextNeon: React.FC<Props> = ({
  text = 'NEON',
  accentColor = '#d400ff',
  fontSize = 96,
  fontFamily = 'Anton, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = 0.85 + 0.15 * Math.sin(frame / fps * Math.PI * 2);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          fontSize,
          fontFamily,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: accentColor,
          textShadow: [
            `0 0 7px ${accentColor}`,
            `0 0 ${20 * pulse}px ${accentColor}`,
            `0 0 ${42 * pulse}px ${accentColor}`,
            `0 0 ${82 * pulse}px ${accentColor}88`,
          ].join(', '),
          letterSpacing: '0.06em',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
