import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; }

export const GradientCard: React.FC<Props> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 28, stiffness: 300 } });
  const scale = interpolate(s, [0, 1], [0.88, 1.0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const floatY = Math.sin(frame * 0.04) * 6;

  const c1 = accentColor;
  const c2 = accentColor + 'bb';
  const c3 = backgroundColor === '#0a0e1a' ? '#1a0a2e' : accentColor + '44';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 680,
        height: 760,
        borderRadius: 40,
        background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})`,
        boxShadow: `0 0 40px ${accentColor}66, 0 0 0 2px ${accentColor}88`,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          boxShadow: `inset 0 0 40px rgba(255,255,255,0.1)`,
        }} />
      </div>
    </div>
  );
};
