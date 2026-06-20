// SaaS glassmorphism card primitive.
// Design tokens sourced from SaaSTokens.ts (glass, springs, pill).
// Constants-first: all editable values declared at top.
// Crossfade pattern for state transitions — never layout jumps.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SAAS_BASE } from './SaaSTokens';
import { SPRING_CONFIGS } from './SpringConfigs';

const CARD_MAX_WIDTH = 960;
const CARD_PADDING = 48;
const STAT_FONT_SIZE = 110;
const LABEL_FONT_SIZE = 40;
const BODY_FONT_SIZE = 44;
const ENTRANCE_DURATION = 22;

export interface GlassCardProps {
  /** Main large text or number */
  primary: string;
  /** Smaller supporting label below primary */
  label?: string;
  /** Body copy (sentence) */
  body?: string;
  /** Colour for primary text */
  accentColor?: string;
  /** Background colour (card sits on this) */
  backgroundColor?: string;
  fontFamily?: string;
  accentFont?: string;
  /** Glow colour radiating behind the card */
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  primary,
  label,
  body,
  accentColor = '#d400ff',
  backgroundColor = '#16121f',
  fontFamily = "'Space Grotesk', sans-serif",
  accentFont = "'Anton', sans-serif",
  glowColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entryProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.card,
    durationInFrames: ENTRANCE_DURATION,
  });

  const scale = interpolate(entryProgress, [0, 1], [0.84, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(entryProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glow = glowColor ?? accentColor;

  return (
    <AbsoluteFill style={{ backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow behind the card — radial gradient, element-level, never the page bg */}
      <div
        style={{
          position: 'absolute',
          width: CARD_MAX_WIDTH + 120,
          height: 600,
          background: `radial-gradient(ellipse at center, ${glow}40 0%, transparent 70%)`,
          filter: 'blur(40px)',
          transform: 'scale(1.2)',
        }}
      />

      {/* Glass card */}
      <div
        style={{
          ...SAAS_BASE.glass,
          maxWidth: CARD_MAX_WIDTH,
          width: '88%',
          padding: CARD_PADDING,
          transform: `scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: accentFont,
            fontSize: STAT_FONT_SIZE,
            fontWeight: 700,
            color: accentColor,
            lineHeight: 1,
            textShadow: `0 0 30px ${glow}80`,
            letterSpacing: '-0.02em',
          }}
        >
          {primary}
        </div>

        {label && (
          <div
            style={{
              fontFamily,
              fontSize: LABEL_FONT_SIZE,
              fontWeight: 600,
              color: '#ffffff',
              opacity: 0.85,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {label}
          </div>
        )}

        {body && (
          <div
            style={{
              fontFamily,
              fontSize: BODY_FONT_SIZE,
              color: 'rgba(255,255,255,0.70)',
              lineHeight: 1.4,
              maxWidth: 800,
            }}
          >
            {body}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
