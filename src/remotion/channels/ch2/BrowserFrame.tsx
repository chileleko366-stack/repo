/**
 * BrowserFrame — browser chrome bar at the top of the frame.
 * Spring slide-down entrance. Shows a 'LIVE' URL bar.
 * Used on hook and context beats for the FinanceFiction channel.
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const BrowserFrame: React.FC<{
  url?: string;
}> = ({ url = 'breaking-finance.com/live' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 180, mass: 1 },
    durationInFrames: 22,
  });
  const translateY = interpolate(enter, [0, 1], [-72, 0]);
  const opacity = enter;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 76,
        background: 'rgba(10,14,26,0.96)',
        borderBottom: '1px solid rgba(0,255,136,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 24px',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
        <div
          key={i}
          style={{ width: 14, height: 14, borderRadius: '50%', background: c, flexShrink: 0 }}
        />
      ))}
      <div
        style={{
          flex: 1,
          height: 36,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 21,
          color: 'rgba(0,255,136,0.85)',
          letterSpacing: '0.02em',
        }}
      >
        🔴 LIVE · {url}
      </div>
    </div>
  );
};
