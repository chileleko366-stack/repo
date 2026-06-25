/**
 * UIMockup — white SaaS app UI card with separator bar and CTA button.
 *
 * Lesson source: AE scene 2 — white rounded rect, gray separator bar with
 * inner glow, gradient Ask AI button with inner glow, text hierarchy,
 * bounce animation on entrance.
 *
 * Usage: product demo beats on any channel — ch1 (app screenshot),
 * ch2 (fintech dashboard), ch4 (research tool), ch6 (mission control UI).
 * LLM key: "UIMockup"
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const UIMockup: React.FC<{
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  bodyText?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  accentFont?: string;
}> = ({
  title = 'Your Workspace',
  subtitle = 'All your ideas in one place',
  buttonLabel = 'Get Started',
  bodyText,
  accentColor = '#a855f7',
  backgroundColor = '#f8f8fc',
  fontFamily = "'Space Grotesk', sans-serif",
  accentFont = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance spring with slight bounce
  const entry = spring({ frame, fps, config: { damping: 20, stiffness: 240 }, durationInFrames: 45 });
  const scale = interpolate(entry, [0, 1], [0.82, 1]);
  const opacity = interpolate(entry, [0, 0.3, 1], [0, 1, 1]);
  const ty = interpolate(entry, [0, 1], [40, 0]);

  // Bar entrance: delayed by 12 frames
  const barEntry = spring({ frame: frame - 12, fps, config: { damping: 22, stiffness: 280 }, durationInFrames: 35 });
  const barWidth = interpolate(barEntry, [0, 1], ['0%', '100%']);

  // Button entrance: delayed by 24 frames
  const btnEntry = spring({ frame: frame - 24, fps, config: { damping: 18, stiffness: 300 }, durationInFrames: 30 });
  const btnScale = interpolate(btnEntry, [0, 1], [0, 1]);

  // Cursor blink on button text
  const cursorVisible = Math.floor(frame / 30) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Ambient glow behind card */}
      <div style={{
        position: 'absolute',
        width: 900, height: 600,
        background: `radial-gradient(ellipse at center, ${accentColor}22 0%, transparent 70%)`,
        filter: 'blur(60px)',
        opacity: entry,
      }} />

      {/* Main card */}
      <div style={{
        background: '#ffffff',
        borderRadius: 28,
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.10)',
        width: '88%',
        maxWidth: 920,
        padding: '48px 52px 52px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        transform: `scale(${scale}) translateY(${ty}px)`,
        opacity,
      }}>

        {/* Title */}
        <div style={{
          fontFamily: accentFont,
          fontSize: 72,
          fontWeight: 700,
          color: '#111',
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily,
          fontSize: 36,
          color: 'rgba(0,0,0,0.55)',
          marginBottom: 36,
          lineHeight: 1.4,
        }}>
          {subtitle}
        </div>

        {/* Separator bar with draw-on animation — AE "gray bar with inner glow" */}
        <div style={{
          height: 2,
          background: 'rgba(0,0,0,0.08)',
          borderRadius: 2,
          marginBottom: 36,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: barWidth,
            background: `linear-gradient(to right, ${accentColor}88, ${accentColor})`,
            borderRadius: 2,
            boxShadow: `0 0 8px ${accentColor}66`,
          }} />
        </div>

        {/* Body text (optional) */}
        {bodyText && (
          <div style={{
            fontFamily,
            fontSize: 32,
            color: 'rgba(0,0,0,0.6)',
            lineHeight: 1.5,
            marginBottom: 40,
          }}>
            {bodyText}
          </div>
        )}

        {/* CTA button — AE "gradient Ask AI button with inner glow" */}
        <div style={{
          alignSelf: 'flex-start',
          transform: `scale(${btnScale})`,
          transformOrigin: 'left center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '18px 40px',
            borderRadius: 100,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
            boxShadow: `0 0 0 1px ${accentColor}44, 0 4px 20px ${accentColor}44, inset 0 1px 0 rgba(255,255,255,0.3)`,
            fontFamily,
            fontSize: 32,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '0.01em',
            cursor: 'default',
          }}>
            {buttonLabel}
            {/* Blinking cursor — AE "blinking cursor" effect */}
            <span style={{
              display: 'inline-block',
              width: 4,
              height: 32,
              background: 'rgba(255,255,255,0.8)',
              borderRadius: 2,
              opacity: cursorVisible ? 1 : 0,
            }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
