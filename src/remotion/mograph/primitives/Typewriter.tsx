// Ported from:
// /tmp/refs/saas-engine/src/skills/typography.md — "Typewriter Effect - Use String Slicing"
// /tmp/refs/saas-engine/src/examples/code/typewriter-highlight.ts
// Adapted for this project's prop/font conventions.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CHAR_FRAMES = 6;
const CURSOR_BLINK_FRAMES = 32;
const ENTRANCE_DURATION = 44;

interface TypewriterProps {
  text: string;
  highlightWord?: string;
  highlightColor?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  highlightWord,
  highlightColor = '#FFE44D',
  fontSize = 72,
  fontFamily = 'Anton, sans-serif',
  color = '#ffffff',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entranceProgress = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 140, mass: 0.9 },
    durationInFrames: ENTRANCE_DURATION,
  });

  const containerOpacity = interpolate(entranceProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const containerTranslateX = interpolate(entranceProgress, [0, 1], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const typedChars = Math.min(text.length, Math.floor(frame / CHAR_FRAMES));
  const typedText = text.slice(0, typedChars);
  const typingDone = typedChars >= text.length;

  const caretOpacity = interpolate(
    frame % CURSOR_BLINK_FRAMES,
    [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
    [1, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const typeEndFrame = text.length * CHAR_FRAMES;
  const highlightStart = typeEndFrame + 10;

  const highlightProgress = spring({
    fps,
    frame: frame - highlightStart,
    config: { damping: 36, stiffness: 400 },
    durationInFrames: 44,
  });
  const highlightScaleX = interpolate(highlightProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hasHighlight = !!highlightWord && text.includes(highlightWord);
  const highlightWordIndex = hasHighlight ? text.indexOf(highlightWord!) : -1;
  const preText = hasHighlight ? text.slice(0, highlightWordIndex) : '';
  const postText = hasHighlight ? text.slice(highlightWordIndex + highlightWord!.length) : '';
  const finalLayerOpacity = frame >= highlightStart ? 1 : 0;

  const baseStyle: React.CSSProperties = {
    color,
    fontSize,
    fontFamily,
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    whiteSpace: 'pre-wrap',
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div
        style={{
          position: 'relative',
          opacity: containerOpacity,
          transform: `translateX(${containerTranslateX}px)`,
          maxWidth: '90%',
          textAlign: 'center',
        }}
      >
        {/* Typewriter layer */}
        <div style={baseStyle}>
          <span>{typedText}</span>
          {!typingDone && (
            <span style={{ opacity: caretOpacity }}>▌</span>
          )}
        </div>

        {/* Highlighted final layer */}
        {hasHighlight && (
          <div style={{ ...baseStyle, position: 'absolute', inset: 0, opacity: finalLayerOpacity }}>
            <span>{preText}</span>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '-0.1em',
                  right: '-0.1em',
                  top: '50%',
                  height: '1.05em',
                  transform: `translateY(-50%) scaleX(${highlightScaleX})`,
                  transformOrigin: 'left center',
                  backgroundColor: highlightColor,
                  borderRadius: '0.2em',
                  zIndex: 0,
                }}
              />
              <span style={{ position: 'relative', zIndex: 1, color: '#000' }}>
                {highlightWord}
              </span>
            </span>
            <span>{postText}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
