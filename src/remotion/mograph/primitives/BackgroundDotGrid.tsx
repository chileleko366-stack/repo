/**
 * BackgroundDotGrid — repeating SVG dot-grid background.
 *
 * Lesson source: AE uses a blank grid PNG asset tiled as background for
 * the storyboard scene. SVG pattern is cleaner and resolution-independent.
 *
 * Usage: behind any data/analytics/planning beat on any channel.
 * LLM key: "BackgroundDotGrid"
 */
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const BackgroundDotGrid: React.FC<{
  dotColor?: string;
  dotSize?: number;
  spacing?: number;
  backgroundColor?: string;
  animated?: boolean;
}> = ({
  dotColor = '#c8c8d4',
  dotSize = 3,
  spacing = 40,
  backgroundColor = '#f8f8fc',
  animated = true,
}) => {
  const frame = useCurrentFrame();
  // Slow breathing opacity — grid feels alive, not static
  const gridOpacity = animated
    ? interpolate(Math.sin(frame * 0.03), [-1, 1], [0.35, 0.65])
    : 0.5;
  // Entrance fade
  const entrance = Math.min(frame / 30, 1);

  const patternId = 'dotgrid';

  return (
    <AbsoluteFill style={{ backgroundColor, opacity: entrance }}>
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', inset: 0, opacity: gridOpacity }}
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={dotSize / 2}
              fill={dotColor}
            />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill={`url(#${patternId})`} />
      </svg>
    </AbsoluteFill>
  );
};
