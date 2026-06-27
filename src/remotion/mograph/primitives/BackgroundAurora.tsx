import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  color1?: string;
  color2?: string;
  color3?: string;
  backgroundColor?: string;
}

export const BackgroundAurora: React.FC<Props> = ({
  color1 = '#d400ff',
  color2 = '#00f0ff',
  color3 = '#7b00ff',
  backgroundColor = '#16121f',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const blobs = [
    { x: 30 + 12 * Math.sin(t * 0.4), y: 25 + 10 * Math.cos(t * 0.3), color: color1, r: 55 },
    { x: 70 + 10 * Math.cos(t * 0.35), y: 60 + 12 * Math.sin(t * 0.45), color: color2, r: 50 },
    { x: 50 + 14 * Math.sin(t * 0.5 + 1), y: 80 + 8 * Math.cos(t * 0.28), color: color3, r: 45 },
    { x: 20 + 10 * Math.cos(t * 0.38), y: 70 + 10 * Math.sin(t * 0.32), color: color2, r: 40 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden' }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.r}%`,
            height: `${b.r}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${b.color}55 0%, ${b.color}22 50%, transparent 75%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
