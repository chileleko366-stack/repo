/**
 * PlacePhoto — full-frame Wikipedia place image with a Ken Burns pan+zoom.
 * No CSS transitions; scale and translate are pure functions of useCurrentFrame().
 * Dark gradient overlay keeps captions legible regardless of image brightness.
 *
 * When accentColors is provided, a duotone treatment is applied:
 *   shadow layer (accent2): mix-blend-mode: multiply  — tints dark areas
 *   highlight layer (accent1): mix-blend-mode: screen  — tints light areas
 */

import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { PlaceAsset } from '../../pipeline/types';

export const PlacePhoto: React.FC<{
  asset: PlaceAsset;
  durationFrames: number;
  accentColors?: { primary: string; secondary: string };
}> = ({ asset, durationFrames, accentColors }) => {
  const frame = useCurrentFrame();
  const t = frame / durationFrames;

  // Subtle push-in + pan from left to right
  const scale      = interpolate(t, [0, 1], [1.06, 1.14], { extrapolateRight: 'clamp' });
  const translateX = interpolate(t, [0, 1], [0, -24],     { extrapolateRight: 'clamp' });
  const translateY = interpolate(t, [0, 1], [0, -8],      { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        isolation: accentColors ? 'isolate' : undefined,
      }}
    >
      <Img
        src={staticFile(asset.path.replace(/^public\//, ''))}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: 'center center',
          filter: accentColors ? 'grayscale(1) contrast(1.05)' : undefined,
        }}
      />

      {accentColors && (
        <>
          {/* Duotone shadow layer: accent2 tints dark areas */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: accentColors.secondary,
              mixBlendMode: 'multiply',
              opacity: 0.5,
            }}
          />
          {/* Duotone highlight layer: accent1 tints light areas */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: accentColors.primary,
              mixBlendMode: 'screen',
              opacity: 0.3,
            }}
          />
        </>
      )}

      {/* Vignette: darker edges, max black at bottom for caption readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.75) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
