/**
 * ShotBriefLayer — unified routing hub combining bespoke-component dispatch
 * with Shot-Brief-driven positioning, depth, and glow effects.
 *
 * When beat.shotBrief is present it:
 *   1. Routes to the correct bespoke component via primitive switch (channel-gated
 *      for CelestialBody/ThreeBrain/CandlestickChart/Scramble/Stamp/Glitch)
 *   2. Checks beat.resolvedAsset first — a fetched photo always wins over a
 *      generic primitive, but is still wrapped in the positioning/depth treatment
 *   3. Positions the content using composition.primaryAnchor (xPct/yPct/widthPct/heightPct)
 *   4. Applies depth.dropShadows as CSS box-shadow
 *   5. Renders radial/linear glow overlays from depth.glowEffects
 *
 * Returns null when beat.shotBrief is absent so the host composition's own
 * rendering (KineticTitle / PsychCard / etc.) takes over unmodified.
 *
 * Channel-gating rules:
 *  CelestialBody     — ch6 only
 *  ThreeBrain        — ch4 only
 *  CandlestickChart  — ch2 only
 *  ScrambleReveal / ClassifiedStamp / GlitchWord — ch3 only
 *  AnimatedIcon / generic primitives / resolved assets — any channel
 */

import React from 'react';
import type { ManifestBeat } from '../../pipeline/types';
import type { ShotBrief } from '../../pipeline/shotBrief';
import { AssetLayer } from '../assets/AssetLayer';
import { CelestialBody } from '../channels/ch6/CelestialBody';
import { ThreeBrain } from '../channels/ch4/ThreeBrain';
import { CandlestickChart } from '../channels/ch2/CandlestickChart';
import { ScrambleReveal } from '../channels/ch3/ScrambleReveal';
import { ClassifiedStamp } from '../channels/ch3/ClassifiedStamp';
import { GlitchWord } from '../channels/ch3/GlitchWord';
import {
  GlassCard,
  Typewriter,
  WordCarousel,
  ProgressBar,
  TypographicCard,
  AnimatedIcon,
} from './primitives';
import type { IconName } from './primitives/AnimatedIcon';

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

// ─── Fallback card ────────────────────────────────────────────────────────────

function FallbackCard({
  brief,
  beat,
  accentColor,
  bgColor,
}: {
  brief: ShotBrief;
  beat: ManifestBeat;
  accentColor: string;
  bgColor: string;
}): React.ReactElement {
  const primaryTypo = brief.typography.find((t) => t.role === 'primary');
  return (
    <TypographicCard
      value={primaryTypo?.text ?? beat.emphasis_keyword ?? beat.visual.value ?? '?'}
      kindHint={beat.visual.kind !== 'none' ? beat.visual.kind : undefined}
      accentColor={accentColor}
      backgroundColor={bgColor}
    />
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
  const { primitive, channelId, typography } = brief;
  const primaryTypo = typography.find((t) => t.role === 'primary');
  const labelTypo   = typography.find((t) => t.role === 'label');
  const bodyTypo    = typography.find((t) => t.role === 'body');
  const primaryText = primaryTypo?.text ?? beat.emphasis_keyword ?? '';

  switch (primitive) {
    // ── Channel-specific bespoke components ─────────────────────────────────

    case 'CelestialBody':
      if (channelId !== 'ch6') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return (
        <CelestialBody
          bodyName={beat.visual.value ?? 'Jupiter'}
          durationInFrames={beat.durationFrames}
        />
      );

    case 'ThreeBrain':
      if (channelId !== 'ch4') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return <ThreeBrain />;

    case 'CandlestickChart':
      if (channelId !== 'ch2') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return <CandlestickChart durationFrames={beat.durationFrames} />;

    case 'ScrambleReveal':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return (
        <ScrambleReveal
          text={beat.narration}
          color={primaryTypo?.color ?? '#e0e0e0'}
          fontSize={primaryTypo?.sizePx ?? 64}
        />
      );

    case 'ClassifiedStamp':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return <ClassifiedStamp />;

    case 'GlitchWord':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return (
        <GlitchWord
          text={primaryText.toUpperCase()}
          fontSize={primaryTypo?.sizePx ?? 100}
          color={accentColor}
        />
      );

    // ── Any-channel components ───────────────────────────────────────────────

    case 'AnimatedIcon':
      return (
        <AnimatedIcon
          icon={(beat.visual.value as IconName) ?? 'chart-up'}
          backgroundColor={bgColor}
        />
      );

    // ── Generic mograph primitives ───────────────────────────────────────────

    case 'GlassCard':
      return (
        <GlassCard
          primary={primaryText}
          label={labelTypo?.text}
          body={bodyTypo?.text}
          accentColor={accentColor}
          backgroundColor={bgColor}
          glowColor={accentColor}
          fontFamily={bodyFont}
          accentFont={accentFont}
        />
      );

    case 'Typewriter':
      return (
        <Typewriter
          text={primaryText}
          highlightWord={beat.emphasis_keyword}
          highlightColor={accentColor}
          color={primaryTypo?.color ?? '#ffffff'}
          backgroundColor={bgColor}
        />
      );

    case 'WordCarousel': {
      const words = primaryText.split(',').map((w) => w.trim()).filter(Boolean);
      return (
        <WordCarousel
          words={words.length > 0 ? words : [primaryText]}
          wordColor={accentColor}
          fontFamily={accentFont}
          backgroundColor={bgColor}
        />
      );
    }

    case 'ProgressBar':
      return (
        <ProgressBar
          targetPct={typeof beat.visual.stat_value === 'number' ? beat.visual.stat_value : 75}
          label={primaryText}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );

    case 'TypographicCard':
    default:
      return (
        <TypographicCard
          value={primaryText || beat.visual.value || beat.emphasis_keyword || '?'}
          kindHint={beat.visual.kind !== 'none' ? beat.visual.kind : undefined}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
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
}

export const ShotBriefLayer: React.FC<ShotBriefLayerProps> = ({
  beat,
  accentColor,
  bgColor,
  bodyFont,
  accentFont,
}) => {
  const brief = beat.shotBrief;
  if (!brief) return null;

  // Derive duotone accent colors from typography for resolved-asset path
  const accent1Color = brief.typography.find((t) => t.role === 'accent')?.color
    ?? brief.typography.find((t) => t.role === 'primary')?.color
    ?? accentColor;
  const accent2Color = brief.typography.find((t) => t.role === 'label')?.color
    ?? brief.typography.find((t) => t.role === 'body')?.color
    ?? '#7700cc';

  // Resolved-asset-first: real imagery always wins, wrapped in Shot Brief positioning
  const content = (beat.resolvedAsset && brief.primitive !== 'AnimatedIcon')
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

  const { xPct, yPct, widthPct, heightPct } = brief.composition.primaryAnchor;
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
      {/* Glow atmosphere behind the primitive */}
      <GlowOverlays brief={brief} />
      {/* Primitive container with drop-shadow applied */}
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
