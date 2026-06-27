import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface Props {
  title?: string;
  keywords?: string[];
  accentColor?: string;
  backgroundColor?: string;
  orbitRadius?: number;
  rotationSpeed?: number;
}

export const OrbitalHub: React.FC<Props> = ({
  title = 'DOPAMINE',
  keywords = ['Reward', 'Craving', 'Loop', 'Habit'],
  accentColor = '#d400ff',
  backgroundColor = 'transparent',
  orbitRadius = 280,
  rotationSpeed = 0.4,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cx = 540;
  const cy = 960;
  const progress = spring({ frame, fps, config: SPRING_GENTLE });
  const scale = interpolate(progress, [0, 1], [0.5, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {/* Orbit ring */}
        <ellipse cx={cx} cy={cy} rx={orbitRadius} ry={orbitRadius * 0.45} fill="none" stroke={`${accentColor}33`} strokeWidth="1.5" />
        {/* Centre label */}
        <text x={cx} y={cy + 16} textAnchor="middle" fill={accentColor} fontSize="52" fontFamily="Anton, sans-serif" fontWeight="900" letterSpacing="4">
          {title}
        </text>
        {/* Orbiting dots + labels */}
        {keywords.map((kw, i) => {
          const baseAngle = (i / keywords.length) * Math.PI * 2;
          const angle = baseAngle + t * rotationSpeed;
          const x = cx + orbitRadius * Math.cos(angle);
          const y = cy + orbitRadius * 0.45 * Math.sin(angle);
          const facingOpacity = 0.5 + 0.5 * Math.cos(angle);

          return (
            <g key={i} opacity={Math.max(0.2, facingOpacity)}>
              <circle cx={x} cy={y} r={14} fill={accentColor} />
              <text x={x} y={y + 42} textAnchor="middle" fill="#ffffff" fontSize="22" fontFamily="Space Grotesk, sans-serif">
                {kw}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
