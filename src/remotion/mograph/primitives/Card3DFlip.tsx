/**
 * Card3DFlip — card enters with a 3D Y+X rotation spring, then settles flat.
 *
 * Lesson source: AE invoice PDF scene — the document flips in using
 * combined Y-axis spin and X-axis tumble before landing face-up.
 * CSS perspective + rotateY/rotateX spring animation.
 *
 * Usage: document/report reveals, stat card entrances, invoice/receipt beats.
 * LLM key: "Card3DFlip"
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Card3DFlip: React.FC<{
  title?: string;
  value?: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
  cardColor?: string;
  fontFamily?: string;
  accentFont?: string;
}> = ({
  title = 'REPORT',
  value,
  subtitle,
  accentColor = '#a855f7',
  backgroundColor = '#0a0a12',
  cardColor = '#ffffff',
  fontFamily = "'Space Grotesk', sans-serif",
  accentFont = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Y-axis flip: 90° → 0° (card spins in on Y)
  const flipY = spring({ frame, fps, config: { damping: 18, stiffness: 180 }, durationInFrames: 50 });
  const rotateY = interpolate(flipY, [0, 1], [90, 0]);

  // X-axis tumble: -20° → 0° (slight backward lean resolves)
  const flipX = spring({ frame: frame - 5, fps, config: { damping: 22, stiffness: 200 }, durationInFrames: 45 });
  const rotateX = interpolate(flipX, [0, 1], [-20, 0]);

  // Overall entrance opacity
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  // Shadow deepens during flip, lifts when flat
  const shadowBlur = interpolate(flipY, [0, 1], [60, 20]);
  const shadowOpacity = interpolate(flipY, [0, 1], [0.5, 0.15]);

  const isLight = cardColor === '#ffffff' || cardColor.startsWith('#f');

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200,
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 500,
        background: `radial-gradient(ellipse at center, ${accentColor}22 0%, transparent 70%)`,
        filter: 'blur(80px)',
        opacity,
      }} />

      {/* Card */}
      <div
        style={{
          width: '82%',
          maxWidth: 860,
          background: cardColor,
          borderRadius: 24,
          padding: '52px 56px',
          boxShadow: `0 ${shadowBlur}px ${shadowBlur * 2}px rgba(0,0,0,${shadowOpacity}), 0 0 0 1px ${accentColor}22`,
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          opacity,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Top accent stripe */}
        <div style={{
          height: 4,
          borderRadius: 2,
          background: `linear-gradient(to right, ${accentColor}, ${accentColor}66)`,
          marginBottom: 8,
        }} />

        {/* Title */}
        <div style={{
          fontFamily: accentFont,
          fontSize: 40,
          fontWeight: 700,
          color: isLight ? '#111' : '#fff',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {title}
        </div>

        {/* Value */}
        {value && (
          <div style={{
            fontFamily: accentFont,
            fontSize: 96,
            fontWeight: 700,
            color: accentColor,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            {value}
          </div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <div style={{
            fontFamily,
            fontSize: 34,
            color: isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)',
            lineHeight: 1.4,
          }}>
            {subtitle}
          </div>
        )}

        {/* Bottom divider */}
        <div style={{
          marginTop: 16,
          height: 1,
          background: `${accentColor}33`,
        }} />

        {/* Footer row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily,
          fontSize: 26,
          color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
        }}>
          <span>VERIFIED</span>
          <span style={{ color: accentColor }}>✓</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
