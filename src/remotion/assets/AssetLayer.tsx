import React from 'react';
import { AbsoluteFill, Img, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { ResolvedAsset } from '../../pipeline/types';
import { SPRING_GENTLE } from '../mograph/primitives/SpringConfigs';

interface Props {
  asset: ResolvedAsset;
  accentColor?: string;
}

export const AssetLayer: React.FC<Props> = ({ asset, accentColor = '#ffffff' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_GENTLE });
  const scale = interpolate(progress, [0, 1], [1.08, 1]);
  const opacity = interpolate(progress, [0, 0.4, 1], [0, 0, 1]);

  if (asset.type === 'person' || asset.type === 'place') {
    return (
      <AbsoluteFill style={{ opacity }}>
        <Img
          src={asset.localPath}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
          }}
        />
      </AbsoluteFill>
    );
  }

  if (asset.type === 'brand') {
    return (
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity }}>
        <Img
          src={asset.localPath}
          style={{
            width: 300,
            height: 300,
            objectFit: 'contain',
            filter: `drop-shadow(0 0 40px ${accentColor}88)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (asset.type === 'map') {
    return (
      <AbsoluteFill style={{ opacity }}>
        <Img
          src={asset.localPath}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)`,
          }}
        />
      </AbsoluteFill>
    );
  }

  return null;
};
