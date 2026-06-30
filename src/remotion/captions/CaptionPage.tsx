/**
 * CaptionPage — lower-third caption overlay, no background box.
 * Active word highlighted via fontWeight + color. No scaling to avoid layout shift.
 */

import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { TikTokPage } from "@remotion/captions";

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
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentMs = (frame / fps) * 1000 + page.startMs;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "12%",
        left: "8%",
        right: "8%",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 44,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.3,
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            token.fromMs <= currentMs && token.toMs > currentMs;

          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                whiteSpace: "pre",
                color: isActive ? accentColor : "#ffffff",
                fontWeight: isActive ? 800 : 600,
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
