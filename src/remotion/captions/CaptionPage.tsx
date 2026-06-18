/**
 * CaptionPage — renders a single TikTok-style caption page.
 * Ported from remotion-dev/template-tiktok/src/CaptionedVideo/Page.tsx
 *
 * Design:
 * - Active word: accent font, accent colour, scale 1.12
 * - Inactive past words: body font, opacity 0.55
 * - Upcoming words: body font, opacity 0.20
 * - Entrance: spring translateY +28 → 0, triggered by enterProgress prop
 * - Solid background pill behind each word cluster (no subtitle bar)
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { TikTokPage } from '@remotion/captions';

export interface CaptionPageProps {
  page: TikTokPage;
  enterProgress: number;
  accentColor: string;
  accentFont: string;
  bodyFont: string;
}

export const CaptionPage: React.FC<CaptionPageProps> = ({
  page,
  enterProgress,
  accentColor,
  accentFont,
  bodyFont,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Absolute time within the video (page.startMs is absolute)
  const currentMs = (frame / fps) * 1000 + page.startMs;

  const translateY = interpolate(enterProgress, [0, 1], [28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 80,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          transform: `translateY(${translateY}px)`,
          maxWidth: 860,
          width: '100%',
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: 'center',
          lineHeight: 1.25,
          // Solid dark backing so text is always legible
          background: 'rgba(0,0,0,0.55)',
          borderRadius: 16,
          paddingTop: 14,
          paddingBottom: 14,
          whiteSpace: 'pre-wrap',
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            token.fromMs <= currentMs && token.toMs > currentMs;
          // Words before the active one are "past"
          const isPast = token.toMs <= currentMs;

          let color: string;
          let opacity: number;
          let fontFamily: string;
          let fontSize: number;
          let fontWeight: number | string;
          let scaleX = 1;
          let scaleY = 1;

          if (isActive) {
            color = accentColor;
            opacity = 1;
            fontFamily = accentFont;
            fontSize = 64;
            fontWeight = 900;
            scaleX = 1.12;
            scaleY = 1.12;
          } else if (isPast) {
            color = '#ffffff';
            opacity = 0.55;
            fontFamily = bodyFont;
            fontSize = 58;
            fontWeight = 700;
          } else {
            color = '#ffffff';
            opacity = 0.20;
            fontFamily = bodyFont;
            fontSize = 58;
            fontWeight = 700;
          }

          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                color,
                opacity,
                fontFamily,
                fontSize,
                fontWeight,
                transform: `scale(${scaleX}, ${scaleY})`,
                transformOrigin: 'center bottom',
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
