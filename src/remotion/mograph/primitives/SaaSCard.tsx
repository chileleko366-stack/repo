import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  accentColor: string;
  backgroundColor: string;
  bodyFont?: string;
  title?: string;
  body?: string;
  iconChar?: string;
}

export const SaaSCard: React.FC<Props> = ({
  accentColor,
  backgroundColor,
  bodyFont = 'sans-serif',
  title = 'Feature',
  body = 'Powerful and fast',
  iconChar = '✦',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 20, stiffness: 180 } });
  const translateY = interpolate(s, [0, 1], [120, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 900,
        height: 400,
        borderRadius: 32,
        background: backgroundColor || '#111118',
        boxShadow: `0 0 0 2px ${accentColor}, inset 0 0 0 1px rgba(255,255,255,0.08)`,
        padding: '48px 52px',
        boxSizing: 'border-box',
        transform: `translateY(${translateY}px)`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{
          width: 80, height: 80,
          borderRadius: 20,
          background: `${accentColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40,
        }}>
          {iconChar}
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: accentColor, fontFamily: bodyFont }}>{title}</div>
        <div style={{ fontSize: 36, color: 'rgba(255,255,255,0.6)', fontFamily: bodyFont }}>{body}</div>
      </div>
    </div>
  );
};
