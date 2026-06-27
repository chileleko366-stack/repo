import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Column {
  heading?: string;
  body?: string;
  color?: string;
}

interface Props {
  columns?: Column[];
  accentColor?: string;
  backgroundColor?: string;
}

const DEFAULT_COLS: Column[] = [
  { heading: 'BEFORE', body: 'Scientists thought memory was fixed after age 25.', color: '#ff4444' },
  { heading: 'AFTER', body: 'Neuroplasticity proves the brain rewires at any age.', color: '#00ff88' },
];

export const LayoutMultiColumn: React.FC<Props> = ({
  columns = DEFAULT_COLS,
  accentColor = '#0097a7',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ display: 'flex', gap: 24, width: '100%' }}>
        {columns.map((col, i) => {
          const delay = i * 12;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_GENTLE });
          const y = interpolate(progress, [0, 1], [40, 0]);
          const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);
          const color = col.color ?? accentColor;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                background: `${color}11`,
                border: `2px solid ${color}44`,
                borderRadius: 20,
                padding: 36,
                transform: `translateY(${y}px)`,
                opacity,
              }}
            >
              <div style={{ fontSize: 24, fontFamily: 'Space Grotesk, sans-serif', color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 20 }}>
                {col.heading}
              </div>
              <div style={{ fontSize: 28, fontFamily: 'Space Grotesk, sans-serif', color: '#ffffff', lineHeight: 1.5 }}>
                {col.body}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
