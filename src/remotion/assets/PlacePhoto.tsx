import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_SLOW } from '../mograph/primitives/SpringConfigs';

interface Props {
  imagePath: string;
  placeName?: string;
  accentColor?: string;
}

export const PlacePhoto: React.FC<Props> = ({ imagePath, placeName, accentColor = '#c8a96e' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_SLOW, durationInFrames: 120 });
  const scale = interpolate(progress, [0, 1], [1.12, 1.04]);

  return (
    <AbsoluteFill>
      <Img src={imagePath} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      {placeName && (
        <div style={{ position: 'absolute', bottom: 120, left: 40, right: 40 }}>
          <div style={{ fontSize: 32, fontFamily: 'Space Grotesk, sans-serif', color: accentColor, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {placeName}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
