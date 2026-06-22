import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const TextKinetic: React.FC<{
  words: string[] | string;
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
}> = ({
  words: wordsProp,
  accentColor = '#d400ff',
  fontSize = 96,
  fontFamily = "'Anton', sans-serif",
  backgroundColor = '#000000',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = typeof wordsProp === 'string' ? wordsProp.split(' ') : wordsProp;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
        {words.map((word, i) => {
          const delay = i * 6;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 24, stiffness: 280, mass: 0.8 },
            durationInFrames: 30,
          });
          const scale = interpolate(progress, [0, 1], [0.5, 1]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);
          const translateY = interpolate(progress, [0, 1], [40, 0]);

          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: i === words.length - 1 ? accentColor : '#ffffff',
                transform: `scale(${scale}) translateY(${translateY}px)`,
                opacity,
                display: 'inline-block',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
