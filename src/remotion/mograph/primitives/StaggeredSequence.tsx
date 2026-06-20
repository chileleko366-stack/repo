// Ported from:
// /tmp/refs/saas-engine/src/skills/sequencing.md — "Staggered Element Entrances" pattern
// Wraps children in calculated per-item spring delays.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

interface StaggeredSequenceProps {
  children: React.ReactNode[];
  staggerDelayFrames?: number;
  baseDelayFrames?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  style?: React.CSSProperties;
}

export const StaggeredSequence: React.FC<StaggeredSequenceProps> = ({
  children,
  staggerDelayFrames = 8,
  baseDelayFrames = 0,
  direction = 'up',
  distance = 20,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {React.Children.map(children, (child, i) => {
        const delay = baseDelayFrames + i * staggerDelayFrames;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: SPRING_CONFIGS.snappy,
        });

        const tx = direction === 'left' ? interpolate(progress, [0, 1], [distance, 0]) :
                   direction === 'right' ? interpolate(progress, [0, 1], [-distance, 0]) : 0;
        const ty = direction === 'up' ? interpolate(progress, [0, 1], [distance, 0]) :
                   direction === 'down' ? interpolate(progress, [0, 1], [-distance, 0]) : 0;

        return (
          <div
            key={i}
            style={{
              opacity: progress,
              transform: `translate(${tx}px, ${ty}px)`,
            }}
          >
            {child}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
