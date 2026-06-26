import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; bodyFont?: string; }

const PLACEHOLDER = 'Search anything...';

export const UISearchBar: React.FC<Props> = ({ accentColor, backgroundColor, bodyFont = 'sans-serif' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame, fps, config: { damping: 26, stiffness: 280 } });
  const translateY = interpolate(s, [0, 1], [80, 0]);
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  const charCount = Math.floor(frame / 4);
  const displayText = PLACEHOLDER.slice(0, charCount);
  const showCursor = frame % 20 < 10;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: 860,
        height: 100,
        borderRadius: 60,
        border: '2px solid rgba(255,255,255,0.22)',
        backgroundColor: 'rgba(255,255,255,0.07)',
        padding: '0 20px 0 36px',
        gap: 16,
        transform: `translateY(${translateY}px)`,
        opacity,
        backdropFilter: 'blur(12px)',
      }}>
        <span style={{
          flex: 1,
          fontFamily: bodyFont,
          fontSize: 36,
          color: 'rgba(255,255,255,0.75)',
          letterSpacing: '0.01em',
        }}>
          {displayText}
          {showCursor && <span style={{ opacity: 1 }}>|</span>}
        </span>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${accentColor}, #7700cc)`,
          boxShadow: `0 4px 16px rgba(0,0,0,0.4)`,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          color: '#fff',
        }}>
          ⌕
        </div>
      </div>
    </div>
  );
};
