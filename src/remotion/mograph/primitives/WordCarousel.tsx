// Ported from:
// /tmp/refs/saas-engine/src/examples/code/word-carousel.ts
// /tmp/refs/saas-engine/src/skills/typography.md — "Word Carousel - Stable Width Container"
// Implements: crossfade+blur between words, invisible width-keeper from longest word.

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const HOLD_DURATION = 64;
const FLIP_DURATION = 36;
const BLUR_AMOUNT = 6;

interface WordCarouselProps {
  prefix?: string;
  words: string[];
  prefixColor?: string;
  wordColor?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}

export const WordCarousel: React.FC<WordCarouselProps> = ({
  prefix,
  words,
  prefixColor = 'rgba(255,255,255,0.55)',
  wordColor = '#ffffff',
  fontSize = 80,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();

  const perStep = HOLD_DURATION + FLIP_DURATION;
  const currentStep = Math.floor(frame / perStep) % words.length;
  const nextStep = (currentStep + 1) % words.length;
  const phase = frame % perStep;
  const isFlipping = phase >= HOLD_DURATION;
  const flipProgress = isFlipping ? (phase - HOLD_DURATION) / FLIP_DURATION : 0;

  const outOpacity = interpolate(flipProgress, [0, 1], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const inOpacity = interpolate(flipProgress, [0, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outBlur = interpolate(flipProgress, [0, 1], [0, BLUR_AMOUNT], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const inBlur = interpolate(flipProgress, [0, 1], [BLUR_AMOUNT, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const longestWord = words.reduce((a, b) => (a.length >= b.length ? a : b), words[0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, color: wordColor }}>
        {prefix && (
          <div style={{ fontSize, fontWeight: 300, color: prefixColor }}>
            {prefix}
          </div>
        )}
        <div style={{ position: 'relative', fontSize, fontWeight: 700 }}>
          {/* Invisible width keeper — prevents layout shift */}
          <div style={{ visibility: 'hidden' }}>{longestWord}</div>
          {!isFlipping && (
            <div style={{ position: 'absolute', left: 0, top: 0 }}>
              {words[currentStep]}
            </div>
          )}
          {isFlipping && (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  opacity: outOpacity,
                  filter: `blur(${outBlur}px)`,
                }}
              >
                {words[currentStep]}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  opacity: inOpacity,
                  filter: `blur(${inBlur}px)`,
                }}
              >
                {words[nextStep]}
              </div>
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
