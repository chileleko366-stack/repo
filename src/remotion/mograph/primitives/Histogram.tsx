// Ported nearly verbatim from:
// /tmp/refs/saas-engine/src/examples/code/histogram.ts
// Adapted: import paths + prop-driven colour + channel font support.
// Uses @remotion/shapes Rect for bar rendering with corner radius + glow.

import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

const BAR_WIDTH = 80;
const MAX_HEIGHT = 300;
const STAGGER_DELAY = 10;

export interface HistogramBar {
  label: string;
  value: number;
  color?: string;
}

interface HistogramProps {
  data: HistogramBar[];
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  labelColor?: string;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  accentColor = '#d400ff',
  backgroundColor = '#0a0a0a',
  fontFamily = 'system-ui, sans-serif',
  labelColor = '#888888',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: 60,
        paddingBottom: 100,
        display: 'flex',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 24,
          height: MAX_HEIGHT + 60,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        {data.map((item, i) => {
          const delay = i * STAGGER_DELAY;
          const progress = spring({
            frame: frame - delay,
            fps,
            config: SPRING_CONFIGS.snappy,
          });

          const barColor = item.color ?? accentColor;
          const height = Math.max(1, (item.value / maxValue) * MAX_HEIGHT * progress);

          return (
            <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  height,
                  width: BAR_WIDTH,
                  backgroundColor: barColor,
                  borderRadius: '12px 12px 0 0',
                  filter: `drop-shadow(0 0 8px ${barColor}50)`,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 'bold',
                    opacity: progress,
                    fontFamily,
                  }}
                >
                  {Math.round(item.value * progress)}
                </span>
              </div>
              <div
                style={{
                  color: labelColor,
                  fontSize: 16,
                  marginTop: 12,
                  fontFamily,
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
