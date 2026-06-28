// Pure CSS/SVG ambient motion — zero GPU, zero WebGL, deterministic per frame.
// Uses simplex-noise driven by useCurrentFrame() for reproducible renders.

import React from "react";
import { useCurrentFrame } from "remotion";
import { createNoise2D } from "simplex-noise";

const noiseX = createNoise2D();
const noiseY = createNoise2D();
const noiseR = createNoise2D();

interface AmbientBackgroundProps {
  baseColor: string;
  accentColor: string;
  channelId: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  baseColor,
  accentColor,
}) => {
  const frame = useCurrentFrame();

  const speed = 0.008;

  const x1 = noiseX(frame * speed, 0) * 30;
  const y1 = noiseY(0, frame * speed) * 30;
  const r1 = noiseR(frame * speed, 1) * 15;

  const x2 = noiseX(frame * speed + 100, 2) * 25;
  const y2 = noiseY(2, frame * speed + 100) * 25;

  const x3 = noiseX(frame * speed + 200, 4) * 20;
  const y3 = noiseY(4, frame * speed + 200) * 20;

  const opacity = 0.05;
  const strokeOpacity = 0.08;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: baseColor,
        overflow: "hidden",
      }}
    >
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: "absolute", inset: 0 }}
      >
        <circle
          cx={540 + x1}
          cy={960 + y1}
          r={400 + r1}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
          opacity={strokeOpacity}
        />
        <line
          x1={100 + x2}
          y1={200 + y2}
          x2={980 + x2}
          y2={1720 + y2}
          stroke={accentColor}
          strokeWidth={0.5}
          opacity={strokeOpacity}
        />
        <rect
          x={200 + x3}
          y={400 + y3}
          width={680}
          height={1120}
          fill={accentColor}
          opacity={opacity}
          rx={4}
        />
      </svg>
    </div>
  );
};
