import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const TextGlitch: React.FC<{
  text: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  text,
  color = '#ffffff',
  fontSize = 100,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const intensity = Math.sin(frame * 0.3) * 0.5 + 0.5;
  const gx1 = Math.sin(frame * 0.7 + 1) * 6 * intensity;
  const gx2 = Math.sin(frame * 0.5 + 2) * -5 * intensity;
  const clip = (frame * 3) % 100;
  const opacity = Math.min(frame / 10, 1);

  const base: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: 700,
    textAlign: 'center',
    letterSpacing: '-0.02em',
    textTransform: 'uppercase',
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '0 60px',
  };

  return (
    <AbsoluteFill style={{ backgroundColor, opacity }}>
      <div style={{ ...base, color: '#ff0050', transform: `translateY(-50%) translateX(${gx1}px)`, clipPath: `inset(${clip}% 0 ${Math.max(0, 100 - clip - 20)}% 0)`, opacity: 0.9 }}>{text}</div>
      <div style={{ ...base, color: '#00ffff', transform: `translateY(-50%) translateX(${gx2}px)`, clipPath: `inset(${(clip + 30) % 100}% 0 ${Math.max(0, 100 - (clip + 30) % 100 - 20)}% 0)`, opacity: 0.9 }}>{text}</div>
      <div style={{ ...base, color }}>{text}</div>
    </AbsoluteFill>
  );
};
