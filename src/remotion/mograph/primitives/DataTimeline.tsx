import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from './SpringConfigs';

interface TimelineEvent {
  year?: string;
  label?: string;
  color?: string;
}

interface Props {
  events?: TimelineEvent[];
  accentColor?: string;
  backgroundColor?: string;
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  { year: '1969', label: 'Moon Landing', color: '#ff4500' },
  { year: '1981', label: 'Space Shuttle', color: '#00d4ff' },
  { year: '1990', label: 'Hubble Launch', color: '#ff4500' },
  { year: '2003', label: 'Mars Rover', color: '#00d4ff' },
  { year: '2021', label: 'James Webb', color: '#ff4500' },
];

export const DataTimeline: React.FC<Props> = ({
  events = DEFAULT_EVENTS,
  accentColor = '#ff4500',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', padding: '60px 80px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>
        {events.map((ev, i) => {
          const delay = i * 10;
          const progress = spring({ frame: frame - delay, fps, config: SPRING_GENTLE });
          const x = interpolate(progress, [0, 1], [-120, 0]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 0, 1]);
          const color = ev.color ?? accentColor;

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch', transform: `translateX(${x}px)`, opacity }}>
              {/* Timeline line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0, marginRight: 24 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 8 }} />
                {i < events.length - 1 && (
                  <div style={{ flex: 1, width: 2, background: `${color}44`, marginTop: 4 }} />
                )}
              </div>
              <div style={{ paddingBottom: 36 }}>
                <div style={{ fontSize: 20, fontFamily: 'JetBrains Mono, monospace', color: `${color}99`, marginBottom: 4 }}>{ev.year}</div>
                <div style={{ fontSize: 28, fontFamily: 'Space Grotesk, sans-serif', color: '#ffffff', fontWeight: 600 }}>{ev.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
