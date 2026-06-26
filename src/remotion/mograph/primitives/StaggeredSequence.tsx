import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface StaggeredSequenceProps {
  accentColor?: string;
  backgroundColor?: string;
}

const ITEMS = ['Step 01', 'Step 02', 'Step 03', 'Step 04', 'Step 05'];

export const StaggeredSequence: React.FC<StaggeredSequenceProps> = ({
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: backgroundColor, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 100, flexDirection: 'column', gap: 40 }}>
      {ITEMS.map((item, i) => {
        const delay = i * 8;
        const opacity = interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: 'clamp' });
        const translateX = interpolate(frame, [delay, delay + 16], [-50, 0], { extrapolateRight: 'clamp' });
        const isActive = frame > delay + 8;
        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateX(${translateX}px)`,
              display: 'flex',
              alignItems: 'center',
              gap: 28,
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: isActive ? accentColor : 'transparent',
              border: `2px solid ${accentColor}`,
              flexShrink: 0,
              transition: 'background 0.2s',
            }} />
            <div style={{
              fontFamily: 'monospace',
              fontSize: 52,
              fontWeight: 700,
              color: isActive ? '#ffffff' : `rgba(255,255,255,0.4)`,
              letterSpacing: '0.06em',
            }}>
              {item}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
