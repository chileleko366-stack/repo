/**
 * MorphText — kinetic character-level text transition.
 *
 * The full animation is split into two halves:
 *   Exit  (0 → exitFraction * durationFrames):
 *     Each char in fromText scales to 0 and fades out, staggered left-to-right.
 *   Enter (exitFraction * durationFrames → durationFrames):
 *     Each char in toText scales from 0 and fades in, staggered left-to-right.
 *
 * The stagger delay per character is automatically capped so all chars finish
 * before the phase ends. Everything is a pure function of useCurrentFrame().
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const SPRING_CONFIG = { damping: 18, stiffness: 260, mass: 0.7 };
const SPRING_FRAMES = 10;

function CharSpan({
  char,
  enterProgress,
  color,
  fontSize,
  fontFamily,
}: {
  char: string;
  enterProgress: number; // 0 = hidden, 1 = fully visible
  color: string;
  fontSize: number;
  fontFamily: string;
}) {
  const scale  = interpolate(enterProgress, [0, 1], [0.4, 1.0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(enterProgress, [0, 0.4, 1], [0, 0.7, 1],   { extrapolateRight: 'clamp' });
  const translateY = interpolate(enterProgress, [0, 1], [18, 0],          { extrapolateRight: 'clamp' });

  // Non-breaking space keeps the span width for space chars
  const display = char === ' ' ? ' ' : char;

  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        color,
        fontSize,
        fontFamily,
        lineHeight: 1.1,
        transformOrigin: 'center bottom',
      }}
    >
      {display}
    </span>
  );
}

export const MorphText: React.FC<{
  fromText: string;
  toText: string;
  /** Total frames for the full exit+enter transition */
  durationFrames: number;
  /** Fraction of durationFrames used for the exit phase (default 0.45) */
  exitFraction?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  style?: React.CSSProperties;
}> = ({
  fromText,
  toText,
  durationFrames,
  exitFraction = 0.45,
  fontSize = 80,
  color = 'white',
  fontFamily = 'inherit',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exitEnd  = Math.round(durationFrames * exitFraction);
  const enterStart = exitEnd;
  const enterEnd   = durationFrames;

  const fromChars = fromText.split('');
  const toChars   = toText.split('');

  // Max stagger per char so all chars finish by phase end, leaving SPRING_FRAMES for anim
  const exitStagger  = fromChars.length > 1
    ? Math.min(3, (exitEnd  - SPRING_FRAMES) / (fromChars.length - 1))
    : 0;
  const enterStagger = toChars.length > 1
    ? Math.min(3, (enterEnd - enterStart - SPRING_FRAMES) / (toChars.length - 1))
    : 0;

  // Which set of chars are we showing?
  const showFrom = frame < enterStart;

  const chars      = showFrom ? fromChars : toChars;
  const stagger    = showFrom ? exitStagger  : enterStagger;
  const phaseStart = showFrom ? 0 : enterStart;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: 0,
        ...style,
      }}
    >
      {chars.map((char, i) => {
        const charFrameStart = phaseStart + i * stagger;
        const localFrame = Math.max(0, frame - charFrameStart);

        // For exit: play spring forward then reverse at exitEnd
        let enterProgress: number;
        if (showFrom) {
          // Enter progress goes 0→1 (appear), then we reverse it for exit
          const sp = spring({
            frame: localFrame,
            fps,
            config: SPRING_CONFIG,
            durationInFrames: SPRING_FRAMES,
          });
          // Start already visible, collapse out as localFrame grows
          const reverseLocalFrame = Math.max(0, frame - (exitEnd - SPRING_FRAMES - i * exitStagger));
          const spExit = spring({
            frame: reverseLocalFrame,
            fps,
            config: SPRING_CONFIG,
            durationInFrames: SPRING_FRAMES,
          });
          enterProgress = Math.max(0, sp - spExit);
          // Simpler: just interpolate linearly for exit
          enterProgress = interpolate(
            frame,
            [charFrameStart, charFrameStart + SPRING_FRAMES, exitEnd - SPRING_FRAMES - i * exitStagger, exitEnd - i * exitStagger],
            [0, 1, 1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
          );
        } else {
          enterProgress = spring({
            frame: localFrame,
            fps,
            config: SPRING_CONFIG,
            durationInFrames: SPRING_FRAMES,
          });
        }

        return (
          <CharSpan
            key={`${showFrom ? 'from' : 'to'}-${i}`}
            char={char}
            enterProgress={enterProgress}
            color={color}
            fontSize={fontSize}
            fontFamily={fontFamily}
          />
        );
      })}
    </div>
  );
};
