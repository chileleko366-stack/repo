import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface TimelineEvent { year: string | number; label: string; }

export const DataTimeline: React.FC<{
  events: TimelineEvent[];
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  events,
  accentColor = '#d400ff',
  backgroundColor = '#0a0a0a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 100px',
      }}
    >
      {events.slice(0, 4).map((event, i) => {
        const delay = i * 10;
        const p = spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 260 }, durationInFrames: 35 });
        const tx = interpolate(p, [0, 1], [-60, 0]);
        const opacity = interpolate(p, [0, 0.4, 1], [0, 1, 1]);

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, transform: `translateX(${tx}px)`, opacity }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 20 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: accentColor, boxShadow: `0 0 16px ${accentColor}88`, flexShrink: 0, marginTop: 8 }} />
              {i < events.length - 1 && <div style={{ width: 2, height: 60, background: `${accentColor}44`, marginTop: 4 }} />}
            </div>
            <div style={{ paddingBottom: 44 }}>
              <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 40, color: accentColor, letterSpacing: '0.04em' }}>
                {event.year}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3, marginTop: 4 }}>
                {event.label}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
