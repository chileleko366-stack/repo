// Kinetic hero word event — fires once per beat on beat.heroWord.
// Large, punchy, timed to the voice. Spring entrance, fade exit.

import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { SOCIAL_SAFE_ZONE } from "./primitives";

interface HeroWordProps {
  word: string;
  accentColor: string;
  fontFamily?: string;
  startFrame: number;
  durationFrames: number;
}

export const HeroWord: React.FC<HeroWordProps> = ({
  word,
  accentColor,
  fontFamily = "Anton, sans-serif",
  startFrame,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const localFrame = frame - startFrame;
  const sidePad = Math.round(width * SOCIAL_SAFE_ZONE.sidePct);

  const enterScale = spring({
    frame: localFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 300,
      mass: 0.6,
    },
    from: 0.6,
    to: 1,
  });

  const exitOpacity = interpolate(
    localFrame,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const enterOpacity = interpolate(localFrame, [0, 3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = enterOpacity * exitOpacity;

  return (
    <div
      style={{
        position: "absolute",
        top: "30%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${enterScale})`,
        opacity,
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 160,
          fontWeight: 900,
          color: accentColor,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          textAlign: "center",
          padding: `0 ${sidePad}px`,
        }}
      >
        {word}
      </span>
    </div>
  );
};
