import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface CardData {
  title: string;
  value?: string;
}

interface CardGridProps {
  cards?: CardData[];
  accentColor?: string;
  backgroundColor?: string;
}

const DEFAULT_CARDS: CardData[] = [
  { title: 'Revenue', value: '+48%' },
  { title: 'Users', value: '2.4M' },
  { title: 'Retention', value: '94%' },
  { title: 'NPS', value: '72' },
];

export const CardGrid: React.FC<CardGridProps> = ({
  cards = DEFAULT_CARDS,
  accentColor = '#4f46e5',
  backgroundColor = '#0f0f1a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      perspective: 1200,
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        width: '90%',
        transformStyle: 'preserve-3d',
      }}>
        {cards.slice(0, 4).map((card, i) => {
          const delay = i * 4;
          const springCfg = { damping: 16, stiffness: 140, mass: 0.7 };
          const startFrame = Math.max(0, frame - delay);

          const scale = spring({ frame: startFrame, fps, config: springCfg, from: 0.6, to: 1 });
          const opacity = spring({ frame: startFrame, fps, config: { damping: 20, stiffness: 200 }, from: 0, to: 1 });
          const translateY = spring({ frame: startFrame, fps, config: { damping: 14, stiffness: 120, mass: 0.8 }, from: 60, to: 0 });

          const rotateX = i < 2 ? -4 : 4;
          const rotateY = i % 2 === 0 ? -3 : 3;

          return (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                padding: '36px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transform: `scale(${scale}) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                opacity,
                boxShadow: '0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <div style={{
                fontSize: 26,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.03em',
              }}>
                {card.title}
              </div>
              <div style={{
                fontSize: 52,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1,
              }}>
                {card.value ?? '—'}
              </div>
              <div style={{
                height: 3,
                background: `linear-gradient(90deg, ${accentColor}, transparent)`,
                borderRadius: 2,
                marginTop: 8,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
