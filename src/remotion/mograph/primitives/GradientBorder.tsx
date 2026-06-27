import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { SPRING_SNAPPY } from './SpringConfigs';

interface Props {
  primary?: string;
  body?: string;
  accentColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
}

export const GradientBorder: React.FC<Props> = ({
  primary = 'KEY FACT',
  body = 'This changes everything you thought you knew.',
  accentColor = '#cc0000',
  backgroundColor = '#080808',
  borderWidth = 3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const angle = (t * 60) % 360;
  const progress = spring({ frame, fps, config: SPRING_SNAPPY });
  const scale = interpolate(progress, [0, 1], [0.9, 1]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 60, backgroundColor }}>
      <div
        style={{
          background: `linear-gradient(${angle}deg, ${accentColor}, #ffffff44, ${accentColor})`,
          borderRadius: 32,
          padding: borderWidth,
          width: '100%',
          maxWidth: 920,
          transform: `scale(${scale})`,
        }}
      >
        <div style={{ background: backgroundColor, borderRadius: 30, padding: '48px 44px' }}>
          <div style={{ fontSize: 72, fontFamily: 'Anton, sans-serif', fontWeight: 900, color: accentColor, marginBottom: 20, textTransform: 'uppercase', lineHeight: 1.1 }}>
            {primary}
          </div>
          <div style={{ fontSize: 30, fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
            {body}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
