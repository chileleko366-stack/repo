import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  text?: string;
  accentColor?: string;
  fontSize?: number;
}

export const TextGlitch: React.FC<Props> = ({
  text = 'GLITCH',
  accentColor = '#cc0000',
  fontSize = 96,
}) => {
  const frame = useCurrentFrame();
  const glitchActive = frame % 8 < 3;
  const rOffset = glitchActive ? (Math.random() - 0.5) * 6 : 0;
  const bOffset = glitchActive ? (Math.random() - 0.5) * 6 : 0;

  const base: React.CSSProperties = {
    fontSize,
    fontFamily: 'Anton, sans-serif',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    position: 'absolute',
    whiteSpace: 'nowrap',
  };

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ ...base, color: '#ff0000', transform: `translate(${rOffset}px, 0)`, opacity: 0.7 }}>{text}</div>
        <div style={{ ...base, color: '#ffffff' }}>{text}</div>
        <div style={{ ...base, color: '#0000ff', transform: `translate(${bOffset}px, 0)`, opacity: 0.7 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};
