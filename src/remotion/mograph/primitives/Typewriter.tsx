import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface Props {
  text?: string;
  accentColor?: string;
  color?: string;
  fontSize?: number;
  charsPerFrame?: number;
  fontFamily?: string;
}

export const Typewriter: React.FC<Props> = ({
  text = 'Type something interesting here.',
  accentColor = '#00ff88',
  color = '#ffffff',
  fontSize = 56,
  charsPerFrame = 0.8,
  fontFamily = 'JetBrains Mono, monospace',
}) => {
  const frame = useCurrentFrame();
  const visible = Math.min(Math.floor(frame * charsPerFrame), text.length);
  const displayed = text.slice(0, visible);
  const showCursor = frame % 20 < 12;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div
        style={{
          fontSize,
          fontFamily,
          color,
          lineHeight: 1.4,
          textAlign: 'center',
          maxWidth: '90%',
        }}
      >
        {displayed}
        {showCursor && (
          <span style={{ color: accentColor, marginLeft: 2 }}>|</span>
        )}
      </div>
    </AbsoluteFill>
  );
};
