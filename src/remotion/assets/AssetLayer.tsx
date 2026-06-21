/**
 * AssetLayer — reads beat.resolvedAsset and dispatches to the correct component.
 * Designed to be composed inside each beat's <Sequence> in channel compositions.
 *
 * Returns null when:
 *  - beat.resolvedAsset is absent or null
 *  - visual.kind is not handled here (anatomy/celestial handled by ch4/ch6 directly)
 */

import React from 'react';
import type {
  BrandAsset,
  DistanceAsset,
  ManifestBeat,
  PersonAsset,
  PlaceAsset,
  StockAsset,
} from '../../pipeline/types';
import { BrandLogo } from './BrandLogo';
import { DistanceMap } from './DistanceMap';
import { PersonCard } from './PersonCard';
import { PlacePhoto } from './PlacePhoto';
import { StockClip } from '../stock/StockClip';

export const AssetLayer: React.FC<{
  beat: ManifestBeat;
  durationFrames: number;
  accentColors?: { primary: string; secondary: string };
}> = ({ beat, durationFrames, accentColors }) => {
  const { visual, resolvedAsset } = beat;
  if (!resolvedAsset) return null;

  const kind = visual.kind;

  if (kind === 'person') {
    return (
      <PersonCard
        asset={resolvedAsset as PersonAsset}
        durationFrames={durationFrames}
        accentColors={accentColors}
      />
    );
  }

  if (kind === 'brand' || kind === 'product' || kind === 'app') {
    return (
      <BrandLogo
        asset={resolvedAsset as BrandAsset}
        durationFrames={durationFrames}
      />
    );
  }

  if (kind === 'place') {
    return (
      <PlacePhoto
        asset={resolvedAsset as PlaceAsset}
        durationFrames={durationFrames}
        accentColors={accentColors}
      />
    );
  }

  if (kind === 'map' || kind === 'distance') {
    return (
      <DistanceMap
        asset={resolvedAsset as DistanceAsset}
        durationFrames={durationFrames}
      />
    );
  }

  if (kind === 'stock_video') {
    return (
      <StockClip
        asset={resolvedAsset as StockAsset}
        durationFrames={durationFrames}
      />
    );
  }

  return null;
};
