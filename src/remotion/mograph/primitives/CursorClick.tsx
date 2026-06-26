import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props { accentColor: string; targetX?: number; targetY?: number; }

export const CursorClick: React.FC<Props> = ({ accentColor, targetX = 80, targetY = -60 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: arrive (0–30)
  const arriveS = spring({ frame, fps, config: { damping: 18, stiffness: 200 } });
  const arrX = interpolate(arriveS, [0, 1], [200 + targetX, targetX]);
  const arrY = interpolate(arriveS, [0, 1], [600 + targetY, targetY]);

  // Phase 2: press (30–40) / release (40–50)
  const pressScale = interpolate(frame, [30, 40], [1.0, 0.82], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const releaseS = spring({ frame: Math.max(0, frame - 40), fps, config: { damping: 14, stiffness: 400 } });
  const releaseScale = interpolate(releaseS, [0, 1], [0.82, 1.0]);
  const cursorScale = frame < 40 ? pressScale : releaseScale;

  // Phase 4: exit (50–70)
  const exitX = interpolate(frame, [50, 70], [0, -300], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitY = interpolate(frame, [50, 70], [0, 400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const exitOpacity = interpolate(frame, [55, 70], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const cx = arrX + exitX;
  const cy = arrY + exitY;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        transform: `translate(${cx}px, ${cy}px) scale(${cursorScale})`,
        opacity: exitOpacity,
        transformOrigin: 'top left',
      }}>
        <svg width="48" height="56" viewBox="0 0 48 56" fill="none">
          <path d="M4 4L4 44L16 32L24 48L30 45L22 29L40 29L4 4Z" fill="white" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};
