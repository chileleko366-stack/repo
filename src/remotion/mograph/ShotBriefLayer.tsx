/**
 * ShotBriefLayer — unified routing hub.
 * Keeps the Shot-Brief positioning, depth, and glow logic exactly as-is.
 * PrimitiveDispatch routes to the 20 CSS/SVG mograph primitives.
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { ManifestBeat } from '../../pipeline/types';
import type { ShotBrief } from '../../pipeline/shotBrief';
import { AssetLayer } from '../assets/AssetLayer';
import {
  GradientCard,
  GradientBorderCard,
  MorphSearchBar,
  GlowDuplicateStack,
  UISearchBar,
  ExpandingBox,
  CCLightSweep,
  LinearWipe,
  EffectFilmGrain,
  EffectVignette,
  BackgroundFluidWave,
  GlobeSpinner,
  CountryConnector,
  UIFlagChip,
  TextHighlightWord,
  HexCarousel,
  StarTransition,
  SaaSCard,
  OrbitalHub,
  CursorClick,
} from './primitives';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexOpacity(hex: string, opacity: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

function buildBoxShadow(brief: ShotBrief): string | undefined {
  const shadows = (brief.depth?.dropShadows ?? []).map(
    (s) => `${s.offsetX}px ${s.offsetY}px ${s.blurPx}px ${hexOpacity(s.color, s.opacity)}`,
  );
  return shadows.length ? shadows.join(', ') : undefined;
}

function GlowOverlays({ brief }: { brief: ShotBrief }): React.ReactElement {
  return (
    <>
      {(brief.depth?.glowEffects ?? []).map((glow, i) => {
        const { kind, angleDeg, stops } = glow.gradient;
        const stopStr = stops
          .map((s) => `${hexOpacity(s.color, s.opacity)} ${s.offsetPct}%`)
          .join(', ');
        const bg =
          kind === 'radial'
            ? `radial-gradient(ellipse at center, ${stopStr})`
            : `linear-gradient(${angleDeg ?? 90}deg, ${stopStr})`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: '-30%',
              background: bg,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        );
      })}
    </>
  );
}

// ─── Primitive dispatcher ─────────────────────────────────────────────────────

function PrimitiveDispatch({
  brief,
  beat,
  accentColor,
  bgColor,
  bodyFont,
  accentFont,
}: {
  brief: ShotBrief;
  beat: ManifestBeat;
  accentColor: string;
  bgColor: string;
  bodyFont: string;
  accentFont: string;
}): React.ReactElement {
  const { primitive, typography } = brief;
  const primaryTypo = typography.find((t) => t.role === 'primary');
  const keyword = primaryTypo?.text ?? beat.emphasis_keyword ?? '';

  switch (primitive) {
    case 'GradientCard':
      return <GradientCard accentColor={accentColor} backgroundColor={bgColor} />;
    case 'GradientBorderCard':
      return <GradientBorderCard accentColor={accentColor} backgroundColor={bgColor} />;
    case 'MorphSearchBar':
      return <MorphSearchBar accentColor={accentColor} backgroundColor={bgColor} />;
    case 'GlowDuplicateStack':
      return <GlowDuplicateStack accentColor={accentColor} backgroundColor={bgColor} />;
    case 'UISearchBar':
      return <UISearchBar accentColor={accentColor} backgroundColor={bgColor} bodyFont={bodyFont} />;
    case 'ExpandingBox':
      return <ExpandingBox accentColor={accentColor} backgroundColor={bgColor} bodyFont={bodyFont} keyword={keyword} />;
    case 'CCLightSweep':
      return <CCLightSweep accentColor={accentColor} />;
    case 'LinearWipe':
      return <LinearWipe accentColor={accentColor}><div /></LinearWipe>;
    case 'EffectFilmGrain':
      return <EffectFilmGrain />;
    case 'EffectVignette':
      return <EffectVignette />;
    case 'BackgroundFluidWave':
      return <BackgroundFluidWave accentColor={accentColor} backgroundColor={bgColor} />;
    case 'GlobeSpinner':
      return <GlobeSpinner accentColor={accentColor} backgroundColor={bgColor} />;
    case 'CountryConnector':
      return <CountryConnector accentColor={accentColor} />;
    case 'UIFlagChip':
      return <UIFlagChip accentColor={accentColor} bodyFont={bodyFont} />;
    case 'TextHighlightWord':
      return <TextHighlightWord text={keyword} accentColor={accentColor} bodyFont={bodyFont} />;
    case 'HexCarousel':
      return <HexCarousel accentColor={accentColor} backgroundColor={bgColor} />;
    case 'StarTransition':
      return <StarTransition accentColor={accentColor} />;
    case 'SaaSCard':
      return <SaaSCard accentColor={accentColor} backgroundColor={bgColor} bodyFont={bodyFont} title={keyword} body="" />;
    case 'OrbitalHub':
      return <OrbitalHub accentColor={accentColor} backgroundColor={bgColor} />;
    case 'CursorClick':
      return <CursorClick accentColor={accentColor} />;
    default:
      return (
        <GradientCard accentColor={accentColor} backgroundColor={bgColor} />
      );
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface ShotBriefLayerProps {
  beat: ManifestBeat;
  accentColor: string;
  bgColor: string;
  bodyFont: string;
  accentFont: string;
  suppressPrimitive?: boolean;
}

export const ShotBriefLayer: React.FC<ShotBriefLayerProps> = ({
  beat,
  accentColor,
  bgColor,
  bodyFont,
  accentFont,
  suppressPrimitive = false,
}) => {
  const brief = beat.shotBrief;
  if (!brief) return null;

  if (suppressPrimitive) {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <GlowOverlays brief={brief} />
      </AbsoluteFill>
    );
  }

  const accent1Color = brief.typography.find((t) => t.role === 'accent')?.color
    ?? brief.typography.find((t) => t.role === 'primary')?.color
    ?? accentColor;
  const accent2Color = brief.typography.find((t) => t.role === 'label')?.color
    ?? brief.typography.find((t) => t.role === 'body')?.color
    ?? '#7700cc';

  const hasRealAsset = (() => {
    const ra = beat.resolvedAsset;
    if (!ra) return false;
    const a = ra as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();

  const content = hasRealAsset
    ? (
      <AssetLayer
        beat={beat}
        durationFrames={beat.durationFrames}
        accentColors={{ primary: accent1Color, secondary: accent2Color }}
      />
    )
    : (
      <PrimitiveDispatch
        brief={brief}
        beat={beat}
        accentColor={accentColor}
        bgColor={bgColor}
        bodyFont={bodyFont}
        accentFont={accentFont}
      />
    );

  const isMapKind = beat.visual.kind === 'map' || beat.visual.kind === 'distance';
  const { xPct, yPct, widthPct, heightPct } = isMapKind
    ? { xPct: 50, yPct: 50, widthPct: 100, heightPct: 100 }
    : brief.composition.primaryAnchor;
  const boxShadow = buildBoxShadow(brief);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        transform: 'translate(-50%, -50%)',
        overflow: 'visible',
        zIndex: 5,
      }}
    >
      <GlowOverlays brief={brief} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          boxShadow,
        }}
      >
        {content}
      </div>
    </div>
  );
};
