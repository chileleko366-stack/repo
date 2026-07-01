// Shared channel background: faint animated accent-coloured dot grid.
// Thin wrapper around BackgroundDotGrid so the 6 composition files can keep
// their existing <AmbientBackground baseColor accentColor channelId /> call sites.

import React from "react";
import { BackgroundDotGrid } from "../mograph/primitives/BackgroundDotGrid";

interface AmbientBackgroundProps {
  baseColor: string;
  accentColor: string;
  channelId: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  baseColor,
  accentColor,
}) => {
  return (
    <BackgroundDotGrid
      dotColor={accentColor}
      backgroundColor={baseColor}
      spacing={44}
      dotSize={1.5}
    />
  );
};
