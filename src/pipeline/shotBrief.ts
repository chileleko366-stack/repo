// Session 2.5 — Shot Brief system
// Every beat's visual specification compiled BEFORE any Remotion code runs.
// No primitive accepts loose "visual" props — only a ShotBrief object.

export interface GradientStop {
  offsetPct: number;
  color: string;
  opacity: number;
}

export interface GlowEffect {
  onElementRole: string;
  gradient: {
    kind: 'radial' | 'linear';
    angleDeg?: number;
    stops: GradientStop[];
  };
}

export interface DropShadow {
  onElementRole: string;
  offsetX: number;
  offsetY: number;
  blurPx: number;
  color: string;
  opacity: number;
}

export interface LayeredCard {
  role: string;
  zOffset: number;
  scaleAtDepth: number;
  opacityAtDepth: number;
}

export interface MotionEntry {
  elementRole: string;
  kind: 'spring' | 'interpolate';
  property: 'translateX' | 'translateY' | 'scale' | 'rotateDeg' | 'opacity' | 'clipPathInsetPct' | 'strokeDashoffset';
  from: number;
  to: number;
  startFrame: number;
  durationFrames: number;
  springConfig?: { damping: number; stiffness: number; mass?: number };
  easing?: 'easeOutCubic' | 'easeInOutCubic' | 'easeOutExpo' | 'linear';
  staggerDelayFrames?: number;
}

export interface SecondaryElement {
  role: 'label' | 'icon' | 'supportingText' | 'badge' | 'background-shape' | 'caption-reserve';
  anchor: { xPct: number; yPct: number; widthPct?: number; heightPct?: number };
  zIndex: number;
}

export interface TypographyEntry {
  role: string;
  text: string;
  font: 'body' | 'accent';
  sizePx: number;
  weight: number;
  letterSpacingEm: number;
  lineHeight: number;
  color: string;
  textGlow?: { blurPx: number; color: string; opacity: number };
}

export type CompositionGrid =
  | 'center'
  | 'thirds-upper'
  | 'thirds-lower'
  | 'left-weighted'
  | 'right-weighted'
  | 'full-bleed';

export interface ShotBrief {
  beatId: string;
  channelId: string;

  composition: {
    grid: CompositionGrid;
    primaryAnchor: { xPct: number; yPct: number; widthPct: number; heightPct: number };
    secondaryElements: SecondaryElement[];
    safeZones: {
      topReservedPx: number;
      bottomReservedPx: number;
    };
  };

  background: {
    type: 'solid';
    color: string;
    changesAtThisBeat: boolean;
  };

  depth: {
    dropShadows: DropShadow[];
    backdropBlur?: { onElementRole: string; blurPx: number; saturate: number };
    glowEffects: GlowEffect[];
    layeredCards?: LayeredCard[];
    vignette?: { intensity: number; color: string };
  };

  typography: TypographyEntry[];

  motion: MotionEntry[];

  primitive: string;
  fallbackPrimitive: string;
}

/** Build the CSS string for a gradient defined in a GlowEffect */
export function buildGradientCSS(gradient: GlowEffect['gradient']): string {
  const stops = gradient.stops
    .map((s) => `${s.color}${Math.round(s.opacity * 255).toString(16).padStart(2, '0')} ${s.offsetPct}%`)
    .join(', ');
  if (gradient.kind === 'radial') {
    return `radial-gradient(ellipse at center, ${stops})`;
  }
  return `linear-gradient(${gradient.angleDeg ?? 90}deg, ${stops})`;
}

/** Runtime validation — throws if any required structural rule is broken */
export function validateShotBrief(brief: ShotBrief, lastTwoGrids: CompositionGrid[] = []): void {
  if (brief.background.type !== 'solid') {
    throw new Error(`Beat ${brief.beatId}: background.type must be 'solid', got '${brief.background.type}'`);
  }

  if (brief.depth.dropShadows.length + brief.depth.glowEffects.length < 1) {
    throw new Error(`Beat ${brief.beatId}: zero depth elements — add at least 1 dropShadow or glowEffect`);
  }

  if (brief.motion.length === 0) {
    throw new Error(`Beat ${brief.beatId}: zero motion entries — every element needs explicit movement`);
  }

  for (const el of brief.composition.secondaryElements) {
    if (el.anchor.xPct == null || el.anchor.yPct == null) {
      throw new Error(`Beat ${brief.beatId}: secondary element "${el.role}" has no explicit anchor position`);
    }
  }

  for (const m of brief.motion) {
    if (m.kind === 'spring' && !m.springConfig) {
      throw new Error(`Beat ${brief.beatId}: motion on "${m.elementRole}" is spring but has no springConfig`);
    }
    if (m.kind === 'interpolate' && !m.easing) {
      throw new Error(`Beat ${brief.beatId}: motion on "${m.elementRole}" is interpolate but has no easing`);
    }
  }

  if (lastTwoGrids.length >= 2 && lastTwoGrids.every((g) => g === brief.composition.grid)) {
    throw new Error(
      `Beat ${brief.beatId}: composition.grid '${brief.composition.grid}' used 3+ times in a row — vary it`,
    );
  }
}
