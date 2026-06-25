/**
 * TextHorizontalSlide — words slide in from the right, staggered.
 *
 * Lesson source: AE position keyframes with easeOut — each word starts
 * off-screen right and slides to its resting position, staggered by
 * a fixed delay per word. Used for bullet-point reveals throughout lesson 5.
 *
 * Usage: beats that enumerate a list of items, key facts, or attributes.
 * Primary text: comma-separated words or short phrases.
 * LLM key: "TextHorizontalSlide"
 */
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const TextHorizontalSlide: React.FC<{
  text: string;               // comma-separated items
  color?: string;
  accentColor?: string;
  fontSize?: number;
  backgroundColor?: string;
  fontFamily?: string;
  staggerFrames?: number;     // delay between each word
}> = ({
  text,
  color = '#ffffff',
  accentColor = '#a855f7',
  fontSize = 72,
  backgroundColor = '#000000',
  fontFamily = "'Space Grotesk', sans-serif",
  staggerFrames = 8,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(',').map(w => w.trim()).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0 80px',
        gap: Math.max(fontSize * 0.35, 16),
      }}
    >
      {words.map((word, i) => {
        const startFrame = i * staggerFrames;
        const slideProgress = interpolate(
          frame,
          [startFrame, startFrame + 22],
          [0, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: t => 1 - Math.pow(1 - t, 3), // easeOutCubic
          }
        );
        const tx = interpolate(slideProgress, [0, 1], [120, 0]);
        const opacity = interpolate(slideProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' });

        // Alternate: first word uses accentColor
        const isAccent = i === 0;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              transform: `translateX(${tx}px)`,
              opacity,
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                width: 6,
                height: fontSize * 0.85,
                borderRadius: 3,
                background: accentColor,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily,
                fontSize,
                fontWeight: isAccent ? 700 : 500,
                color: isAccent ? accentColor : color,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {word}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
