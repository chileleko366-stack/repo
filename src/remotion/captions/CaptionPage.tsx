/**
 * CaptionPage — running accessibility caption at the bottom of the frame.
 *
 * Active word: color change + bold weight (no scale — scaling mid-sentence causes layout shift).
 * First word of the page renders as hero word at 3× size if it matches beat.heroWord.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { TikTokPage } from "@remotion/captions";

export interface CaptionPageProps {
  page: TikTokPage;
  enterProgress: number;
  accentColor: string;
  accentFont: string;
  bodyFont: string;
  heroWord?: string;
}

export const CaptionPage: React.FC<CaptionPageProps> = ({
  page,
  bodyFont,
  accentColor,
  heroWord,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentMs = (frame / fps) * 1000 + page.startMs;

  const firstToken = page.tokens[0];
  const firstWordNorm = firstToken?.text?.trim().toUpperCase() ?? "";
  const heroNorm = (heroWord ?? "").toUpperCase();
  const isHeroBeat =
    heroNorm.length > 0 && firstWordNorm === heroNorm;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 180,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          textAlign: "center",
          fontFamily: bodyFont,
          fontSize: 44,
          color: "rgba(255,255,255,0.75)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          WebkitTextStroke: "4px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            token.fromMs <= currentMs && token.toMs > currentMs;
          const isFirstAndHero = i === 0 && isHeroBeat;

          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                whiteSpace: "pre",
                color: isActive ? accentColor : "rgba(255,255,255,0.6)",
                fontWeight: isActive ? 800 : 600,
                fontSize: isFirstAndHero ? 44 * 3 : undefined,
                display: isFirstAndHero ? "block" : "inline",
                lineHeight: isFirstAndHero ? 1 : undefined,
                marginBottom: isFirstAndHero ? 16 : undefined,
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
