import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; keywords?: string[]; }

export const OrbitalHub: React.FC<Props> = ({ accentColor, backgroundColor, keywords = ['Speed', 'Scale', 'Trust', 'Value'] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 22, stiffness: 200 } });
  const scale = interpolate(s, [0, 1], [0, 1]);

  const speeds = [0.04, 0.025, 0.055];
  const offsets = [0, 2.1, 4.2];
  const radius = 280;
  const satellites = keywords.slice(0, 3);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transform: `scale(${scale})`,
    }}>
      <div style={{ position: 'relative', width: 700, height: 700 }}>
        {/* SVG dashed orbit lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {satellites.map((_, i) => {
            const x = 350 + Math.cos(frame * speeds[i] + offsets[i]) * radius;
            const y = 350 + Math.sin(frame * speeds[i] + offsets[i]) * radius * 0.55;
            return (
              <g key={i} opacity={interpolate(frame, [i * 10, i * 10 + 20], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' })}>
                <line x1={350} y1={350} x2={x} y2={y} stroke={accentColor} strokeWidth={2} strokeDasharray="8 6" opacity={0.4} />
              </g>
            );
          })}
        </svg>

        {/* Centre */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 120, height: 120,
          borderRadius: '50%',
          background: accentColor,
          boxShadow: `0 0 40px ${accentColor}88`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: '#fff', fontWeight: 700,
        }}>HUB</div>

        {/* Satellites */}
        {satellites.map((kw, i) => {
          const delay = i * 10;
          const ss = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 22, stiffness: 200 } });
          const x = 350 + Math.cos(frame * speeds[i] + offsets[i]) * radius;
          const y = 350 + Math.sin(frame * speeds[i] + offsets[i]) * radius * 0.55;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                width: 64, height: 64,
                borderRadius: '50%',
                background: `${accentColor}66`,
                boxShadow: `0 0 20px ${accentColor}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#fff',
                opacity: interpolate(ss, [0, 1], [0, 1]),
              }}
            >
              {kw.slice(0, 3)}
            </div>
          );
        })}
      </div>
    </div>
  );
};
