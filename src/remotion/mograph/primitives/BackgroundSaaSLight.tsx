import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  backgroundColor?: string;
}

export const BackgroundSaaSLight: React.FC<Props> = ({
  color1 = '#a78bfa',
  color2 = '#60a5fa',
  color3 = '#34d399',
  color4 = '#f472b6',
  backgroundColor = '#f5f4f8',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const blobs = [
    { x: 20 + 8 * Math.sin(t * 0.25), y: 20 + 6 * Math.cos(t * 0.3), color: color1 },
    { x: 75 + 6 * Math.cos(t * 0.28), y: 35 + 8 * Math.sin(t * 0.22), color: color2 },
    { x: 40 + 10 * Math.sin(t * 0.32 + 1), y: 70 + 6 * Math.cos(t * 0.27), color: color3 },
    { x: 65 + 7 * Math.cos(t * 0.35), y: 80 + 7 * Math.sin(t * 0.29), color: color4 },
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
            width: '55%',
            height: '55%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${b.color}28 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
