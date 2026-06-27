import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_GENTLE } from '../mograph/primitives/SpringConfigs';

interface Props {
  imagePath: string;
  name?: string;
  caption?: string;
  accentColor?: string;
}

export const PersonCard: React.FC<Props> = ({ imagePath, name, caption, accentColor = '#ffffff' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE });
  const scale = interpolate(progress, [0, 1], [0.95, 1]);
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity, transform: `scale(${scale})` }}>
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Img src={imagePath} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '60px 40px 40px', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
          {name && (
            <div style={{ fontSize: 48, fontFamily: 'Anton, sans-serif', fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
              {name}
            </div>
          )}
          {caption && (
            <div style={{ fontSize: 26, fontFamily: 'Space Grotesk, sans-serif', color: accentColor, marginTop: 8 }}>
              {caption}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
