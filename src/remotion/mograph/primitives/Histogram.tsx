import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface HistogramProps {
  accentColor?: string;
  backgroundColor?: string;
}

const BARS = [0.3, 0.55, 0.85, 0.7, 0.95, 0.6, 0.4, 0.75, 0.5, 0.9];

export const Histogram: React.FC<HistogramProps> = ({
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, 40], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: backgroundColor, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 160, flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 500 }}>
        {BARS.map((h, i) => {
          const barH = h * 500 * progress;
          return (
            <div
              key={i}
              style={{
                width: 68,
                height: barH,
                background: `linear-gradient(to top, ${accentColor}, ${accentColor}66)`,
                borderRadius: '4px 4px 0 0',
                opacity: 0.7 + h * 0.3,
              }}
            />
          );
        })}
      </div>
      <div style={{ height: 2, width: 820, background: `${accentColor}44`, marginTop: 0 }} />
    </AbsoluteFill>
  );
};
