/**
 * CaptionPage — small running accessibility caption at the bottom of the frame.
 *
 * KineticTextLayer (in each BeatSection) handles the mograph treatment of the
 * emphasis keyword. This component shows a lightweight running narration track
 * at 44px for legibility without competing with the kinetic text above it.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
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
  bodyFont,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentMs = (frame / fps) * 1000 + page.startMs;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 180,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          textAlign: 'center',
          fontFamily: bodyFont,
          fontSize: 46,
          color: '#ffffff',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          lineHeight: 1.25,
          textShadow: '0 2px 12px rgba(0,0,0,1), 0 0 40px rgba(0,0,0,0.9)',
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive = token.fromMs <= currentMs && token.toMs > currentMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                whiteSpace: 'pre',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
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
