import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface CardItem {
  platform?: string;
  message?: string;
  color?: string;
  zDepth?: number;
}

interface Props {
  cards?: CardItem[];
  backgroundColor?: string;
  fontFamily?: string;
  accentColor?: string;
}

const DEFAULT_CARDS: CardItem[] = [
  { platform: 'FACT 1', message: 'The human brain processes images 60,000× faster than text.', color: '#d400ff', zDepth: 0 },
  { platform: 'FACT 2', message: 'You blink 15,000 times per day without noticing.', color: '#00f0ff', zDepth: 20 },
  { platform: 'FACT 3', message: 'Memory reconsolidates every time you recall it.', color: '#ff6b35', zDepth: -20 },
  { platform: 'FACT 4', message: 'Dopamine predicts reward, not delivers it.', color: '#00ff88', zDepth: 10 },
];

export const CardGrid: React.FC<Props> = ({
  cards = DEFAULT_CARDS,
  backgroundColor = 'transparent',
  fontFamily = 'Space Grotesk, sans-serif',
  accentColor = '#d400ff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor, padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, perspective: 1200 }}>
      {cards.map((card, i) => {
        const delay = i * 8;
        const progress = spring({ frame: frame - delay, fps, config: SPRING_GENTLE });
        const y = interpolate(progress, [0, 1], [60, 0]);
        const opacity = interpolate(progress, [0, 0.3, 1], [0, 0, 1]);

        return (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderLeft: `4px solid ${card.color || accentColor}`,
              borderRadius: 16,
              padding: '24px 28px',
              transform: `translateY(${y}px) translateZ(${card.zDepth || 0}px)`,
              opacity,
              boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
            }}
          >
            <div style={{ fontSize: 16, fontFamily, color: card.color || accentColor, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
              {card.platform}
            </div>
            <div style={{ fontSize: 26, fontFamily, color: '#ffffff', lineHeight: 1.4 }}>
              {card.message}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
