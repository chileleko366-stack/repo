import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Flag { emoji: string; label: string; }
interface Props { accentColor: string; bodyFont?: string; flags?: Flag[]; }

const DEFAULT_FLAGS: Flag[] = [
  { emoji: '🇺🇸', label: 'United States' },
  { emoji: '🇬🇧', label: 'United Kingdom' },
  { emoji: '🇩🇪', label: 'Germany' },
  { emoji: '🇯🇵', label: 'Japan' },
  { emoji: '🇧🇷', label: 'Brazil' },
];

export const UIFlagChip: React.FC<Props> = ({ accentColor, bodyFont = 'sans-serif', flags = DEFAULT_FLAGS }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 24,
    }}>
      {flags.map((flag, i) => {
        const delay = i * 6;
        const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 22, stiffness: 260 } });
        const scale = interpolate(s, [0, 1], [0, 1]);
        const ty = interpolate(s, [0, 1], [30, 0]);

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              borderRadius: 40,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '12px 28px',
              transform: `scale(${scale}) translateY(${ty}px)`,
              opacity: scale,
            }}
          >
            <span style={{ fontSize: 36 }}>{flag.emoji}</span>
            <span style={{ fontFamily: bodyFont, fontSize: 28, color: '#fff', letterSpacing: '0.02em' }}>{flag.label}</span>
          </div>
        );
      })}
    </div>
  );
};
