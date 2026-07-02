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
 * Throws if beat.shotBrief is absent — shot-brief compilation is now
 * required to succeed (or abort the channel's render) before Remotion runs,
 * so every beat reaching this component is guaranteed to carry a valid brief.
 *
 * Channel-gating rules:
 *  CelestialBody     — ch6 only
 *  ThreeBrain        — ch4 only
 *  CandlestickChart  — ch2 only
 *  ScrambleReveal / ClassifiedStamp / GlitchWord — ch3 only
 *  AnimatedIcon / generic primitives / resolved assets — any channel
 */

import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import type { ManifestBeat } from '../../pipeline/types';
import type { ShotBrief } from '../../pipeline/shotBrief';
import { AssetLayer } from '../assets/AssetLayer';
import { CandlestickChart } from '../channels/ch2/CandlestickChart';
import { ScrambleReveal } from '../channels/ch3/ScrambleReveal';
import { ClassifiedStamp } from '../channels/ch3/ClassifiedStamp';
import { GlitchWord } from '../channels/ch3/GlitchWord';
import {
  Typewriter,
  WordCarousel,
  ProgressBar,
  TypographicCard,
  AnimatedIcon,
  BarChart,
  TextKinetic,
  TextScramble,
  TextWave,
  TextMaskReveal,
  TextGlitch,
  TextNeon,
  TextCounter,
  TextGradient,
  Text3DFlip,
  DataLineChart,
  DataGauge,
  DataRanking,
  DataTimeline,
  DataStatsCards,
  LayoutGiantNumber,
  LayoutSplitContrast,
  LayoutFullscreenType,
  LayoutMultiColumn,
  ShapeCircularProgress,
  ShapeSpinningRings,
  ParticleShootingStars,
  ParticleSparks,
  CinematicDocumentary,
  CinematicNoir,
  CinematicSciFi,
  BackgroundAurora,
  BackgroundGeometric,
  EffectFilmGrain,
  EffectLightLeak,
  EffectVHS,
  EffectGlow,
} from './primitives';
import type { IconName } from './primitives/AnimatedIcon';
import type { BarData } from './primitives/BarChart';
import type { LineChartPoint } from './primitives/DataLineChart';
import type { RankItem } from './primitives/DataRanking';
import type { TimelineEvent } from './primitives/DataTimeline';
import type { StatCard } from './primitives/DataStatsCards';
import type { ColumnData } from './primitives/LayoutMultiColumn';

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

function hasRenderableResolvedAsset(beat: ManifestBeat): boolean {
  const ra = beat.resolvedAsset;
  if (!ra) return false;
  const a = ra as unknown as Record<string, unknown>;
  if ('path' in a) return a.path != null;
  if ('svgString' in a) return true;
  if ('map_image' in a) return true;
  return false;
}

// Primitives whose PrimitiveDispatch case does NOT surface typography.primary
// .text as literal, readable on-screen text — either they don't touch it at
// all (particles/effects/backgrounds/icon), or they only consume it as
// parsed numeric/chart data (TextCounter formats a number; DataLineChart
// plots x/y points; ShapeCircularProgress's label falls back straight to
// emphasis_keyword, not primaryText). ScrambleReveal renders beat.narration,
// not primaryText. Kept in sync with the PrimitiveDispatch switch below.
const PRIMITIVES_WITHOUT_LITERAL_PRIMARY_TEXT = new Set([
  'AnimatedIcon', 'TextCounter', 'DataLineChart', 'ShapeCircularProgress',
  'ShapeSpinningRings', 'ParticleShootingStars', 'ParticleSparks',
  'CinematicNoir', 'CinematicSciFi', 'BackgroundAurora', 'BackgroundGeometric',
  'EffectFilmGrain', 'EffectLightLeak', 'EffectVHS', 'EffectGlow',
  'CandlestickChart', 'ClassifiedStamp', 'ScrambleReveal',
]);

/**
 * The literal text ShotBriefLayer's chosen primitive would show on screen
 * for this beat's typography.primary — or undefined if there's no brief, the
 * primitive is suppressed/replaced by a resolved asset, or the primitive
 * doesn't display primary text as readable words at all. `suppressPrimitive`
 * must match whatever the calling composition passes to <ShotBriefLayer>
 * (only ch4's anatomy beats currently use it).
 *
 * Composition files use this to detect when KineticTextLayer's
 * emphasis_keyword headline would render the exact same word the shot
 * brief already put on screen, and suppress the keyword on collision — the
 * shot-brief LLM is explicitly instructed (shot_brief.py's TYPOGRAPHY RULES)
 * to use emphasis_keyword as its typography.primary text, so this collision
 * is expected on the common path, not a rare edge case.
 */
export function getShotBriefPrimaryText(beat: ManifestBeat, suppressPrimitive = false): string | undefined {
  const brief = beat.shotBrief;
  if (!brief || suppressPrimitive) return undefined;
  if (hasRenderableResolvedAsset(beat) && brief.primitive !== 'AnimatedIcon') return undefined;
  if (PRIMITIVES_WITHOUT_LITERAL_PRIMARY_TEXT.has(brief.primitive)) return undefined;
  return (brief.typography ?? []).find((t) => t.role === 'primary')?.text;
}

// The LLM is asked for composition.safeZones (topReservedPx/bottomReservedPx)
// alongside primaryAnchor, but nothing validates the two are consistent — the
// LLM can (and does) pick a yPct that puts the anchor box inside its own
// stated reserved band. Clamp yPct so the anchor box's vertical extent never
// crosses the reserved bands, keeping widthPct/heightPct (the LLM's chosen
// composition size) untouched. safeZones is nominally required on ShotBrief,
// but — like depth.glowEffects/dropShadows elsewhere in this file — treated
// as optional here since nothing enforces its presence in the raw LLM JSON.
export function clampYPctToSafeZone(brief: ShotBrief, videoHeight: number): number {
  const { yPct, heightPct } = brief.composition.primaryAnchor;
  const topReservedPx = brief.composition.safeZones?.topReservedPx ?? 0;
  const bottomReservedPx = brief.composition.safeZones?.bottomReservedPx ?? 0;

  if (videoHeight <= 0 || (topReservedPx <= 0 && bottomReservedPx <= 0)) {
    return yPct;
  }

  const halfHeightPct = heightPct / 2;
  const minYPct = (topReservedPx / videoHeight) * 100 + halfHeightPct;
  const maxYPct = 100 - (bottomReservedPx / videoHeight) * 100 - halfHeightPct;

  // Reserved bands too large relative to the anchor's own height to satisfy
  // both bounds — leave the LLM's yPct alone rather than clamp to nonsense.
  if (minYPct > maxYPct) {
    return yPct;
  }

  return Math.min(Math.max(yPct, minYPct), maxYPct);
}

function GlowOverlays({ brief }: { brief: ShotBrief }): React.ReactElement {
  return (
    <>
      {(brief.depth?.glowEffects ?? []).filter(glow => glow?.gradient != null).map((glow, i) => {
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
  const primaryTypo = (brief.typography ?? []).find((t) => t.role === 'primary');
  return (
    <TypographicCard
      value={primaryTypo?.text ?? beat.emphasis_keyword ?? beat.visual.value ?? '?'}
      kindHint={
        beat.visual.kind !== 'none' && beat.visual.kind !== 'typography'
          ? beat.visual.kind
          : undefined
      }
      accentColor={accentColor}
      backgroundColor={bgColor}
    />
  );
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────

function parseCsv(text: string): string[] {
  return text.split(',').map(s => s.trim()).filter(Boolean);
}

function parseLabelValue(text: string, defaultVal: number): { label: string; value: number }[] {
  return parseCsv(text).map((s, i) => {
    const [lbl, val] = s.split(':');
    return { label: lbl?.trim() ?? `Item ${i + 1}`, value: parseFloat(val ?? String(defaultVal)) || defaultVal };
  });
}

// ─── Label sanitizer ─────────────────────────────────────────────────────────
// Guards against the LLM putting channel names, CTAs, or outro text in the
// label typography role. Returns undefined so the consumer's fallback fires.

function sanitizeLabel(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const t = text.trim();
  // Reject long labels (label role is max 4 words per spec)
  if (t.split(/\s+/).length > 5) return undefined;
  const lower = t.toLowerCase();
  // Reject channel name patterns
  if (/^(ch[1-6]|dopamine\s*loop|financefiction|redacted|grey\s*matter|quiet\s*record|red\s*space)/i.test(lower)) return undefined;
  // Reject CTA / outro language
  if (/(follow|subscribe|like\s+and|comment|tap|share|still\s+holds|contradicting|are\s+you)/i.test(lower)) return undefined;
  return t || undefined;
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
  const { primitive, channelId, typography = [] } = brief;
  const primaryTypo = typography.find((t) => t.role === 'primary');
  const labelTypo   = typography.find((t) => t.role === 'label');
  const bodyTypo    = typography.find((t) => t.role === 'body');
  const primaryText = primaryTypo?.text ?? beat.emphasis_keyword ?? '';
  const primaryColor = primaryTypo?.color ?? '#ffffff';

  switch (primitive) {
    // ── Channel-specific bespoke components ─────────────────────────────────

    case 'CelestialBody':
    case 'ThreeBrain':
      return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;

    case 'CandlestickChart':
      if (channelId !== 'ch2') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return <CandlestickChart durationFrames={beat.durationFrames} />;

    case 'ScrambleReveal':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} accentColor={accentColor} bgColor={bgColor} />;
      return (
        <ScrambleReveal
          text={beat.narration}
          color={primaryColor}
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

    case 'Typewriter':
      return (
        <Typewriter
          text={primaryText}
          highlightWord={beat.emphasis_keyword}
          highlightColor={accentColor}
          color={primaryColor}
          backgroundColor={bgColor}
        />
      );

    case 'WordCarousel': {
      const words = parseCsv(primaryText);
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

    case 'BarChart': {
      const bars: BarData[] = parseLabelValue(primaryText, 50);
      return (
        <BarChart
          data={bars.length > 0 ? bars : [{ label: beat.emphasis_keyword ?? 'Value', value: 75 }]}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={bodyFont}
        />
      );
    }

    // ── Text primitives ──────────────────────────────────────────────────────

    case 'TextKinetic':
      return (
        <TextKinetic
          words={primaryText}
          accentColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 96}
          fontFamily={accentFont}
          backgroundColor={bgColor}
        />
      );

    case 'TextScramble':
      return (
        <TextScramble
          text={primaryText}
          color={primaryColor}
          fontSize={primaryTypo?.sizePx ?? 80}
          fontFamily={bodyFont}
          backgroundColor={bgColor}
        />
      );

    case 'TextWave':
      return (
        <TextWave
          text={primaryText}
          color={primaryColor}
          accentColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 80}
          backgroundColor={bgColor}
        />
      );

    case 'TextMaskReveal':
      return (
        <TextMaskReveal
          text={primaryText}
          color={primaryColor}
          accentColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 96}
          backgroundColor={bgColor}
        />
      );

    case 'TextGlitch':
      return (
        <TextGlitch
          text={primaryText}
          color={primaryColor}
          fontSize={primaryTypo?.sizePx ?? 100}
          backgroundColor={bgColor}
        />
      );

    case 'TextNeon':
      return (
        <TextNeon
          text={primaryText}
          glowColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 100}
          backgroundColor={bgColor}
        />
      );

    case 'TextCounter': {
      const numStr = primaryText.replace(/[^0-9.]/g, '');
      return (
        <TextCounter
          target={parseFloat(numStr) || 0}
          prefix={beat.visual.prefix}
          suffix={beat.visual.suffix}
          accentColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 140}
          backgroundColor={bgColor}
        />
      );
    }

    case 'TextGradient':
      return (
        <TextGradient
          text={primaryText}
          fontSize={primaryTypo?.sizePx ?? 100}
          backgroundColor={bgColor}
        />
      );

    case 'Text3DFlip':
      return (
        <Text3DFlip
          text={primaryText}
          color={primaryColor}
          accentColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 100}
          backgroundColor={bgColor}
        />
      );

    // ── Data / Chart primitives ──────────────────────────────────────────────

    case 'DataLineChart': {
      const pts: LineChartPoint[] = parseLabelValue(primaryText, 50).map((d, i) => ({ x: i, y: d.value }));
      return (
        <DataLineChart
          data={pts.length > 1 ? pts : [{ x: 0, y: 20 }, { x: 1, y: 50 }, { x: 2, y: 80 }]}
          accentColor={accentColor}
          label={sanitizeLabel(labelTypo?.text)}
          backgroundColor={bgColor}
        />
      );
    }

    case 'DataGauge': {
      const gVal = parseFloat(primaryText.replace(/[^0-9.]/g, '')) || 50;
      return (
        <DataGauge
          value={gVal}
          max={100}
          label={sanitizeLabel(labelTypo?.text) ?? primaryText}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'DataRanking': {
      const items: RankItem[] = parseLabelValue(primaryText, 50);
      return (
        <DataRanking
          items={items.length > 0 ? items : [{ label: primaryText, value: 75 }]}
          title={sanitizeLabel(labelTypo?.text)}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'DataTimeline': {
      const events: TimelineEvent[] = parseCsv(primaryText).map(s => {
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0) {
          return { year: s.slice(0, colonIdx).trim(), label: s.slice(colonIdx + 1).trim() };
        }
        return { year: '—', label: s };
      });
      return (
        <DataTimeline
          events={events.length > 0 ? events : [{ year: '?', label: primaryText }]}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'DataStatsCards': {
      const stats: StatCard[] = parseCsv(primaryText).map(s => {
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0) {
          return { value: s.slice(0, colonIdx).trim(), label: s.slice(colonIdx + 1).trim() };
        }
        return { value: s, label: '' };
      });
      return (
        <DataStatsCards
          stats={stats.length > 0 ? stats : [{ value: primaryText, label: sanitizeLabel(labelTypo?.text) ?? '' }]}
          backgroundColor={bgColor}
          accentColor={accentColor}
        />
      );
    }

    // ── Layout primitives ────────────────────────────────────────────────────

    case 'LayoutGiantNumber':
      return (
        <LayoutGiantNumber
          number={primaryText}
          label={sanitizeLabel(labelTypo?.text)}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={accentFont}
        />
      );

    case 'LayoutSplitContrast': {
      const [left, right] = primaryText.includes(' vs ')
        ? primaryText.split(' vs ')
        : primaryText.includes('/')
        ? primaryText.split('/')
        : [primaryText, bodyTypo?.text ?? ''];
      return (
        <LayoutSplitContrast
          leftText={(left ?? primaryText).trim()}
          rightText={(right ?? '').trim()}
          leftColor={bgColor}
          rightColor={accentColor}
        />
      );
    }

    case 'LayoutFullscreenType':
      return (
        <LayoutFullscreenType
          text={primaryText}
          accentWord={beat.emphasis_keyword}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={accentFont}
        />
      );

    case 'LayoutMultiColumn': {
      const cols: ColumnData[] = parseCsv(primaryText).map(s => {
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0) {
          return { title: s.slice(0, colonIdx).trim(), body: s.slice(colonIdx + 1).trim() };
        }
        return { title: s, body: '' };
      });
      return (
        <LayoutMultiColumn
          columns={cols.length > 0 ? cols : [{ title: primaryText, body: bodyTypo?.text ?? '' }]}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={bodyFont}
        />
      );
    }

    // ── Shape primitives ─────────────────────────────────────────────────────

    case 'ShapeCircularProgress': {
      const pct = parseFloat(primaryText.replace(/[^0-9.]/g, '')) || 75;
      return (
        <ShapeCircularProgress
          progress={pct}
          label={sanitizeLabel(labelTypo?.text) ?? beat.emphasis_keyword}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'ShapeSpinningRings':
      return <ShapeSpinningRings accentColor={accentColor} backgroundColor={bgColor} />;

    // ── Particle primitives ──────────────────────────────────────────────────

    case 'ParticleShootingStars':
      return <ParticleShootingStars accentColor={accentColor} backgroundColor={bgColor} />;

    case 'ParticleSparks':
      return <ParticleSparks accentColor={accentColor} backgroundColor={bgColor} />;

    // ── Cinematic primitives ─────────────────────────────────────────────────

    case 'CinematicDocumentary':
      return (
        <CinematicDocumentary
          title={primaryText}
          subtitle={sanitizeLabel(labelTypo?.text) ?? beat.visual.value}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );

    case 'CinematicNoir':
      return <CinematicNoir accentColor={accentColor} backgroundColor={bgColor} />;

    case 'CinematicSciFi':
      return <CinematicSciFi accentColor={accentColor} backgroundColor={bgColor} />;

    // ── Background primitives ────────────────────────────────────────────────

    case 'BackgroundAurora':
      return <BackgroundAurora color1={accentColor} backgroundColor={bgColor} />;

    case 'BackgroundGeometric':
      return <BackgroundGeometric accentColors={[accentColor]} backgroundColor={bgColor} />;

    // ── Effect overlays ──────────────────────────────────────────────────────

    case 'EffectFilmGrain':
      return <EffectFilmGrain opacity={0.06} />;

    case 'EffectLightLeak':
      return <EffectLightLeak warmColor={accentColor} />;

    case 'EffectVHS':
      return <EffectVHS />;

    case 'EffectGlow':
      return <EffectGlow accentColor={accentColor} />;

    case 'TypographicCard':
    default:
      return (
        <TypographicCard
          value={primaryText || beat.visual.value || beat.emphasis_keyword || '?'}
          kindHint={
            beat.visual.kind !== 'none' && beat.visual.kind !== 'typography'
              ? beat.visual.kind
              : undefined
          }
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
  suppressPrimitive?: boolean; // true on celestial/anatomy — visual handles itself
}

export const ShotBriefLayer: React.FC<ShotBriefLayerProps> = ({
  beat,
  accentColor,
  bgColor,
  bodyFont,
  accentFont,
  suppressPrimitive = false,
}) => {
  const { height: videoHeight } = useVideoConfig();
  const brief = beat.shotBrief;
  if (!brief) {
    throw new Error(
      `ShotBriefLayer: beat "${beat.beatId}" has no shotBrief. Shot-brief compilation ` +
      `is now required to succeed (or abort the channel render) before Remotion ever ` +
      `runs — reaching this component without one is a pipeline invariant violation, ` +
      `not a case to render around.`
    );
  }

  // When the host composition already renders the full-screen visual (planet / brain),
  // only emit the ShotBrief glow atmosphere — skip the primitive card entirely.
  if (suppressPrimitive) {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <GlowOverlays brief={brief} />
      </AbsoluteFill>
    );
  }

  // Derive duotone accent colors from typography for resolved-asset path.
  // typography is nominally required on ShotBrief, but — like safeZones
  // above — nothing on the Python side enforces its presence in the raw LLM
  // JSON, so a malformed brief can reach here with it undefined.
  const typography = brief.typography ?? [];
  const accent1Color = typography.find((t) => t.role === 'accent')?.color
    ?? typography.find((t) => t.role === 'primary')?.color
    ?? accentColor;
  const accent2Color = typography.find((t) => t.role === 'label')?.color
    ?? typography.find((t) => t.role === 'body')?.color
    ?? '#7700cc';

  // Resolved-asset-first: real imagery always wins, wrapped in Shot Brief positioning.
  const hasRealAsset = hasRenderableResolvedAsset(beat);

  const content = (hasRealAsset && brief.primitive !== 'AnimatedIcon')
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

  const { xPct, widthPct, heightPct } = brief.composition.primaryAnchor;
  const yPct = clampYPctToSafeZone(brief, videoHeight);
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
