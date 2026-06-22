import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const CinematicNoir: React.FC<{
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  accentColor = '#c8a96e',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const flicker = 0.92 + Math.sin(frame * 0.4) * 0.04 + (Math.sin(frame * 2.3) > 0.95 ? -0.15 : 0);
  const vignette = Math.min(frame / 30, 1) * 0.85;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backgroundColor === 'transparent' ? undefined : backgroundColor,
        opacity: flicker,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
        opacity: vignette,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
        opacity: vignette,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
        opacity: 0.6,
      }} />
    </AbsoluteFill>
  );
};
