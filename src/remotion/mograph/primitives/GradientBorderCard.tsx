import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; }

export const GradientBorderCard: React.FC<Props> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 28, stiffness: 300 } });
  const scale = interpolate(s, [0, 1], [0.88, 1.0]);
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const floatY = Math.sin(frame * 0.04) * 6;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Glow blur layer behind the border */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 780,
        borderRadius: 44,
        background: `linear-gradient(135deg, ${accentColor}66, ${accentColor}22)`,
        filter: 'blur(12px)',
        transform: `scale(${scale}) translateY(${floatY}px)`,
        opacity: opacity * 0.7,
      }} />
      {/* Stroke-only card */}
      <div style={{
        width: 680,
        height: 760,
        borderRadius: 40,
        background: 'transparent',
        border: `3px solid ${accentColor}`,
        boxShadow: `0 0 30px ${accentColor}55, inset 0 0 20px ${accentColor}11`,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        opacity,
      }} />
    </div>
  );
};
