import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; bodyFont?: string; keyword?: string; }

export const ExpandingBox: React.FC<Props> = ({ accentColor, backgroundColor, bodyFont = 'sans-serif', keyword = '' }) => {
  const frame = useCurrentFrame();

  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const t = Math.min(frame / 60, 1);
  const height = 80 + easeOut(t) * 280;
  const charCount = Math.floor(frame / 3);
  const text = keyword.slice(0, charCount);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      paddingBottom: 200,
    }}>
      <div style={{
        width: 760,
        height,
        borderRadius: 20,
        border: `2px solid rgba(255,255,255,0.25)`,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '24px 32px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div style={{
          fontFamily: bodyFont,
          fontSize: 40,
          color: '#fff',
          lineHeight: 1.4,
          opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          {text}
          {frame % 20 < 10 && <span style={{ color: accentColor }}>|</span>}
        </div>
        <div style={{
          position: 'absolute', bottom: 20, left: 32,
          display: 'flex', gap: 12,
          opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          {['📎', '✏️', '🔮', '✦'].map((icon, i) => (
            <div key={i} style={{
              width: 48, height: 48,
              borderRadius: 10,
              background: `rgba(255,255,255,0.1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
              transform: `translateY(${interpolate(Math.max(0, frame - 40 - i * 5), [0, 20], [16, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>{icon}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
