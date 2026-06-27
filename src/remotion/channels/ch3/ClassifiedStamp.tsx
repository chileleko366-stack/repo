/**
 * ClassifiedStamp — red classified stamp that smashes onto the frame.
 * Spring scale 1.5→1 with very low damping gives a hard stamping impact feel.
 * All animation is a pure function of useCurrentFrame().
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const ClassifiedStamp: React.FC<{
  label?: string;
  delayFrames?: number;
}> = ({ label = 'CLASSIFIED', delayFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 7, stiffness: 500, mass: 0.5 },
    durationInFrames: 24,
  });

  const scale = interpolate(enter, [0, 1], [1.6, 1.0]);
  const opacity = Math.min(1, enter * 2);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '42%',
        transform: `translate(-50%, -50%) rotate(-11deg) scale(${scale})`,
        opacity,
        border: '7px solid #cc0000',
        padding: '18px 44px',
        pointerEvents: 'none',
        boxShadow: '0 0 40px rgba(204,0,0,0.35)',
      }}
    >
      <span
        style={{
          fontFamily: "'Special Elite', cursive",
          fontSize: 92,
          color: '#cc0000',
          letterSpacing: '0.2em',
          textShadow: '0 0 24px rgba(204,0,0,0.55)',
          textTransform: 'uppercase' as const,
          display: 'block',
        }}
      >
        {label}
      </span>
    </div>
  );
};
