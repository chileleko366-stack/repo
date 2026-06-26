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
import { AbsoluteFill } from 'remotion';
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
  BackgroundAurora,
  BackgroundGeometric,
  BackgroundSaaSLight,
  EffectFilmGrain,
  EffectGlow,
  SaaSCard,
  OrbitalHub,
  CursorClick,
  CardGrid,
  HexCarousel,
  StarTransition,
  BackgroundDotGrid,
  FlowConnector,
  LightSweep,
  UIMockup,
  AvatarOrbit,
  EffectVignette,
  TextHorizontalSlide,
  Card3DFlip,
  GradientBorder,
  ChatBubbles,
  Histogram,
  PieChart,
  Scene3D,
  SocialFrame,
  StaggeredSequence,
} from './primitives';
import type { CarouselPanel } from './primitives/HexCarousel';
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
  const { primitive, channelId, typography } = brief;
  const primaryTypo = typography.find((t) => t.role === 'primary');
  const labelTypo   = typography.find((t) => t.role === 'label');
  const bodyTypo    = typography.find((t) => t.role === 'body');
  const primaryText = primaryTypo?.text ?? beat.emphasis_keyword ?? '';
  const primaryColor = primaryTypo?.color ?? '#ffffff';

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

    case 'GlassCard':
      return (
        <GlassCard
          primary={primaryText}
          label={sanitizeLabel(labelTypo?.text)}
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

    // ── Background primitives ────────────────────────────────────────────────

    case 'BackgroundAurora':
      return <BackgroundAurora color1={accentColor} backgroundColor={bgColor} />;

    case 'BackgroundGeometric':
      return <BackgroundGeometric accentColors={[accentColor]} backgroundColor={bgColor} />;

    case 'BackgroundSaaSLight':
      return <BackgroundSaaSLight />;

    // ── Effect overlays ──────────────────────────────────────────────────────

    case 'EffectFilmGrain':
      return <EffectFilmGrain opacity={0.06} />;

    case 'EffectGlow':
      return <EffectGlow accentColor={accentColor} />;

    // ── SaaS / motion-graphic primitives ────────────────────────────────────

    case 'SaaSCard':
      return (
        <SaaSCard
          primary={primaryText}
          label={sanitizeLabel(labelTypo?.text)}
          body={bodyTypo?.text}
          accentColor={accentColor}
        />
      );

    case 'OrbitalHub': {
      const orbitWords = parseCsv(primaryText);
      return (
        <OrbitalHub
          keywords={orbitWords.length >= 2 ? orbitWords : ['Speed', 'Scale', 'Trust', 'Value']}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'CursorClick':
      return (
        <CursorClick
          accentColor={accentColor}
          backgroundColor={bgColor}
          label={sanitizeLabel(labelTypo?.text)}
        />
      );

    case 'CardGrid': {
      const gridItems = parseCsv(primaryText).map(s => {
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0) return { title: s.slice(0, colonIdx).trim(), value: s.slice(colonIdx + 1).trim() };
        return { title: s, value: undefined };
      });
      return (
        <CardGrid
          cards={gridItems.length >= 2 ? gridItems : undefined}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    // ── Lesson 3 carousel primitives ────────────────────────────────────────

    case 'HexCarousel': {
      const carouselPanels: CarouselPanel[] = parseCsv(primaryText).map(s => {
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0) return { title: s.slice(0, colonIdx).trim(), body: s.slice(colonIdx + 1).trim() };
        return { title: s };
      });
      return (
        <HexCarousel
          panels={carouselPanels.length >= 2 ? carouselPanels : undefined}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'StarTransition':
      return <StarTransition accentColor={accentColor} backgroundColor={bgColor} />;

    // ── Lesson 4 primitives ──────────────────────────────────────────────────────

    case 'BackgroundDotGrid':
      return (
        <BackgroundDotGrid
          dotColor={accentColor + '55'}
          backgroundColor={bgColor}
        />
      );

    case 'UIMockup':
      return (
        <UIMockup
          title={beat.emphasis_keyword?.toUpperCase() ?? primaryText ?? 'Workspace'}
          subtitle={bodyTypo?.text ?? beat.narration.slice(0, 50)}
          buttonLabel={sanitizeLabel(labelTypo?.text) ?? 'Explore'}
          accentColor={accentColor}
          backgroundColor={bgColor === '#ffffff' || bgColor.startsWith('#f') ? bgColor : '#f8f8fc'}
          fontFamily={bodyFont}
          accentFont={accentFont}
        />
      );

    case 'FlowConnector': {
      // Parse beat.visual.value as CSV labels (VisualTag has no items field)
      const csvLabels = parseCsv(beat.visual.value ?? primaryText);
      const nodes = csvLabels.length >= 2
        ? csvLabels.map((lbl, i) => ({
            label: lbl,
            color: accentColor,
            xPct: 15 + (i / Math.max(csvLabels.length - 1, 1)) * 70,
            yPct: 50,
          }))
        : [
            { label: 'Input',   color: accentColor, xPct: 15, yPct: 50 },
            { label: 'Process', color: accentColor, xPct: 50, yPct: 50 },
            { label: 'Output',  color: accentColor, xPct: 85, yPct: 50 },
          ];
      return (
        <FlowConnector
          nodes={nodes}
          lineColor={accentColor + '55'}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={bodyFont}
        />
      );
    }

    case 'LightSweep':
      return (
        <LightSweep sweepColor="rgba(255,255,255,0.5)" startFrame={0} duration={25}>
          <GlassCard
            primary={primaryText ?? beat.emphasis_keyword ?? ''}
            label={sanitizeLabel(labelTypo?.text)}
            body={bodyTypo?.text}
            accentColor={accentColor}
            backgroundColor={bgColor}
            fontFamily={bodyFont}
            accentFont={accentFont}
          />
        </LightSweep>
      );

    case 'AvatarOrbit': {
      // Parse beat.visual.value as CSV labels (VisualTag has no items field)
      const csvLabels = parseCsv(beat.visual.value ?? primaryText);
      const AVATAR_COLORS = [accentColor, '#3b82f6', '#ef4444', '#f59e0b', '#10b981'];
      const avatars = csvLabels.length >= 2
        ? csvLabels.slice(0, 5).map((lbl, i) => ({
            initial: lbl.charAt(0).toUpperCase(),
            color: AVATAR_COLORS[i % AVATAR_COLORS.length],
          }))
        : [
            { initial: 'A', color: accentColor },
            { initial: 'B', color: '#3b82f6' },
            { initial: 'C', color: '#ef4444' },
            { initial: 'D', color: '#f59e0b' },
          ];
      return (
        <AvatarOrbit
          avatars={avatars}
          centreLabel={beat.emphasis_keyword?.toUpperCase().slice(0, 6) ?? 'HUB'}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={bodyFont}
        />
      );
    }

    // ── Lesson 5 primitives ──────────────────────────────────────────────────────

    case 'EffectVignette':
      return (
        <EffectVignette strength={0.6}>
          <GlassCard
            primary={primaryText}
            label={sanitizeLabel(labelTypo?.text)}
            body={bodyTypo?.text}
            accentColor={accentColor}
            backgroundColor={bgColor}
            fontFamily={bodyFont}
            accentFont={accentFont}
          />
        </EffectVignette>
      );

    case 'TextHorizontalSlide':
      return (
        <TextHorizontalSlide
          text={primaryText}
          color={primaryTypo?.color ?? '#ffffff'}
          accentColor={accentColor}
          fontSize={primaryTypo?.sizePx ?? 72}
          backgroundColor={bgColor}
          fontFamily={bodyFont}
        />
      );

    case 'Card3DFlip': {
      const colonIdx = primaryText.indexOf(':');
      const cardTitle = colonIdx > 0 ? primaryText.slice(0, colonIdx).trim() : (beat.emphasis_keyword ?? primaryText);
      const cardValue = colonIdx > 0 ? primaryText.slice(colonIdx + 1).trim() : undefined;
      return (
        <Card3DFlip
          title={cardTitle.toUpperCase()}
          value={cardValue}
          subtitle={bodyTypo?.text}
          accentColor={accentColor}
          backgroundColor={bgColor}
          cardColor={bgColor === '#ffffff' || bgColor.startsWith('#f') ? bgColor : '#ffffff'}
          fontFamily={bodyFont}
          accentFont={accentFont}
        />
      );
    }

    case 'GradientBorder':
      return (
        <GradientBorder
          primary={primaryText}
          body={bodyTypo?.text}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );

    case 'ChatBubbles':
      return <ChatBubbles accentColor={accentColor} backgroundColor={bgColor} />;

    case 'Histogram':
      return <Histogram accentColor={accentColor} backgroundColor={bgColor} />;

    case 'PieChart':
      return <PieChart accentColor={accentColor} backgroundColor={bgColor} />;

    case 'Scene3D':
      return <Scene3D accentColor={accentColor} backgroundColor={bgColor} />;

    case 'SocialFrame':
      return <SocialFrame accentColor={accentColor} backgroundColor={bgColor} />;

    case 'StaggeredSequence':
      return <StaggeredSequence accentColor={accentColor} backgroundColor={bgColor} />;

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
  const brief = beat.shotBrief;
  if (!brief) return null;

  // When the host composition already renders the full-screen visual (planet / brain),
  // only emit the ShotBrief glow atmosphere — skip the primitive card entirely.
  if (suppressPrimitive) {
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <GlowOverlays brief={brief} />
      </AbsoluteFill>
    );
  }

  // Derive duotone accent colors from typography for resolved-asset path
  const accent1Color = brief.typography.find((t) => t.role === 'accent')?.color
    ?? brief.typography.find((t) => t.role === 'primary')?.color
    ?? accentColor;
  const accent2Color = brief.typography.find((t) => t.role === 'label')?.color
    ?? brief.typography.find((t) => t.role === 'body')?.color
    ?? '#7700cc';

  // Resolved-asset-first: real imagery always wins, wrapped in Shot Brief positioning.
  // Check that the asset actually has renderable content (path != null, svgString, or map_image).
  const hasRealAsset = (() => {
    const ra = beat.resolvedAsset;
    if (!ra) return false;
    const a = ra as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();

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
