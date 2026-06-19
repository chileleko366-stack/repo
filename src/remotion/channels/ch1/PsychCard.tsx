/**
 * PsychCard — ch1 visual for stat and none-kind beats.
 *
 * Renders the emphasis keyword in large Anton text inside a glassmorphism card.
 * For stat beats, shows a Counter instead of the keyword text.
 * Spring pop-in entrance. Cyan underline grows in via interpolate.
 * All animation is a pure function of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Counter } from '../../morph/Counter';

export const PsychCard: React.FC<{
  keyword: string;
  kind: string;
  statValue?: number;
  statPrefix?: string;
  statSuffix?: string;
}> = ({ keyword, kind, statValue, statPrefix = '', statSuffix = '' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 220, mass: 0.8 },
    durationInFrames: 20,
  });

  const scale    = interpolate(enter, [0, 1], [0.84, 1.0]);
  const opacity  = enter;

  // Cyan underline slides in
  const lineW = interpolate(frame, [10, 32], [0, 300], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isLong = keyword.length > 12;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        width: 960,
        minHeight: 420,
        borderRadius: 32,
        background: 'rgba(22,18,31,0.84)',
        border: '2px solid rgba(212,0,255,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        gap: 28,
        boxShadow:
          '0 0 80px rgba(212,0,255,0.18), inset 0 0 40px rgba(0,240,255,0.04)',
      }}
    >
      {/* Radial glow behind the card */}
      <div
        style={{
          position: 'absolute',
          inset: -80,
          borderRadius: 100,
          background:
            'radial-gradient(ellipse at center, rgba(212,0,255,0.10) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />

      {kind === 'stat' && statValue !== undefined ? (
        <Counter
          to={statValue}
          durationFrames={54}
          delayFrames={54}
          prefix={statPrefix}
          suffix={statSuffix}
          fontSize={144}
          color="#d400ff"
          fontFamily="'Anton', sans-serif"
        />
      ) : (
        <span
          style={{
            fontFamily: "'Anton', sans-serif",
            fontSize: isLong ? 78 : 110,
            color: '#d400ff',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.02em',
            textAlign: 'center' as const,
            lineHeight: 1.1,
            textShadow: '0 0 60px rgba(212,0,255,0.5)',
          }}
        >
          {keyword}
        </span>
      )}

      {/* Cyan accent underline */}
      <div
        style={{
          width: lineW,
          height: 3,
          background:
            'linear-gradient(to right, transparent, #00f0ff, transparent)',
          borderRadius: 2,
        }}
      />
    </div>
  );
};
