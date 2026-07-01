// Shared channel background: faint animated accent-coloured dot grid, with a
// still-fainter layer of floating geometric accents (circles/squares/
// triangles) on top for the ambient geometric texture the reference look
// calls for. Thin wrapper so the 6 composition files can keep their existing
// <AmbientBackground baseColor accentColor accentColor2? channelId /> call sites.

import React from "react";
import { BackgroundDotGrid } from "../mograph/primitives/BackgroundDotGrid";
import { BackgroundGeometric } from "../mograph/primitives/BackgroundGeometric";

interface AmbientBackgroundProps {
  baseColor: string;
  accentColor: string;
  /** Second accent for the geometric-shapes layer; falls back to accentColor. */
  accentColor2?: string;
  channelId: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  baseColor,
  accentColor,
  accentColor2,
}) => {
  return (
    <>
      <BackgroundDotGrid
        dotColor={accentColor}
        backgroundColor={baseColor}
        spacing={44}
        dotSize={1.5}
      />
      <BackgroundGeometric
        accentColors={[accentColor, accentColor2 ?? accentColor]}
        backgroundColor="transparent"
      />
    </>
  );
};
