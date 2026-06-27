import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface StatCard {
  label?: string;
  value?: string;
  color?: string;
}

interface Props {
  stats?: StatCard[];
  accentColor?: string;
  backgroundColor?: string;
}

const DEFAULT_STATS: StatCard[] = [
  { label: 'Revenue', value: '$4.2B', color: '#00ff88' },
  { label: 'Users', value: '2.1M', color: '#d400ff' },
  { label: 'Growth', value: '+340%', color: '#ff6b35' },
  { label: 'Markets', value: '47', color: '#00f0ff' },
];

export const DataStatsCards: React.FC<Props> = ({
  stats = DEFAULT_STATS,
  accentColor = '#00ff88',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%' }}>
        {stats.map((stat, i) => {
          const delay = i * 8;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_GENTLE });
          const scale = interpolate(progress, [0, 1], [0.8, 1]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 0, 1]);
          const color = stat.color ?? accentColor;

          return (
            <div
              key={i}
              style={{
                background: `${color}11`,
                border: `1px solid ${color}33`,
                borderRadius: 20,
                padding: '32px 24px',
                transform: `scale(${scale})`,
                opacity,
              }}
            >
              <div style={{ fontSize: 18, fontFamily: 'Space Grotesk, sans-serif', color: `${color}99`, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 52, fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color, lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
