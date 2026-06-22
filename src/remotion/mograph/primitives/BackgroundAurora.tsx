import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const BackgroundAurora: React.FC<{
  color1?: string;
  color2?: string;
  color3?: string;
  backgroundColor?: string;
}> = ({
  color1 = '#d400ff',
  color2 = '#00ccff',
  color3 = '#00ff88',
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const t1 = frame * 0.008;
  const t2 = frame * 0.011 + 1;
  const t3 = frame * 0.007 + 2;

  const x1 = 50 + Math.sin(t1) * 30;
  const x2 = 50 + Math.sin(t2) * 25;
  const x3 = 50 + Math.sin(t3) * 20;
  const y1 = 40 + Math.cos(t1 * 0.8) * 20;
  const y2 = 50 + Math.cos(t2 * 0.7) * 15;
  const y3 = 60 + Math.cos(t3 * 0.9) * 18;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        opacity: Math.min(frame / 30, 0.9),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            `radial-gradient(ellipse 70% 40% at ${x1}% ${y1}%, ${color1}55 0%, transparent 70%)`,
            `radial-gradient(ellipse 60% 35% at ${x2}% ${y2}%, ${color2}44 0%, transparent 65%)`,
            `radial-gradient(ellipse 50% 30% at ${x3}% ${y3}%, ${color3}44 0%, transparent 60%)`,
          ].join(', '),
          filter: 'blur(40px)',
        }}
      />
    </AbsoluteFill>
  );
};
