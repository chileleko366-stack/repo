// Ported from:
// /tmp/refs/saas-engine/src/skills/charts.md — bar chart section with staggered springs + y-axis labels
// /tmp/refs/saas-engine/src/examples/code/histogram.ts — stagger/spring reference implementation

import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

const STAGGER_DELAY = 10;
const MAX_BAR_HEIGHT = 480;
const BAR_WIDTH = 120;

export interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  accentColor?: string;
  labelColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  title?: string;
}

const Y_AXIS_STEPS = [0, 25, 50, 75, 100];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  accentColor = '#d400ff',
  labelColor = '#ffffff',
  backgroundColor = 'transparent',
  fontFamily = "'Space Grotesk', sans-serif",
  title,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
      }}
    >
      {title && (
        <div
          style={{
            color: labelColor,
            fontSize: 36,
            fontFamily,
            fontWeight: 700,
            marginBottom: 32,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        {/* Y-axis */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: MAX_BAR_HEIGHT,
            marginRight: 12,
          }}
        >
          {[...Y_AXIS_STEPS].reverse().map((step) => (
            <span
              key={step}
              style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.4)',
                fontFamily,
                lineHeight: 1,
              }}
            >
              {step}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 20,
            height: MAX_BAR_HEIGHT,
            borderLeft: '1px solid rgba(255,255,255,0.15)',
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
            const normalizedHeight = (item.value / maxValue) * MAX_BAR_HEIGHT;
            const height = Math.max(1, normalizedHeight * progress);

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  style={{
                    position: 'relative',
                    width: BAR_WIDTH,
                    height,
                    backgroundColor: barColor,
                    borderRadius: '10px 10px 0 0',
                    filter: `drop-shadow(0 0 12px ${barColor}60)`,
                  }}
                >
                  {height > 40 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#fff',
                        fontSize: 22,
                        fontWeight: 700,
                        fontFamily,
                        opacity: progress,
                      }}
                    >
                      {Math.round(item.value * progress).toLocaleString()}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    color: labelColor,
                    fontSize: 22,
                    marginTop: 10,
                    fontFamily,
                    opacity: 0.8,
                    textAlign: 'center',
                    maxWidth: BAR_WIDTH + 20,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
