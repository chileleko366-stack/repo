// Fallback primitive — renders when an asset fetch fails (person/brand/place).
// Produces a styled name card using the mograph engine instead of a stock image.
// All values constants-first, constants declared at top.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SAAS_BASE } from './SaaSTokens';
import { SPRING_CONFIGS } from './SpringConfigs';

const TITLE_FONT_SIZE = 96;
const SUBTITLE_FONT_SIZE = 48;
const ENTRANCE_DURATION = 18;

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
  backgroundColor = '#16121f',
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

  const translateY = interpolate(progress, [0, 1], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle glow — element-level, not page background */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 400,
          background: `radial-gradient(ellipse at center, ${accentColor}20 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          ...SAAS_BASE.glass,
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          opacity: progress,
          transform: `translateY(${translateY}px)`,
          textAlign: 'center',
          maxWidth: 900,
        }}
      >
        <div
          style={{
            fontFamily: accentFont,
            fontSize: TITLE_FONT_SIZE,
            fontWeight: 700,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
          }}
        >
          {value}
        </div>
        {kindHint && (
          <div
            style={{
              fontFamily,
              fontSize: SUBTITLE_FONT_SIZE,
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
            }}
          >
            {kindHint}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
