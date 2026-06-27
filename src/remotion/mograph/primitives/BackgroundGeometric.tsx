import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  accentColor?: string;
  backgroundColor?: string;
}

export const BackgroundGeometric: React.FC<Props> = ({
  accentColor = '#d400ff',
  backgroundColor = '#16121f',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const shapes = [
    { shape: 'circle', x: 15, y: 20, size: 180, rotation: 0 },
    { shape: 'square', x: 75, y: 15, size: 140, rotation: t * 20 },
    { shape: 'triangle', x: 60, y: 70, size: 200, rotation: -t * 15 },
    { shape: 'circle', x: 25, y: 75, size: 120, rotation: 0 },
    { shape: 'square', x: 85, y: 55, size: 100, rotation: t * 25 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden' }}>
      {shapes.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            borderRadius: s.shape === 'circle' ? '50%' : s.shape === 'square' ? '12px' : '0',
            border: `2px solid ${accentColor}22`,
            background: `${accentColor}08`,
            filter: 'blur(2px)',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
