import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ShotBrief } from '../../pipeline/types';
import * as P from './primitives';

interface Props {
  brief: ShotBrief;
  beat?: Record<string, unknown>;
  accentColor?: string;
}

type PrimitiveMap = Record<string, React.ComponentType<Record<string, unknown>>>;

const PRIMITIVE_MAP: PrimitiveMap = {
  BackgroundAurora: P.BackgroundAurora as React.ComponentType<Record<string, unknown>>,
  BackgroundSaaSLight: P.BackgroundSaaSLight as React.ComponentType<Record<string, unknown>>,
  BackgroundDotGrid: P.BackgroundDotGrid as React.ComponentType<Record<string, unknown>>,
  BackgroundGeometric: P.BackgroundGeometric as React.ComponentType<Record<string, unknown>>,
  TextKinetic: P.TextKinetic as React.ComponentType<Record<string, unknown>>,
  TextMaskReveal: P.TextMaskReveal as React.ComponentType<Record<string, unknown>>,
  TextHorizontalSlide: P.TextHorizontalSlide as React.ComponentType<Record<string, unknown>>,
  TextGradient: P.TextGradient as React.ComponentType<Record<string, unknown>>,
  TextNeon: P.TextNeon as React.ComponentType<Record<string, unknown>>,
  TextGlitch: P.TextGlitch as React.ComponentType<Record<string, unknown>>,
  TextScramble: P.TextScramble as React.ComponentType<Record<string, unknown>>,
  TextWave: P.TextWave as React.ComponentType<Record<string, unknown>>,
  Text3DFlip: P.Text3DFlip as React.ComponentType<Record<string, unknown>>,
  TextCounter: P.TextCounter as React.ComponentType<Record<string, unknown>>,
  Typewriter: P.Typewriter as React.ComponentType<Record<string, unknown>>,
  WordCarousel: P.WordCarousel as React.ComponentType<Record<string, unknown>>,
  AnimatedIcon: P.AnimatedIcon as React.ComponentType<Record<string, unknown>>,
  ShapeSpinningRings: P.ShapeSpinningRings as React.ComponentType<Record<string, unknown>>,
  ShapeCircularProgress: P.ShapeCircularProgress as React.ComponentType<Record<string, unknown>>,
  EffectGlow: P.EffectGlow as React.ComponentType<Record<string, unknown>>,
  EffectFilmGrain: P.EffectFilmGrain as React.ComponentType<Record<string, unknown>>,
  EffectVignette: P.EffectVignette as React.ComponentType<Record<string, unknown>>,
  SaaSCard: P.SaaSCard as React.ComponentType<Record<string, unknown>>,
  GradientBorder: P.GradientBorder as React.ComponentType<Record<string, unknown>>,
  CursorClick: P.CursorClick as React.ComponentType<Record<string, unknown>>,
  CardGrid: P.CardGrid as React.ComponentType<Record<string, unknown>>,
  OrbitalHub: P.OrbitalHub as React.ComponentType<Record<string, unknown>>,
  HexCarousel: P.HexCarousel as React.ComponentType<Record<string, unknown>>,
  StarTransition: P.StarTransition as React.ComponentType<Record<string, unknown>>,
  UIMockup: P.UIMockup as React.ComponentType<Record<string, unknown>>,
  FlowConnector: P.FlowConnector as React.ComponentType<Record<string, unknown>>,
  AvatarOrbit: P.AvatarOrbit as React.ComponentType<Record<string, unknown>>,
  Card3DFlip: P.Card3DFlip as React.ComponentType<Record<string, unknown>>,
  BarChart: P.BarChart as React.ComponentType<Record<string, unknown>>,
  ProgressBar: P.ProgressBar as React.ComponentType<Record<string, unknown>>,
  DataGauge: P.DataGauge as React.ComponentType<Record<string, unknown>>,
  DataLineChart: P.DataLineChart as React.ComponentType<Record<string, unknown>>,
  DataRanking: P.DataRanking as React.ComponentType<Record<string, unknown>>,
  DataTimeline: P.DataTimeline as React.ComponentType<Record<string, unknown>>,
  DataStatsCards: P.DataStatsCards as React.ComponentType<Record<string, unknown>>,
  LayoutGiantNumber: P.LayoutGiantNumber as React.ComponentType<Record<string, unknown>>,
  LayoutFullscreenType: P.LayoutFullscreenType as React.ComponentType<Record<string, unknown>>,
  LayoutMultiColumn: P.LayoutMultiColumn as React.ComponentType<Record<string, unknown>>,
  LayoutSplitContrast: P.LayoutSplitContrast as React.ComponentType<Record<string, unknown>>,
  TypographicCard: P.TypographicCard as React.ComponentType<Record<string, unknown>>,
  ParticleShootingStars: P.ParticleShootingStars as React.ComponentType<Record<string, unknown>>,
  ParticleSparks: P.ParticleSparks as React.ComponentType<Record<string, unknown>>,
};

export const ShotBriefLayer: React.FC<Props> = ({ brief, beat, accentColor = '#ffffff' }) => {
  const Component = PRIMITIVE_MAP[brief.primitive];

  if (!Component) {
    console.warn(`[ShotBriefLayer] Unknown primitive: ${brief.primitive}`);
    return null;
  }

  const props: Record<string, unknown> = {
    accentColor,
    ...(brief.props ?? {}),
  };

  // Inject narration as common text props if primitive expects it
  if (beat) {
    const narration = beat['narration'] as string | undefined;
    if (narration) {
      props['text'] = props['text'] ?? narration;
      props['words'] = props['words'] ?? narration.split(' ');
    }
  }

  return (
    <AbsoluteFill>
      <Component {...props} />
    </AbsoluteFill>
  );
};
