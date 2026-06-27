import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  words?: string[];
  accentColor?: string;
  color?: string;
  fontSize?: number;
  framesPerWord?: number;
}

export const WordCarousel: React.FC<Props> = ({
  words = ['Follow', 'Learn', 'Grow'],
  accentColor = '#d400ff',
  color = '#ffffff',
  fontSize = 80,
  framesPerWord = 40,
}) => {
  const frame = useCurrentFrame();
  const idx = Math.floor(frame / framesPerWord) % words.length;
  const wordFrame = frame % framesPerWord;
  const opacity = interpolate(wordFrame, [0, 8, framesPerWord - 8, framesPerWord], [0, 1, 1, 0]);
  const y = interpolate(wordFrame, [0, 8], [20, 0]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          fontSize,
          fontFamily: 'Anton, sans-serif',
          fontWeight: 900,
          color: idx % 2 === 0 ? accentColor : color,
          textTransform: 'uppercase',
          opacity,
          transform: `translateY(${y}px)`,
          letterSpacing: '0.04em',
        }}
      >
        {words[idx]}
      </div>
    </AbsoluteFill>
  );
};
