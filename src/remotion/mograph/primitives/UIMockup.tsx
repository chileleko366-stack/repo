import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_SNAPPY } from './SpringConfigs';

interface Props {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  bodyText?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  accentFont?: string;
}

export const UIMockup: React.FC<Props> = ({
  title = 'AI Dashboard',
  subtitle = 'Real-time insights',
  buttonLabel = 'Get Started →',
  bodyText = 'Powered by machine learning',
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
  fontFamily = 'Space Grotesk, sans-serif',
  accentFont = 'JetBrains Mono, monospace',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_SNAPPY });
  const y = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);

  const sepWidth = interpolate(Math.min(frame, 40), [0, 40], [0, 100]);

  const sweepX = interpolate(Math.min(frame - 20, 60), [0, 60], [-200, 1100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', backgroundColor, padding: 60 }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 28,
          padding: '48px 40px',
          width: '100%',
          maxWidth: 920,
          transform: `translateY(${y}px)`,
          opacity,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Light sweep */}
        <div
          style={{
            position: 'absolute',
            top: 0, bottom: 0,
            width: 120,
            left: sweepX,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />

        <div style={{ fontSize: 44, fontFamily: accentFont, fontWeight: 900, color: '#ffffff', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 24, fontFamily, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>{subtitle}</div>

        {/* Separator */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)`, width: `${sepWidth}%`, marginBottom: 28, transition: 'none' }} />

        <div style={{ fontSize: 22, fontFamily, color: 'rgba(255,255,255,0.7)', marginBottom: 36, lineHeight: 1.5 }}>{bodyText}</div>

        {/* CTA Button */}
        <div
          style={{
            display: 'inline-block',
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
            borderRadius: 14,
            padding: '16px 36px',
            fontSize: 26,
            fontFamily,
            fontWeight: 700,
            color: '#000000',
            boxShadow: `0 0 30px ${accentColor}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {buttonLabel}
        </div>
      </div>
    </AbsoluteFill>
  );
};
