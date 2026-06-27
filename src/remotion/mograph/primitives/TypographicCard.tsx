import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Props {
  headline?: string;
  body?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export const TypographicCard: React.FC<Props> = ({
  headline = 'THE HUMAN BRAIN',
  body = 'Contains approximately 86 billion neurons, each connected to 10,000 others.',
  accentColor = '#0097a7',
  backgroundColor = '#0d1117',
  fontFamily = 'Space Grotesk, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE });
  const y = interpolate(progress, [0, 1], [30, 0]);
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ transform: `translateY(${y}px)`, opacity, maxWidth: 940 }}>
        <div
          style={{
            width: 60,
            height: 6,
            background: accentColor,
            borderRadius: 3,
            marginBottom: 32,
            boxShadow: `0 0 20px ${accentColor}88`,
          }}
        />
        <div style={{ fontSize: 64, fontFamily: 'Anton, sans-serif', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: 32, letterSpacing: '0.02em' }}>
          {headline}
        </div>
        <div style={{ fontSize: 32, fontFamily, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
          {body}
        </div>
        <div style={{ width: 60, height: 2, background: `${accentColor}55`, borderRadius: 1, marginTop: 40 }} />
      </div>
    </AbsoluteFill>
  );
};
