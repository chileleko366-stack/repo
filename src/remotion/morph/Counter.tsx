/**
 * Counter — frame-driven animated number counter.
 *
 * The value is a pure function of useCurrentFrame() via Remotion's interpolate +
 * Easing — no countUp.js RAF loop, no useEffect, no side effects.
 *
 * Features:
 *  - prefix / suffix strings ("$", "%", "km", etc.)
 *  - configurable decimal places
 *  - thousands-separator formatting via toLocaleString
 *  - optional delayFrames to start the count mid-beat
 *  - accent pulse on the number as it changes
 */

import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Counter: React.FC<{
  from?: number;
  to: number;
  durationFrames: number;
  delayFrames?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
}> = ({
  from = 0,
  to,
  durationFrames,
  delayFrames = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  fontSize = 120,
  color = 'white',
  fontFamily = 'inherit',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Raw interpolated value, ease-out cubic
  const raw = interpolate(
    frame,
    [delayFrames, delayFrames + durationFrames],
    [from, to],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    },
  );

  const formatted = raw.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Subtle scale pulse tied to the spring entrance
  const enterSpring = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 14, stiffness: 200, mass: 0.9 },
    durationInFrames: 20,
  });
  const scale = interpolate(enterSpring, [0, 1], [0.6, 1.0]);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 4,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        ...style,
      }}
    >
      {prefix && (
        <span style={{ fontSize: fontSize * 0.6, color, fontFamily, opacity: 0.85 }}>
          {prefix}
        </span>
      )}
      <span style={{ fontSize, color, fontFamily, lineHeight: 1 }}>
        {formatted}
      </span>
      {suffix && (
        <span style={{ fontSize: fontSize * 0.55, color, fontFamily, opacity: 0.85 }}>
          {suffix}
        </span>
      )}
    </div>
  );
};
