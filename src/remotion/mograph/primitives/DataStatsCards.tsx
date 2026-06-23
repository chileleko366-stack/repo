import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface StatCard { value: string; label: string; color?: string; }

export const DataStatsCards: React.FC<{
  stats: StatCard[];
  backgroundColor?: string;
  accentColor?: string;
}> = ({
  stats,
  backgroundColor = '#0a0a0a',
  accentColor = '#d400ff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = stats.slice(0, 4);
  const cols = items.length <= 2 ? 1 : 2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 32, width: '100%' }}>
        {items.map((stat, i) => {
          const delay = i * 8;
          const p = spring({ frame: frame - delay, fps, config: { damping: 28, stiffness: 280 }, durationInFrames: 35 });
          const scale = interpolate(p, [0, 1], [0.8, 1]);
          const opacity = interpolate(p, [0, 0.4, 1], [0, 1, 1]);
          const col = stat.color || accentColor;

          return (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${col}44`,
                borderRadius: 20,
                padding: '36px 32px',
                textAlign: 'center',
                transform: `scale(${scale})`,
                opacity,
                boxShadow: `0 0 40px ${col}22`,
              }}
            >
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 72, fontWeight: 700, color: col, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 34, color: 'rgba(255,255,255,0.7)', marginTop: 12, lineHeight: 1.3 }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
