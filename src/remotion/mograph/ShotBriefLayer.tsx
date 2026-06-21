/**
 * ShotBriefLayer — routes a compiled ShotBrief to the correct primitive.
 *
 * Each channel's composition passes `brief` + `beat` here. The switch on
 * `brief.primitive` determines which bespoke or generic component renders.
 *
 * Channel-gating rules:
 *  CelestialBody   — ch6 only
 *  ThreeBrain      — ch4 only
 *  CandlestickChart — ch2 only
 *  ScrambleReveal / ClassifiedStamp / GlitchWord — ch3 only
 *  ResolvedAssetImage / AnimatedIcon / generic primitives — any channel
 *
 * ResolvedAssetImage is checked BEFORE primitive routing when beat.resolvedAsset
 * is present — a beat with a fetched photo should never fall through to a text card.
 */

import React from 'react';
import type { ShotBrief } from '../../pipeline/shotBrief';
import type { ManifestBeat } from '../../pipeline/types';
import { AssetLayer } from '../assets/AssetLayer';
import { CelestialBody } from '../channels/ch6/CelestialBody';
import { ThreeBrain } from '../channels/ch4/ThreeBrain';
import { CandlestickChart } from '../channels/ch2/CandlestickChart';
import { ScrambleReveal } from '../channels/ch3/ScrambleReveal';
import { ClassifiedStamp } from '../channels/ch3/ClassifiedStamp';
import { GlitchWord } from '../channels/ch3/GlitchWord';
import { GlassCard } from './primitives/GlassCard';
import { Typewriter } from './primitives/Typewriter';
import { WordCarousel } from './primitives/WordCarousel';
import { ProgressBar } from './primitives/ProgressBar';
import { TypographicCard } from './primitives/TypographicCard';
import { AnimatedIcon } from './primitives/AnimatedIcon';
import type { IconName } from './primitives/AnimatedIcon';

interface ShotBriefLayerProps {
  brief: ShotBrief;
  beat: ManifestBeat;
}

export const ShotBriefLayer: React.FC<ShotBriefLayerProps> = ({ brief, beat }) => {
  const { primitive, channelId, background, typography } = brief;
  const bgColor = background.color;
  const accentTypo = typography.find((t) => t.role === 'primary' || t.role === 'accent');
  const accentColor = accentTypo?.color ?? '#d400ff';
  const primaryTypo = typography.find((t) => t.role === 'primary');
  const primaryText = primaryTypo?.text ?? beat.emphasis_keyword ?? '';

  const accent1Color = typography.find((t) => t.role === 'accent')?.color
    ?? primaryTypo?.color
    ?? '#d400ff';
  const accent2Color = typography.find((t) => t.role === 'label')?.color
    ?? typography.find((t) => t.role === 'body')?.color
    ?? '#7700cc';

  // If the beat has a resolved photo/brand/map asset, render it regardless of
  // what primitive the shot brief specified — real imagery always wins.
  if (beat.resolvedAsset && primitive !== 'AnimatedIcon') {
    return (
      <AssetLayer
        beat={beat}
        durationFrames={beat.durationFrames}
        accentColors={{ primary: accent1Color, secondary: accent2Color }}
      />
    );
  }

  switch (primitive) {
    // ── Channel-specific bespoke components ─────────────────────────────────

    case 'CelestialBody':
      if (channelId !== 'ch6') return <FallbackCard brief={brief} beat={beat} />;
      return (
        <CelestialBody
          bodyName={beat.visual.value ?? 'Jupiter'}
          durationInFrames={beat.durationFrames}
        />
      );

    case 'ThreeBrain':
      if (channelId !== 'ch4') return <FallbackCard brief={brief} beat={beat} />;
      return <ThreeBrain />;

    case 'CandlestickChart':
      if (channelId !== 'ch2') return <FallbackCard brief={brief} beat={beat} />;
      return <CandlestickChart durationFrames={beat.durationFrames} />;

    case 'ScrambleReveal':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} />;
      return (
        <ScrambleReveal
          text={beat.narration}
          color={primaryTypo?.color ?? '#e0e0e0'}
          fontSize={primaryTypo?.sizePx ?? 64}
        />
      );

    case 'ClassifiedStamp':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} />;
      return <ClassifiedStamp />;

    case 'GlitchWord':
      if (channelId !== 'ch3') return <FallbackCard brief={brief} beat={beat} />;
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

    case 'GlassCard': {
      const labelTypo = typography.find((t) => t.role === 'label');
      const bodyTypo  = typography.find((t) => t.role === 'body');
      return (
        <GlassCard
          primary={primaryText}
          label={labelTypo?.text}
          body={bodyTypo?.text}
          accentColor={accentColor}
          backgroundColor={bgColor}
          fontFamily={primaryTypo?.font === 'accent' ? undefined : undefined}
        />
      );
    }

    case 'Typewriter': {
      return (
        <Typewriter
          text={primaryText}
          highlightWord={beat.emphasis_keyword}
          highlightColor={accentColor}
          color={primaryTypo?.color ?? '#ffffff'}
          backgroundColor={bgColor}
        />
      );
    }

    case 'WordCarousel': {
      const words = primaryText.split(',').map((w) => w.trim()).filter(Boolean);
      return (
        <WordCarousel
          words={words.length > 0 ? words : [primaryText]}
          wordColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

    case 'ProgressBar': {
      const pct = typeof beat.visual.stat_value === 'number' ? beat.visual.stat_value : 75;
      return (
        <ProgressBar
          label={primaryText}
          targetPct={pct}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );
    }

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
};

const FallbackCard: React.FC<ShotBriefLayerProps> = ({ brief, beat }) => {
  const primaryTypo = brief.typography.find((t) => t.role === 'primary');
  return (
    <TypographicCard
      value={primaryTypo?.text ?? beat.emphasis_keyword ?? beat.visual.value ?? '?'}
      kindHint={beat.visual.kind !== 'none' ? beat.visual.kind : undefined}
      accentColor={primaryTypo?.color ?? '#ffffff'}
      backgroundColor={brief.background.color}
    />
  );
};
