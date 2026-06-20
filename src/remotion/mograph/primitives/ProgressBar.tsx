// Ported from:
// /tmp/refs/saas-engine/src/examples/code/progress-bar.ts
// Adapted to use spring entrance + channel accent colour, constants-first.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

const BAR_HEIGHT = 24;
const BAR_RADIUS = 12;
const BAR_WIDTH = 700;
const FILL_END_FRAME_FRACTION = 0.8;
const FONT_SIZE = 40;

interface ProgressBarProps {
  label?: string;
  targetPct: number;
  accentColor?: string;
  trackColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  textColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  targetPct,
  accentColor = '#d400ff',
  trackColor = '#333333',
  backgroundColor = 'transparent',
  fontFamily = "'Space Grotesk', sans-serif",
  textColor = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const entryProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
    durationInFrames: 20,
  });
  const opacity = interpolate(entryProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progress = interpolate(
    frame,
    [0, durationInFrames * FILL_END_FRAME_FRACTION],
    [0, targetPct],
    { extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        opacity,
      }}
    >
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', width: BAR_WIDTH }}>
          <span style={{ color: textColor, fontSize: FONT_SIZE, fontFamily }}>
            {label}
          </span>
          <span style={{ color: accentColor, fontSize: FONT_SIZE, fontWeight: 700, fontFamily }}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div
        style={{
          width: BAR_WIDTH,
          height: BAR_HEIGHT,
          backgroundColor: trackColor,
          borderRadius: BAR_RADIUS,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
            borderRadius: BAR_RADIUS,
            boxShadow: `0 0 12px ${accentColor}60`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
