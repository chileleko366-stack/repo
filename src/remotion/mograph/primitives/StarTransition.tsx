import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface StarTransitionProps {
  accentColor?: string;
  backgroundColor?: string;
  rayCount?: number;
}

const CX = 540;
const CY = 960;

export const StarTransition: React.FC<StarTransitionProps> = ({
  accentColor = '#f59e0b',
  backgroundColor = '#0f0f1a',
  rayCount = 12,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = durationInFrames > 0 ? frame / durationInFrames : 0;
  const maxR = Math.hypot(CX, CY) * 1.1;

  // Centre burst pulse
  const burstR = interpolate(progress, [0, 0.25, 0.5], [0, 130, 0], { extrapolateRight: 'clamp' });
  const burstOpacity = interpolate(progress, [0, 0.1, 0.4], [0, 1, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor }}>
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        {/* Radial rays */}
        {Array.from({ length: rayCount }, (_, i) => {
          const angle = (i / rayCount) * Math.PI * 2;
          const delay = (i / rayCount) * 0.35;
          const p = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
          const r = interpolate(p, [0, 1], [0, maxR]);
          const tipX = CX + Math.cos(angle) * r;
          const tipY = CY + Math.sin(angle) * r;
          const rayOpacity = interpolate(p, [0, 0.08, 0.75, 1], [0, 1, 1, 0]);

          return (
            <g key={i} opacity={rayOpacity}>
              <line
                x1={CX}
                y1={CY}
                x2={tipX}
                y2={tipY}
                stroke={accentColor}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <circle cx={tipX} cy={tipY} r={7} fill={accentColor} />
            </g>
          );
        })}

        {/* Centre burst */}
        <circle cx={CX} cy={CY} r={burstR} fill={accentColor} opacity={burstOpacity} />

        {/* Atmospheric glow ring */}
        <circle
          cx={CX}
          cy={CY}
          r={interpolate(progress, [0, 0.5], [0, 260], { extrapolateRight: 'clamp' })}
          fill="none"
          stroke={accentColor}
          strokeWidth={1}
          opacity={interpolate(progress, [0, 0.15, 0.6], [0, 0.4, 0], { extrapolateRight: 'clamp' })}
        />
      </svg>
    </div>
  );
};
