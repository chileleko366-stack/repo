/**
 * PersonCard — renders a Wikipedia person cutout (rembg-processed PNG).
 * asset_resolver.py's resolve_person() runs the actual background removal;
 * if rembg/its model is unavailable at resolve time it falls back to the
 * uncut photo instead (asset.path then points at a plain .jpg) — this
 * component doesn't know or care which one it got, it just renders asset.path.
 *
 * Layered 2.5D parallax composition:
 *   1. Background gradient — drifts at 25% of the subject camera rate
 *   2. Subject (Img, or ImageCycleLayer when asset.paths has more than one
 *      image) — full camera drift + subtle multi-harmonic idle motion
 *
 * When accentColors is provided, the subject is desaturated (grayscale 85%,
 * contrast 1.05) with a low-opacity accent-color radial overlay — the
 * monochrome-with-a-color-pop treatment shared across all channels, applied
 * identically to every image when cycling through more than one.
 *
 * Falls back to an initial-letter badge when no image is available.
 */

import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PersonAsset } from '../../pipeline/types';
import { ImageCycleLayer } from './ImageCycleLayer';

export const PersonCard: React.FC<{
  asset: PersonAsset;
  durationFrames: number;
  accentColors?: { primary: string; secondary: string };
}> = ({ asset, durationFrames, accentColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 36, stiffness: 400 },
    durationInFrames: 40,
  });
  const scale   = 0.88 + enter * 0.12;
  const opacity = enter;

  // Camera drift: slow sinusoidal pan across the clip duration
  const t    = durationFrames > 0 ? frame / durationFrames : 0;
  const camX = Math.sin(t * Math.PI * 1.2) * 18;

  // Multi-harmonic idle motion (Perlin-style sum-of-sines on the subject layer)
  const idleX = Math.sin(frame * 0.03) * 3 + Math.sin(frame * 0.07 + 0.8) * 1.5;
  const idleY = Math.sin(frame * 0.05 + 1.2) * 2 + Math.sin(frame * 0.09 + 0.3) * 1.0;

  const imagePaths = asset.paths && asset.paths.length > 0
    ? asset.paths
    : asset.path ? [asset.path] : [];

  if (imagePaths.length === 0) {
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
      {/* Depth background: accent radial glow, drifts at 25% of subject camera rate */}
      {accentColors && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, ${accentColors.secondary}33 0%, transparent 70%)`,
            transform: `translateX(${camX * 0.25}px)`,
            opacity,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Subject layer: entrance spring + full camera drift + idle motion */}
      <div
        style={{
          position: 'relative',
          transform: `scale(${scale}) translateX(${camX + idleX}px) translateY(${idleY}px)`,
          transformOrigin: 'center bottom',
          opacity,
        }}
      >
        {imagePaths.length > 1 ? (
          <ImageCycleLayer
            paths={imagePaths}
            durationFrames={durationFrames}
            containerStyle={{ width: 800, height: 900 }}
            imgStyle={{
              objectFit: 'contain',
              filter: accentColors ? 'grayscale(0.85) contrast(1.05)' : undefined,
            }}
          />
        ) : (
          <Img
            src={staticFile(imagePaths[0].replace(/^public\//, ''))}
            style={{
              maxHeight: 900,
              maxWidth: 800,
              objectFit: 'contain',
              display: 'block',
              filter: accentColors ? 'grayscale(0.85) contrast(1.05)' : undefined,
            }}
          />
        )}

        {/* Accent-color pop: low-opacity radial overlay on the subject itself */}
        {accentColors && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 40%, ${accentColors.primary}26 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
