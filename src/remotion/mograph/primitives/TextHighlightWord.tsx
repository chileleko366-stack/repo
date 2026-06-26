import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props {
  text: string;
  accentColor: string;
  bodyFont?: string;
  fontSize?: number;
  staggerFrames?: number;
}

export const TextHighlightWord: React.FC<Props> = ({
  text,
  accentColor,
  bodyFont = 'sans-serif',
  fontSize = 72,
  staggerFrames = 6,
}) => {
  const frame = useCurrentFrame();
  const words = (text || 'Breaking News').split(' ');

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexWrap: 'wrap',
      padding: '0 60px',
      gap: 12,
      textAlign: 'center',
    }}>
      {words.map((word, i) => {
        const wordFrame = frame - i * staggerFrames;
        const color = interpolate(wordFrame, [0, 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const brightness = interpolate(wordFrame, [0, 5], [2.0, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const opacity = interpolate(wordFrame, [-6, 0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

        const wordColor = color > 0.1 ? accentColor : '#ffffff';

        return (
          <span
            key={i}
            style={{
              fontFamily: bodyFont,
              fontSize,
              fontWeight: 700,
              color: wordColor,
              filter: `brightness(${brightness})`,
              opacity,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
