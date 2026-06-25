/**
 * LightSweep — diagonal light scan across an element.
 *
 * Lesson source: AE CC Light Sweep effect on the Craft logo after hand drop.
 * A bright diagonal streak moves left-to-right once, creating a premium
 * product reveal feeling.
 *
 * Usage: wrap any element — the sweep composites over the top.
 * Also usable as a standalone overlay on GlassCard or SaaSCard.
 * LLM key: "LightSweep"
 */
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const LightSweep: React.FC<{
  children?: React.ReactNode;
  sweepColor?: string;
  sweepAngle?: number;   // degrees
  sweepWidth?: number;   // px
  startFrame?: number;
  duration?: number;     // frames for sweep to cross
  width?: number | string;
  height?: number | string;
}> = ({
  children,
  sweepColor = 'rgba(255,255,255,0.55)',
  sweepAngle = 30,
  sweepWidth = 180,
  startFrame = 0,
  duration = 30,
  width = 1080,
  height = 1920,
}) => {
  const frame = useCurrentFrame();

  // Sweep travels from -sweepWidth (off left) to width+sweepWidth (off right)
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [-1, 2],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
      easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }
  );

  const w = typeof width === 'number' ? width : 1080;
  const h = typeof height === 'number' ? height : 1920;

  // translateX for the sweep gradient div
  const sweepX = progress * (w + sweepWidth * 2) - sweepWidth;

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      {children}
      {/* The sweep overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: sweepX,
            width: sweepWidth,
            height: h,
            background: `linear-gradient(
              to right,
              transparent 0%,
              ${sweepColor} 50%,
              transparent 100%
            )`,
            transform: `rotate(${sweepAngle}deg)`,
            transformOrigin: 'top center',
          }}
        />
      </div>
    </div>
  );
};
