/**
 * PersonCard — renders a Wikipedia person cutout (rembg-processed PNG).
 *
 * Layered 2.5D parallax composition:
 *   1. Background gradient — drifts at 25% of the subject camera rate
 *   2. Subject (Img) — full camera drift + subtle multi-harmonic idle motion
 *
 * Duotone: channel accent colors applied via CSS blend-mode overlays when
 * accentColors is provided.
 *   Shadow layer    (accent2): mix-blend-mode: multiply
 *   Highlight layer (accent1): mix-blend-mode: screen
 *
 * Falls back to an initial-letter badge when no image is available.
 */

import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { PersonAsset } from '../../pipeline/types';

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
          isolation: accentColors ? 'isolate' : undefined,
        }}
      >
        <Img
          src={staticFile(asset.path.replace(/^public\//, ''))}
          style={{
            maxHeight: 900,
            maxWidth: 800,
            objectFit: 'contain',
            display: 'block',
            filter: accentColors ? 'grayscale(1) contrast(1.05)' : undefined,
          }}
        />

        {accentColors && (
          <>
            {/* Duotone shadow layer: accent2 tints the dark areas */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: accentColors.secondary,
                mixBlendMode: 'multiply',
                opacity: 0.6,
              }}
            />
            {/* Duotone highlight layer: accent1 tints the light areas */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: accentColors.primary,
                mixBlendMode: 'screen',
                opacity: 0.4,
              }}
            />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};
