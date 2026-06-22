/**
 * CaptionPage — renders a single TikTok-style caption page.
 * Ported from remotion-dev/template-tiktok/src/CaptionedVideo/Page.tsx
 *
 * Design:
 * - Active word: accent font, accent colour, scale 1.18, dark pill bg
 * - Inactive past words: body font, opacity 0.55, dark pill bg
 * - Upcoming words: body font, opacity 0.20, dark pill bg
 * - Entrance: spring translateY +20 → 0
 * - paddingBottom: 370 (lower-center, above CTA area)
 * - Per-word dark pill backing for legibility over bright asset beats
 */

import React from 'react';
import {
  AbsoluteFill,
  interpolate,
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

  const currentMs = (frame / fps) * 1000 + page.startMs;

  const translateY = interpolate(enterProgress, [0, 1], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 370,
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
          lineHeight: 1.3,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            token.fromMs <= currentMs && token.toMs > currentMs;
          const isPast = token.toMs <= currentMs;

          let color: string;
          let opacity: number;
          let fontFamily: string;
          let fontSize: number;
          let fontWeight: number | string;
          let scale: number;

          if (isActive) {
            color = accentColor;
            opacity = 1;
            fontFamily = accentFont;
            fontSize = 72;
            fontWeight = 900;
            scale = 1.18;
          } else if (isPast) {
            color = '#ffffff';
            opacity = 0.55;
            fontFamily = bodyFont;
            fontSize = 64;
            fontWeight = 700;
            scale = 1;
          } else {
            color = '#ffffff';
            opacity = 0.20;
            fontFamily = bodyFont;
            fontSize = 64;
            fontWeight = 700;
            scale = 1;
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
                transform: `scale(${scale})`,
                transformOrigin: 'center bottom',
                background: 'rgba(0,0,0,0.60)',
                borderRadius: 10,
                paddingLeft: 8,
                paddingRight: 8,
                paddingTop: 4,
                paddingBottom: 4,
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}
            >
              {token.text.trim()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
