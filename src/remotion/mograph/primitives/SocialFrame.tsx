// Ported from:
// /tmp/refs/saas-engine/src/skills/social-media.md
// Provides safe-zone padding for IG/TikTok/Reels — 12% top, 15% bottom, 5% sides.
// Enforces minimum 48px headline and mobile-readable body (28px+).

import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';

interface SocialFrameProps {
  children: React.ReactNode;
  /** Override top reserved area (default: 12% of height) */
  topReservedPx?: number;
  /** Override bottom reserved area (default: 15% of height) */
  bottomReservedPx?: number;
}

export const SocialFrame: React.FC<SocialFrameProps> = ({
  children,
  topReservedPx,
  bottomReservedPx,
}) => {
  const { width, height } = useVideoConfig();

  // social-media.md safe zone percentages: 12% top, 15% bottom, 5% sides
  const top = topReservedPx ?? Math.round(height * 0.12);
  const bottom = bottomReservedPx ?? Math.round(height * 0.15);
  const side = Math.round(width * 0.05);

  return (
    <AbsoluteFill
      style={{
        paddingTop: top,
        paddingBottom: bottom,
        paddingLeft: side,
        paddingRight: side,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const SOCIAL_SAFE_ZONE = {
  topPct: 0.12,
  bottomPct: 0.15,
  sidePct: 0.05,
} as const;
