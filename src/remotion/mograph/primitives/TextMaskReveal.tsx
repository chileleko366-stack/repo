import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_SNAPPY } from './SpringConfigs';

interface Props {
  text?: string;
  color?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontSize?: number;
}

export const TextMaskReveal: React.FC<Props> = ({
  text = 'REVEALED',
  color = '#ffffff',
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
  fontSize = 80,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_SNAPPY });
  const revealed = interpolate(progress, [0, 1], [0, 100]);

  return (
    <AbsoluteFill
      style={{ alignItems: 'center', justifyContent: 'center', backgroundColor }}
    >
      <div style={{ overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            fontSize,
            fontWeight: 900,
            fontFamily: 'Anton, sans-serif',
            color,
            textTransform: 'uppercase',
            clipPath: `inset(0 ${100 - revealed}% 0 0)`,
            letterSpacing: '0.04em',
          }}
        >
          {text}
        </div>
        <div
          style={{
            position: 'absolute',
            right: `${100 - revealed}%`,
            top: 0,
            bottom: 0,
            width: 3,
            background: accentColor,
            boxShadow: `0 0 16px ${accentColor}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
