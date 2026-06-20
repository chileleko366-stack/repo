/**
 * ShotBriefLayer — bridges beat.shotBrief to the correct mograph primitive.
 *
 * When beat.shotBrief is present it:
 *   1. Positions a container using composition.primaryAnchor (xPct/yPct/widthPct/heightPct)
 *   2. Applies depth.dropShadows as CSS box-shadow
 *   3. Renders radial/linear glow overlays from depth.glowEffects
 *   4. Dispatches to the named primitive via shotBrief.primitive; falls back to TypographicCard
 *
 * Returns null when beat.shotBrief is absent so the host composition's own
 * rendering (KineticTitle / PsychCard / etc.) takes over unmodified.
 */

import React from 'react';
import type { ManifestBeat } from '../../pipeline/types';
import type { ShotBrief } from '../../pipeline/shotBrief';
import {
  GlassCard,
  Typewriter,
  WordCarousel,
  ProgressBar,
  TypographicCard,
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

interface PrimitiveProps {
  brief: ShotBrief;
  accentColor: string;
  bgColor: string;
  bodyFont: string;
  accentFont: string;
}

function PrimitiveDispatch({
  brief,
  accentColor,
  bgColor,
  bodyFont,
  accentFont,
}: PrimitiveProps): React.ReactElement {
  const typo = brief.typography;
  const primary = typo.find((t) => t.role === 'primaryAnchor') ?? typo[0];
  const label = typo.find((t) => t.role.toLowerCase().includes('label'));
  const supporting = typo.find(
    (t) => t.role.toLowerCase().includes('support') || t.role.toLowerCase().includes('body'),
  );

  const baseProps = {
    accentColor,
    backgroundColor: bgColor,
    fontFamily: bodyFont,
    accentFont,
  };

  switch (brief.primitive) {
    case 'GlassCard':
      return (
        <GlassCard
          {...baseProps}
          primary={primary?.text ?? ''}
          label={label?.text}
          body={supporting?.text}
          glowColor={accentColor}
        />
      );

    case 'Typewriter':
      return (
        <Typewriter
          text={primary?.text ?? ''}
          highlightWord={label?.text}
          highlightColor={accentColor}
          fontFamily={accentFont}
          color="#ffffff"
          backgroundColor={bgColor}
        />
      );

    case 'WordCarousel': {
      const words = (primary?.text ?? '').split(/\s+/);
      return (
        <WordCarousel
          words={words}
          wordColor={accentColor}
          fontFamily={accentFont}
          backgroundColor={bgColor}
        />
      );
    }

    case 'ProgressBar':
      return (
        <ProgressBar
          targetPct={75}
          label={primary?.text ?? ''}
          accentColor={accentColor}
          backgroundColor={bgColor}
        />
      );

    case 'TypographicCard':
    default:
      return (
        <TypographicCard
          {...baseProps}
          value={primary?.text ?? ''}
          kindHint={label?.text}
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
        <PrimitiveDispatch
          brief={brief}
          accentColor={accentColor}
          bgColor={bgColor}
          bodyFont={bodyFont}
          accentFont={accentFont}
        />
      </div>
    </div>
  );
};
