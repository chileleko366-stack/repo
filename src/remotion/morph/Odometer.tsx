/**
 * Odometer — rolling digit display for year-type numbers.
 *
 * Each decimal place gets its own vertical strip of 0-9 digits that scroll
 * to the target value. Higher place-value digits settle earlier; the units
 * digit lands last after rapid cycling. Spring overshoot on each digit's
 * landing separates "rolled into place" from "just stopped."
 *
 * Mechanism: CSS clip + translateY per digit column, driven purely by
 * useCurrentFrame() — no side effects, fully deterministic.
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const DIGIT_HEIGHT = 1; // fraction of font-size used as the unit

interface OdometerProps {
  value: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  /** Frame within parent Sequence to begin rolling */
  delayFrames?: number;
  /** Total frames the roll-in occupies */
  durationFrames?: number;
}

function DigitColumn({
  target,
  fontSize,
  color,
  fontFamily,
  settleFrame,
  durationFrames,
}: {
  target: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  settleFrame: number;
  durationFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Each digit column springs to its final value independently
  const progress = spring({
    frame: Math.max(0, frame - settleFrame),
    fps,
    config: { stiffness: 400, damping: 28 },
    durationInFrames: Math.max(1, durationFrames - settleFrame),
  });

  // Overshoot: start from target-3 (cycling fast) then spring to exact target
  const digitOffset = interpolate(progress, [0, 1], [target - 3, target], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Translate the column so the correct digit is visible
  const translateY = -digitOffset * fontSize * DIGIT_HEIGHT;

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div
      style={{
        display: 'inline-block',
        height: fontSize,
        overflow: 'hidden',
        verticalAlign: 'top',
        width: fontSize * 0.62,
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {digits.map((d) => (
          <div
            key={d}
            style={{
              height: fontSize,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily,
              fontSize,
              fontWeight: 700,
              color,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

export const Odometer: React.FC<OdometerProps> = ({
  value,
  fontSize = 120,
  color = 'white',
  fontFamily = 'inherit',
  delayFrames = 0,
  durationFrames = 120,
}) => {
  const digits = String(Math.abs(Math.round(value))).split('').map(Number);
  const totalPlaces = digits.length;

  // Higher place-value digits settle earlier; units digit settles last
  // Stagger: first digit settles at delayFrames + 0, last at delayFrames + (n-1) * stagger
  const STAGGER_FRAMES = 12;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {value < 0 && (
        <span style={{ fontFamily, fontSize, fontWeight: 700, color, lineHeight: 1 }}>−</span>
      )}
      {digits.map((digit, i) => {
        // Units is the last index; it settles latest
        const placeFromUnits = totalPlaces - 1 - i;
        const settleFrame = delayFrames + placeFromUnits * STAGGER_FRAMES;
        return (
          <DigitColumn
            key={i}
            target={digit}
            fontSize={fontSize}
            color={color}
            fontFamily={fontFamily}
            settleFrame={settleFrame}
            durationFrames={durationFrames}
          />
        );
      })}
    </div>
  );
};
