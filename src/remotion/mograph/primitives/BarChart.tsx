import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Bar {
  label?: string;
  value?: number;
  color?: string;
}

interface Props {
  bars?: Bar[];
  accentColor?: string;
  backgroundColor?: string;
  maxValue?: number;
}

const DEFAULT_BARS: Bar[] = [
  { label: 'A', value: 80, color: '#d400ff' },
  { label: 'B', value: 55, color: '#00f0ff' },
  { label: 'C', value: 92, color: '#00ff88' },
  { label: 'D', value: 40, color: '#ff6b35' },
];

export const BarChart: React.FC<Props> = ({
  bars = DEFAULT_BARS,
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
  maxValue = 100,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxH = 600;

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, height: maxH + 60 }}>
        {bars.map((bar, i) => {
          const delay = i * 6;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_GENTLE });
          const h = interpolate(progress, [0, 1], [0, (bar.value ?? 0) / maxValue * maxH]);
          const color = bar.color ?? accentColor;

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 100,
                  height: h,
                  background: `linear-gradient(to top, ${color}, ${color}88)`,
                  borderRadius: '8px 8px 0 0',
                  boxShadow: `0 0 20px ${color}44`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 8,
                }}
              >
                <span style={{ fontSize: 18, fontFamily: 'JetBrains Mono, monospace', color: '#ffffff', fontWeight: 700 }}>
                  {bar.value}
                </span>
              </div>
              <span style={{ fontSize: 22, fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(255,255,255,0.7)' }}>
                {bar.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
