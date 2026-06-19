/**
 * PersonCard — renders a Wikipedia person cutout (rembg-processed PNG).
 * Spring entrance: scale 0.88→1.0, opacity 0→1 over first 20 frames.
 * Falls back to an initial-letter badge when no image is available.
 */

import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PersonAsset } from '../../pipeline/types';

export const PersonCard: React.FC<{
  asset: PersonAsset;
  durationFrames: number;
}> = ({ asset, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 180, mass: 1 },
    durationInFrames: 20,
  });
  const scale   = 0.88 + enter * 0.12;
  const opacity = enter;

  if (!asset.path) {
    return (
      <AbsoluteFill
        style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 220 }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 88,
            fontWeight: 900,
            color: '#fff',
            opacity,
            transform: `scale(${scale})`,
          }}
        >
          {asset.fallback ?? '?'}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{ justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 220 }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: 'center bottom',
        }}
      >
        <Img
          src={staticFile(asset.path.replace(/^public\//, ''))}
          style={{
            maxHeight: 900,
            maxWidth: 800,
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
