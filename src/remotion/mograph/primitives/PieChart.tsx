// Ported from:
// /tmp/refs/saas-engine/src/skills/charts.md — "Pie Chart Animation" with strokeDashoffset
// Uses SVG stroke-dashoffset animation starting from 12 o'clock, as specified in the skill.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

const STAGGER_DELAY = 12;
const CHART_SIZE = 480;
const CENTER = CHART_SIZE / 2;
const STROKE_WIDTH = 64;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  backgroundColor?: string;
  fontFamily?: string;
  title?: string;
  labelColor?: string;
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  backgroundColor = 'transparent',
  fontFamily = "'Space Grotesk', sans-serif",
  title,
  labelColor = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const circumference = 2 * Math.PI * RADIUS;

  let cumulativeOffset = 0;
  const slices = data.map((item, i) => {
    const fraction = item.value / total;
    const segmentLength = fraction * circumference;
    const startOffset = cumulativeOffset;
    cumulativeOffset += fraction;

    const delay = i * STAGGER_DELAY;
    const progress = spring({
      frame: frame - delay,
      fps,
      config: SPRING_CONFIGS.snappy,
    });

    const dashOffset = interpolate(progress, [0, 1], [segmentLength, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    return { item, segmentLength, startOffset, dashOffset, progress };
  });

  const legendProgress = spring({ frame: frame - 20, fps, config: SPRING_CONFIGS.smooth });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: 60,
      }}
    >
      {title && (
        <div style={{ color: labelColor, fontSize: 36, fontFamily, fontWeight: 700 }}>{title}</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
        <svg width={CHART_SIZE} height={CHART_SIZE}>
          {slices.map(({ item, segmentLength, startOffset, dashOffset }, i) => (
            <circle
              key={i}
              r={RADIUS}
              cx={CENTER}
              cy={CENTER}
              fill="none"
              stroke={item.color}
              strokeWidth={STROKE_WIDTH}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(${-90 + startOffset * 360} ${CENTER} ${CENTER})`}
              style={{ filter: `drop-shadow(0 0 8px ${item.color}50)` }}
            />
          ))}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: legendProgress,
                transform: `translateX(${interpolate(legendProgress, [0, 1], [20, 0])}px)`,
                transition: 'none',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: item.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: labelColor, fontSize: 26, fontFamily }}>
                {item.label} — {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
