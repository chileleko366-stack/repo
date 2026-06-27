import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const LayoutFullscreenType: React.FC<{
  text: string;
  accentWord?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}> = ({
  text,
  accentWord = '',
  accentColor = '#d400ff',
  backgroundColor = '#000000',
  fontFamily = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');

  return (
    <AbsoluteFill style={{ backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 60px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
        {words.map((word, i) => {
          const delay = i * 5;
          const p = spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 300 }, durationInFrames: 28 });
          const scale = interpolate(p, [0, 1], [0.6, 1]);
          const opacity = interpolate(p, [0, 0.4, 1], [0, 1, 1]);
          const isAccent = accentWord && word.toLowerCase().includes(accentWord.toLowerCase());

          return (
            <span
              key={i}
              style={{
                fontFamily,
                fontSize: 100,
                fontWeight: 700,
                color: isAccent ? accentColor : '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
                transform: `scale(${scale})`,
                opacity,
                display: 'inline-block',
                textShadow: isAccent ? `0 0 40px ${accentColor}88` : undefined,
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
