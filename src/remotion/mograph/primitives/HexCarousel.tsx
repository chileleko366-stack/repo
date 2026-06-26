import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export interface CarouselPanel { title: string; body?: string; }
interface Props { accentColor: string; backgroundColor: string; panels?: CarouselPanel[]; }

const DEFAULT_PANELS: CarouselPanel[] = [
  { title: 'Vision', body: 'Define the future' },
  { title: 'Strategy', body: 'Map the path' },
  { title: 'Execute', body: 'Ship fast' },
  { title: 'Iterate', body: 'Learn & improve' },
  { title: 'Scale', body: 'Grow exponentially' },
  { title: 'Impact', body: 'Change the world' },
];

export const HexCarousel: React.FC<Props> = ({ accentColor, backgroundColor, panels = DEFAULT_PANELS }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const groupRotY = frame * 0.4;
  const groupRotX = Math.sin(frame * 0.01) * 10;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity,
    }}>
      <div style={{ perspective: 1200, width: 600, height: 600 }}>
        <div style={{
          width: '100%', height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${groupRotY}deg) rotateX(${groupRotX}deg)`,
          position: 'relative',
        }}>
          {panels.slice(0, 6).map((panel, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 340,
                height: 480,
                borderRadius: 32,
                background: `linear-gradient(135deg, ${accentColor}33, ${backgroundColor})`,
                border: `1px solid ${accentColor}44`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
                boxSizing: 'border-box',
                transform: `rotateY(${i * 60}deg) translateZ(480px)`,
                left: '50%',
                top: '50%',
                marginLeft: -170,
                marginTop: -240,
              }}
            >
              <div style={{ fontSize: 44, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{panel.title}</div>
              {panel.body && <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)', marginTop: 12, textAlign: 'center' }}>{panel.body}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
