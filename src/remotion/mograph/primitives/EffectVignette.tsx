/**
 * EffectVignette — radial blur vignette overlay.
 *
 * Lesson source: AE Gaussian blur applied through an inverted ellipse mask,
 * creating a lens-style soft edge that draws focus to the centre.
 * Used as a compositing overlay on top of any primitive.
 *
 * Usage: add cinematic depth to any beat — especially atmospheric or
 * dramatic beats where edge softening improves focus.
 * LLM key: "EffectVignette"
 */
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const EffectVignette: React.FC<{
  strength?: number;   // 0-1, controls opacity of the dark edge
  color?: string;      // vignette colour, usually near-black
  children?: React.ReactNode;
}> = ({
  strength = 0.6,
  color = '#000000',
  children,
}) => {
  const frame = useCurrentFrame();
  // Gentle entrance: vignette fades in over first 20 frames
  const opacity = interpolate(frame, [0, 20], [0, strength], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      {children}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(
            ellipse 70% 55% at 50% 50%,
            transparent 0%,
            transparent 45%,
            ${color}55 70%,
            ${color}cc 100%
          )`,
          opacity,
        }}
      />
    </AbsoluteFill>
  );
};
