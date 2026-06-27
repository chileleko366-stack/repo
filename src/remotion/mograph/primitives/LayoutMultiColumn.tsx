import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface ColumnData { title: string; body: string; }

export const LayoutMultiColumn: React.FC<{
  columns: ColumnData[];
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}> = ({
  columns,
  accentColor = '#d400ff',
  backgroundColor = '#0a0a0a',
  fontFamily = "'Space Grotesk', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cols = Math.min(columns.length, 3);

  return (
    <AbsoluteFill style={{ backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 60px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 40, width: '100%' }}>
        {columns.slice(0, 3).map((col, i) => {
          const delay = i * 12;
          const p = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 280 }, durationInFrames: 38 });
          const ty = interpolate(p, [0, 1], [50, 0]);
          const opacity = interpolate(p, [0, 0.4, 1], [0, 1, 1]);

          return (
            <div
              key={i}
              style={{
                transform: `translateY(${ty}px)`,
                opacity,
                background: 'rgba(255,255,255,0.04)',
                borderTop: `3px solid ${accentColor}`,
                borderRadius: '0 0 16px 16px',
                padding: '32px 28px',
              }}
            >
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 44, fontWeight: 700, color: accentColor, marginBottom: 16, letterSpacing: '-0.01em' }}>
                {col.title}
              </div>
              <div style={{ fontFamily, fontSize: 34, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>
                {col.body}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
