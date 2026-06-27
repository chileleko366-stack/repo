import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from '../mograph/primitives/SpringConfigs';

interface Props {
  fromLabel?: string;
  toLabel?: string;
  distanceKm?: number;
  accentColor?: string;
}

function formatDistance(km: number): string {
  if (km >= 1_000_000_000) return `${(km / 1_000_000_000).toFixed(1)}B km`;
  if (km >= 1_000_000) return `${(km / 1_000_000).toFixed(1)}M km`;
  if (km >= 1_000) return `${(km / 1_000).toFixed(0)}K km`;
  return `${km} km`;
}

export const DistanceMap: React.FC<Props> = ({
  fromLabel = 'Earth',
  toLabel = 'Moon',
  distanceKm = 384_400,
  accentColor = '#00d4ff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE, durationInFrames: 60 });
  const lineWidth = interpolate(progress, [0, 1], [0, 800]);
  const dotScale = interpolate(progress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 60 }}>
      <svg width="900" height="200" viewBox="0 0 900 200">
        {/* Line */}
        <line x1="80" y1="100" x2={80 + lineWidth} y2="100" stroke={accentColor} strokeWidth="2" strokeDasharray="8 6" opacity={0.6} />
        {/* From dot */}
        <circle cx="80" cy="100" r={20 * dotScale} fill={accentColor} opacity={0.9} />
        <text x="80" y="155" textAnchor="middle" fill="#ffffff" fontSize="22" fontFamily="Space Grotesk, sans-serif">{fromLabel}</text>
        {/* To dot */}
        <circle cx="820" cy="100" r={20 * dotScale} fill={accentColor} opacity={0.9} />
        <text x="820" y="155" textAnchor="middle" fill="#ffffff" fontSize="22" fontFamily="Space Grotesk, sans-serif">{toLabel}</text>
      </svg>
      <div style={{ fontSize: 72, fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, color: accentColor, textShadow: `0 0 40px ${accentColor}66` }}>
        {formatDistance(distanceKm)}
      </div>
    </AbsoluteFill>
  );
};
