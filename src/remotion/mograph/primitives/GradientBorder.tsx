import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

interface GradientBorderProps {
  primary?: string;
  body?: string;
  accentColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
}

export const GradientBorder: React.FC<GradientBorderProps> = ({
  primary = 'Feature',
  body,
  accentColor = '#7c3aed',
  backgroundColor = '#0f0f1a',
  borderWidth = 3,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 22, stiffness: 110, mass: 1 } });
  const angle = (frame / durationInFrames) * 360;

  const scale = interpolate(entrance, [0, 1], [0.88, 1]);
  const opacity = interpolate(entrance, [0, 0.25], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Gradient border via padding trick */}
      <div
        style={{
          background: `linear-gradient(${angle}deg, ${accentColor}, #ffffff55, ${accentColor})`,
          padding: borderWidth,
          borderRadius: 28,
          width: '78%',
        }}
      >
        <div
          style={{
            background: backgroundColor,
            borderRadius: 28 - borderWidth,
            padding: '56px 44px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.1,
            }}
          >
            {primary}
          </div>
          {body && (
            <div
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 36,
                fontWeight: 400,
                letterSpacing: '0.01em',
                lineHeight: 1.4,
              }}
            >
              {body}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
