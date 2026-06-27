/**
 * MorphShape — frame-driven SVG path morph between two arbitrary shapes.
 *
 * Uses flubber's interpolate() to smoothly transition fromPath → toPath.
 * The morphFn is memoized so flubber's heavy path segmentation only runs
 * when the path strings actually change, not every frame.
 *
 * All animation is a pure function of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { interpolate as flubberInterpolate } from 'flubber';

export const MorphShape: React.FC<{
  fromPath: string;
  toPath: string;
  durationFrames: number;
  /** Frame offset within the parent Sequence to start the morph */
  startFrame?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  viewBox?: string;
  style?: React.CSSProperties;
}> = ({
  fromPath,
  toPath,
  durationFrames,
  startFrame = 0,
  fill = 'white',
  stroke = 'none',
  strokeWidth = 0,
  width = 200,
  height = 200,
  viewBox = '0 0 200 200',
  style,
}) => {
  const frame = useCurrentFrame();

  // Memoize so flubber's segmentation only runs when paths change
  const morphFn = React.useMemo(
    () => flubberInterpolate(fromPath, toPath, { maxSegmentLength: 4 }),
    [fromPath, toPath],
  );

  const t = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const d = morphFn(t);

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={{ overflow: 'visible', ...style }}
    >
      <path
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};
