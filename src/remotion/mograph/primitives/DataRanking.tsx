import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface RankItem { label: string; value: number; color?: string; }

export const DataRanking: React.FC<{
  items: RankItem[];
  title?: string;
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  items,
  title = '',
  accentColor = '#d400ff',
  backgroundColor = '#0a0a0a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxVal = Math.max(...items.map(i => i.value), 1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
      }}
    >
      {title && (
        <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 52, color: accentColor, marginBottom: 32 }}>
          {title}
        </div>
      )}
      {items.slice(0, 5).map((item, i) => {
        const delay = i * 8;
        const p = spring({ frame: frame - delay, fps, config: { damping: 32, stiffness: 300 }, durationInFrames: 40 });
        const barW = interpolate(p, [0, 1], [0, (item.value / maxVal) * 100]);
        const opacity = interpolate(p, [0, 0.3, 1], [0, 1, 1]);
        const col = item.color || accentColor;

        return (
          <div key={i} style={{ marginBottom: 20, opacity }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, color: '#ffffff', marginBottom: 8 }}>
              <span>{i + 1}. {item.label}</span>
              <span style={{ color: col }}>{item.value}</span>
            </div>
            <div style={{ height: 16, background: `${col}22`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${barW}%`, background: col, borderRadius: 8 }} />
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
