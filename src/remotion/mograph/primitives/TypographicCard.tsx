// Fallback primitive — renders when an asset fetch fails (person/brand/place)
// or when no other primitive fits. Full-bleed bold typography directly on
// the background, matching TextKinetic.tsx / LayoutGiantNumber.tsx — no
// boxed/blurred card treatment.
// All values constants-first, constants declared at top.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

const KIND_HINT_FONT_SIZE = 48;
const ENTRANCE_DURATION = 36;

function getValueFontSize(text: string): number {
  if (text.length <= 6) return 140;
  if (text.length <= 12) return 110;
  if (text.length <= 20) return 80;
  return 60;
}

interface TypographicCardProps {
  /** The entity name that failed to resolve */
  value: string;
  /** Optional kind hint shown below the name */
  kindHint?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  accentFont?: string;
}

export const TypographicCard: React.FC<TypographicCardProps> = ({
  value,
  kindHint,
  accentColor = '#ffffff',
  backgroundColor = '#000000',
  fontFamily = "'Space Grotesk', sans-serif",
  accentFont = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.snappy,
    durationInFrames: ENTRANCE_DURATION,
  });

  const scale = interpolate(progress, [0, 1], [0.7, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(progress, [0, 1], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
      }}
    >
      <div
        style={{
          fontFamily: accentFont,
          fontSize: getValueFontSize(value),
          fontWeight: 700,
          color: accentColor,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          textAlign: 'center',
          textShadow: `0 0 60px ${accentColor}66`,
          opacity: progress,
          transform: `scale(${scale}) translateY(${translateY}px)`,
        }}
      >
        {value}
      </div>
      {kindHint && (
        <div
          style={{
            fontFamily,
            fontSize: KIND_HINT_FONT_SIZE,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.75)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: 24,
            opacity: interpolate(progress, [0, 0.6, 1], [0, 0, 1]),
          }}
        >
          {kindHint}
        </div>
      )}
    </AbsoluteFill>
  );
};
