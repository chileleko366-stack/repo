import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

interface Avatar {
  initial?: string;
  color?: string;
}

interface Props {
  avatars?: Avatar[];
  orbitRadius?: number;
  rotationSpeed?: number;
  centreLabel?: string;
  accentColor?: string;
}

const DEFAULT_AVATARS: Avatar[] = [
  { initial: 'A', color: '#d400ff' },
  { initial: 'B', color: '#00f0ff' },
  { initial: 'C', color: '#ff6b35' },
  { initial: 'D', color: '#00ff88' },
];

export const AvatarOrbit: React.FC<Props> = ({
  avatars = DEFAULT_AVATARS,
  orbitRadius = 280,
  rotationSpeed = 0.3,
  centreLabel = 'YOU',
  accentColor = '#d400ff',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cx = 540, cy = 960;

  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        {/* Orbit ring */}
        <circle cx={cx} cy={cy} r={orbitRadius} fill="none" stroke={`${accentColor}22`} strokeWidth="1" strokeDasharray="8 8" />

        {/* Centre */}
        <circle cx={cx} cy={cy} r={60} fill={`${accentColor}33`} stroke={accentColor} strokeWidth="2" />
        <text x={cx} y={cy + 12} textAnchor="middle" fill={accentColor} fontSize="32" fontFamily="Anton, sans-serif" fontWeight="900">
          {centreLabel}
        </text>

        {/* Avatars */}
        {avatars.map((av, i) => {
          const baseAngle = (i / avatars.length) * Math.PI * 2;
          const angle = baseAngle + t * rotationSpeed;
          const x = cx + orbitRadius * Math.cos(angle);
          const y = cy + orbitRadius * Math.sin(angle);
          // Counter-rotate badge to stay upright
          const counterDeg = -(angle * 180) / Math.PI;

          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <circle r="40" fill={av.color ?? accentColor} opacity={0.9} />
              <text
                textAnchor="middle"
                y="12"
                fill="#ffffff"
                fontSize="28"
                fontFamily="Anton, sans-serif"
                transform={`rotate(${counterDeg})`}
              >
                {av.initial}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
