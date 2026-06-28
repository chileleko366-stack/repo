// Kinetic type mask — reveals text word-by-word via clip-path animation.
// Equivalent to remocn KineticTypeMask (remocn.dev/r/kinetic-type-mask.json).
// Written as owned code; no runtime dependency on remocn registry.

import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface KineticTypeMaskProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  staggerFrames?: number;
  style?: React.CSSProperties;
}

function WordMask({
  word,
  delayFrames,
}: {
  word: string;
  delayFrames: number;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = Math.max(0, frame - delayFrames);

  const revealProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 260, mass: 0.7 },
    durationInFrames: 12,
  });

  const translateY = interpolate(revealProgress, [0, 1], [110, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(revealProgress, [0, 0.3, 1], [0, 0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "bottom",
        marginRight: "0.25em",
      }}
    >
      <span
        style={{
          display: "inline-block",
          transform: `translateY(${translateY}%)`,
          opacity,
        }}
      >
        {word}
      </span>
    </span>
  );
}

export const KineticTypeMask: React.FC<KineticTypeMaskProps> = ({
  text,
  fontSize = 80,
  color = "white",
  fontFamily = "inherit",
  fontWeight = 700,
  staggerFrames = 4,
  style,
}) => {
  const words = text.split(" ");

  return (
    <div
      style={{
        fontSize,
        color,
        fontFamily,
        fontWeight,
        lineHeight: 1.2,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        ...style,
      }}
    >
      {words.map((word, i) => (
        <WordMask key={`${word}-${i}`} word={word} delayFrames={i * staggerFrames} />
      ))}
    </div>
  );
};
