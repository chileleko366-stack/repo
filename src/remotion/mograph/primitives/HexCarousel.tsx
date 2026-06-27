import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Panel {
  content?: string;
  accentColor?: string;
}

interface Props {
  panels?: Panel[];
  radius?: number;
  tiltX?: number;
  rotationDuration?: number;
  backgroundColor?: string;
}

const DEFAULT_PANELS: Panel[] = [
  { content: 'FACT 1', accentColor: '#d400ff' },
  { content: 'FACT 2', accentColor: '#00f0ff' },
  { content: 'FACT 3', accentColor: '#ff6b35' },
  { content: 'FACT 4', accentColor: '#00ff88' },
  { content: 'FACT 5', accentColor: '#ffcc00' },
  { content: 'FACT 6', accentColor: '#ff4466' },
];

export const HexCarousel: React.FC<Props> = ({
  panels = DEFAULT_PANELS,
  radius = 360,
  tiltX = 25,
  rotationDuration = 180,
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const rotation = (frame / rotationDuration) * 360;

  return (
    <AbsoluteFill style={{ backgroundColor, alignItems: 'center', justifyContent: 'center', perspective: 1200 }}>
      <div
        style={{
          position: 'relative',
          width: 800,
          height: 800,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tiltX}deg) rotateY(${rotation}deg)`,
        }}
      >
        {panels.slice(0, 6).map((panel, i) => {
          const yRot = i * 60;
          const borderRadius = interpolate(frame, [0, 25], [0, 48], { extrapolateRight: 'clamp' });

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `rotateY(${yRot}deg) translateZ(${radius}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <div
                style={{
                  width: 280,
                  height: 360,
                  background: `linear-gradient(135deg, ${panel.accentColor}33, ${panel.accentColor}11)`,
                  border: `2px solid ${panel.accentColor}66`,
                  borderRadius,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  fontFamily: 'Anton, sans-serif',
                  fontWeight: 900,
                  color: panel.accentColor,
                  textAlign: 'center',
                  padding: 20,
                }}
              >
                {panel.content}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
