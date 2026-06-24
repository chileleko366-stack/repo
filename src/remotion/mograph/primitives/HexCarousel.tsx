import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export interface CarouselPanel {
  title: string;
  body?: string;
}

interface HexCarouselProps {
  panels?: CarouselPanel[];
  accentColor?: string;
  backgroundColor?: string;
}

const PANEL_COUNT = 6;
const RADIUS = 320;

const DEFAULT_PANELS: CarouselPanel[] = [
  { title: 'Design',  body: 'Visual language' },
  { title: 'Build',   body: 'Engineered fast' },
  { title: 'Scale',   body: 'Grows with you'  },
  { title: 'Deploy',  body: 'One command'      },
  { title: 'Iterate', body: 'Ship quickly'     },
  { title: 'Profit',  body: 'ROI driven'       },
];

export const HexCarousel: React.FC<HexCarouselProps> = ({
  panels,
  accentColor = '#7c3aed',
  backgroundColor = '#0f0f1a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 24, stiffness: 70, mass: 1.3 } });
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const scale = interpolate(entrance, [0, 1], [0.82, 1]);

  // Slow Y-axis pan at 36°/s
  const rotY = (frame / fps) * 36;

  const items = (panels && panels.length >= 2 ? panels : DEFAULT_PANELS).slice(0, PANEL_COUNT);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1100,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          width: RADIUS * 2,
          height: RADIUS * 2,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotY}deg)`,
        }}
      >
        {items.map((panel, i) => {
          const angleY = (i / PANEL_COUNT) * 360;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 270,
                height: 170,
                left: '50%',
                top: '50%',
                marginLeft: -135,
                marginTop: -85,
                transformStyle: 'preserve-3d',
                transform: `rotateY(${angleY}deg) translateZ(${RADIUS}px)`,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
                border: `1.5px solid ${accentColor}66`,
                borderRadius: 18,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 20px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  color: accentColor,
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                }}
              >
                {panel.title}
              </div>
              {panel.body && (
                <div
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: 22,
                    marginTop: 10,
                    textAlign: 'center',
                    lineHeight: 1.35,
                  }}
                >
                  {panel.body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
