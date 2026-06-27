/**
 * BrandLogo — renders a simple-icons SVG with the brand's hex colour.
 * Spring entrance: scale 0→1, opacity 0→1 over 18 frames.
 * Ambient glow ring behind the logo adds depth without any CSS animation.
 */

import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { BrandAsset } from '../../pipeline/types';

export const BrandLogo: React.FC<{
  asset: BrandAsset;
  durationFrames: number;
}> = ({ asset, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 280, mass: 0.8 },
    durationInFrames: 18,
  });

  // Inject brand colour + responsive sizing into the SVG string
  const styledSvg = asset.svgString
    .replace('<svg ', `<svg fill="#${asset.hex}" style="width:100%;height:100%" `);

  return (
    <AbsoluteFill
      style={{ justifyContent: 'center', alignItems: 'center', paddingBottom: 200 }}
    >
      {/* Ambient glow — pure frame-driven opacity, no CSS transition */}
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: `#${asset.hex}`,
          opacity: enter * 0.18,
          filter: 'blur(100px)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          width: 300,
          height: 300,
          opacity: enter,
          transform: `scale(${enter})`,
          transformOrigin: 'center center',
        }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: styledSvg }}
      />

      {/* Brand name label */}
      <div
        style={{
          marginTop: 32,
          color: '#fff',
          fontSize: 44,
          fontWeight: 700,
          opacity: enter * 0.85,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {asset.title}
      </div>
    </AbsoluteFill>
  );
};
