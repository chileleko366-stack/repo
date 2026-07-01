/**
 * CaptionPage — kinetic word-reveal narration captions, upper-third placement.
 *
 * Every spoken word is rendered (muted viewers must be able to follow full
 * narration). Each word pops in with a spring scale + translateY as its
 * fromMs is reached — no static subtitle bar, no bottom-third bar. The
 * active word is in accent color; words that already played stay visible
 * but fade to a dimmed white rather than disappearing, avoiding the
 * choppy one-word-at-a-time TikTok read.
 */

import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { TikTokPage } from "@remotion/captions";
import { SOCIAL_SAFE_ZONE } from "../mograph/primitives";

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
  accentColor,
  enterProgress,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const currentMs = (frame / fps) * 1000 + page.startMs;
  // Clear YouTube Shorts/TikTok/Reels UI's reserved top band (profile/caption
  // strip) rather than a magic percentage — see SOCIAL_SAFE_ZONE.
  const topPx = Math.round(height * SOCIAL_SAFE_ZONE.topPct);

  return (
    <div
      style={{
        position: "absolute",
        top: topPx,
        left: "7%",
        right: "7%",
        textAlign: "center",
        opacity: enterProgress,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 48,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          lineHeight: 1.35,
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            token.fromMs <= currentMs && token.toMs > currentMs;
          const hasAppeared = currentMs >= token.fromMs;

          const wordStartFrame = Math.round(
            ((token.fromMs - page.startMs) / 1000) * fps,
          );
          const reveal = spring({
            frame: frame - wordStartFrame,
            fps,
            config: { damping: 20, stiffness: 260, mass: 0.7 },
            durationInFrames: 12,
          });
          const scale = interpolate(reveal, [0, 1], [0.5, 1]);
          const translateY = interpolate(reveal, [0, 1], [18, 0]);

          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                color: isActive ? accentColor : "#ffffff",
                fontWeight: isActive ? 800 : 700,
                opacity: hasAppeared ? (isActive ? 1 : 0.6) : 0,
                transform: `scale(${scale}) translateY(${translateY}px)`,
                textShadow: "0 2px 8px rgba(0,0,0,0.85), 0 0 24px rgba(0,0,0,0.6)",
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
