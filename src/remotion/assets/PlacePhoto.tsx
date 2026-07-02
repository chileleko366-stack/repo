/**
 * PlacePhoto — full-frame Wikipedia place image with a Ken Burns pan+zoom.
 * No CSS transitions; scale and translate are pure functions of useCurrentFrame().
 * Dark gradient overlay keeps captions legible regardless of image brightness.
 *
 * When accentColors is provided, the image is desaturated (grayscale 85%,
 * contrast 1.05) with a low-opacity accent-color radial overlay — the
 * monochrome-with-a-color-pop treatment shared across all channels, applied
 * identically to every image when asset.paths cycles through more than one.
 *
 * The Ken Burns pan/zoom is applied once at this layer (not per-image inside
 * the cycle) so the camera keeps drifting continuously across the whole beat
 * regardless of which image is currently crossfading in.
 */

import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { PlaceAsset } from '../../pipeline/types';
import { ImageCycleLayer } from './ImageCycleLayer';

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

  const imagePaths = asset.paths && asset.paths.length > 0 ? asset.paths : [asset.path];

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: 'center center',
        }}
      >
        {imagePaths.length > 1 ? (
          <ImageCycleLayer
            paths={imagePaths}
            durationFrames={durationFrames}
            imgStyle={{
              objectFit: 'cover',
              filter: accentColors ? 'grayscale(0.85) contrast(1.05)' : undefined,
            }}
          />
        ) : (
          <Img
            src={staticFile(imagePaths[0].replace(/^public\//, ''))}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: accentColors ? 'grayscale(0.85) contrast(1.05)' : undefined,
            }}
          />
        )}
      </div>

      {/* Accent-color pop: low-opacity radial overlay, monochrome-with-a-pop look */}
      {accentColors && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, ${accentColors.primary}26 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
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
