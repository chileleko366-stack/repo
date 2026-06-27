import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface RankItem {
  label?: string;
  value?: number | string;
  color?: string;
}

interface Props {
  items?: RankItem[];
  accentColor?: string;
  backgroundColor?: string;
}

const DEFAULT_ITEMS: RankItem[] = [
  { label: 'Elon Musk', value: '$232B', color: '#d400ff' },
  { label: 'Jeff Bezos', value: '$167B', color: '#00f0ff' },
  { label: 'Mark Zuckerberg', value: '$142B', color: '#00ff88' },
  { label: 'Warren Buffett', value: '$118B', color: '#ff6b35' },
];

export const DataRanking: React.FC<Props> = ({
  items = DEFAULT_ITEMS,
  accentColor = '#00ff88',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {items.map((item, i) => {
          const delay = i * 8;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_GENTLE });
          const x = interpolate(progress, [0, 1], [-200, 0]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 0, 1]);
          const color = item.color ?? accentColor;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                transform: `translateX(${x}px)`,
                opacity,
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: '#000', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, fontSize: 28, fontFamily: 'Space Grotesk, sans-serif', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 32, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color, flexShrink: 0 }}>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
