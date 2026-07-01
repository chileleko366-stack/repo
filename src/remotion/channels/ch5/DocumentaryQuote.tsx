/**
 * DocumentaryQuote — cinematic text card for The Quiet Record.
 *
 * Layout:
 *   ─ Left gold border that scales in (height 0→100%)
 *   ─ Quote text in Space Grotesk, spring slide-in from left
 *   ─ Attribution line in Anton small caps below
 *
 * All animation is a pure function of useCurrentFrame().
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const DocumentaryQuote: React.FC<{
  text: string;
  attribution?: string;
  emphasisWord?: string;
  accentColor?: string;
}> = ({
  text,
  attribution,
  emphasisWord = '',
  accentColor = '#c8a96e',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow cinematic entrance (high mass, low stiffness)
  const slideProgress = spring({
    frame,
    fps,
    config: { damping: 24, stiffness: 100, mass: 1.6 },
    durationInFrames: 35,
  });

  const translateX = interpolate(slideProgress, [0, 1], [-80, 0]);
  const opacity    = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });

  // Gold left border grows upward
  const borderH = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 28,
        padding: '0 80px',
        maxWidth: 940,
        alignSelf: 'center',
      }}
    >
      {/* Gold vertical rule */}
      <div
        style={{
          width: 5,
          height: 320,
          background: `linear-gradient(to bottom, ${accentColor} ${borderH * 100}%, transparent ${borderH * 100}%)`,
          flexShrink: 0,
          marginTop: 8,
          borderRadius: 3,
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Quote body */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 58,
            fontWeight: 400,
            lineHeight: 1.45,
            color: '#f5f0e8',
            margin: 0,
          }}
        >
          {text.split(' ').map((word, i) => {
            const isEmphasis =
              emphasisWord &&
              word.toLowerCase().includes(emphasisWord.toLowerCase());
            return (
              <span
                key={i}
                style={{
                  color: isEmphasis ? accentColor : '#f5f0e8',
                  marginRight: 7,
                }}
              >
                {word}
              </span>
            );
          })}
        </p>

        {/* Attribution */}
        {attribution && (
          <p
            style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: accentColor,
              margin: 0,
              opacity: 0.9,
            }}
          >
            — {attribution}
          </p>
        )}
      </div>
    </div>
  );
};
