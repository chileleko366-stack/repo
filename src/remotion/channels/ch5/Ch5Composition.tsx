/**
 * Ch5Composition — The Quiet Record (untold history).
 *
 * Layout per beat:
 *   ─ Background fill (deep sepia #100d08)
 *   ─ AssetLayer      (full-screen for person/brand/place)
 *   ─ Warm vignette   (always — corners darker)
 *   ─ DocumentaryQuote (non-asset beats: centred quote card)
 *   ─ Narration text   (asset beats: bottom anchor, EB Garamond)
 *   ─ Beat audio
 *   ─ HardCutFlash     (black fade — cinematic cut)
 * Global: Soundtrack + SfxLayer + CaptionTrack + FilmGrain
 */

import '@fontsource/eb-garamond';
import '@fontsource/fraunces';
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ManifestBeat, VideoManifest } from '../../../pipeline/types';
import { CHANNEL_CONFIGS } from '../../../pipeline/channelConfigs';
import { AssetLayer } from '../../assets/AssetLayer';
import { CaptionTrack } from '../../captions/CaptionTrack';
import { useWordBoundaries } from '../../captions/useWordBoundaries';
import { ShotBriefLayer } from '../../mograph/ShotBriefLayer';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { BeatCompositor, buildTimedBeats } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { DocumentaryQuote } from './DocumentaryQuote';
import { FilmGrain } from './FilmGrain';
import { HardCutFlash } from './HardCutFlash';
import { HistoricalArtifact3D } from './HistoricalArtifact3D';
import { PeriodObject3D } from './PeriodObject3D';
import type { PeriodVariant } from './PeriodObject3D';

const CFG = CHANNEL_CONFIGS.ch5;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Asset-beat narration (EB Garamond, bottom anchor) ─────────────────────────

const AssetNarration: React.FC<{
  text: string;
  emphasisWord: string;
}> = ({ text, emphasisWord }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterY = spring({
    frame,
    fps,
    config: { damping: 28, stiffness: 300 },
    durationInFrames: 60,
  });
  const translateY = interpolate(enterY, [0, 1], [54, 0]);
  const opacity    = interpolate(frame, [0, 32], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        padding: '0 72px',
        textAlign: 'center',
      }}
    >
      {text.split(' ').map((word, i) => {
        const isEmphasis = word.toLowerCase().includes(emphasisWord?.toLowerCase() ?? '____');
        return (
          <span
            key={i}
            style={{
              fontFamily: "'EB Garamond', serif",
              fontStyle: 'italic',
              fontSize: 60,
              fontWeight: 400,
              lineHeight: 1.45,
              color: isEmphasis ? CFG.colors.accent1 : CFG.colors.text,
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
              marginRight: 8,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ── Beat section ──────────────────────────────────────────────────────────────

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind     = visual.kind;
  const bg       = bg_color || CFG.colors.bgPrimary;
  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();
  const hasShotBrief = !!shotBrief;

  const isFullscreen =
    hasAsset &&
    kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {isFullscreen && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}

      {/* Vignette — always present */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom scrim for asset beats */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 640,
            background:
              'linear-gradient(to top, rgba(16,13,8,0.92) 0%, rgba(16,13,8,0.25) 65%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 3D artifact for non-asset, non-shotbrief beats */}
      {!isFullscreen && !hasShotBrief && (() => {
        const sk = beat.sectionKey ?? '';
        if (sk === 'hook') return <HistoricalArtifact3D variant="artifact" />;
        if (sk === 'context') return <HistoricalArtifact3D variant="relic" />;
        const beatNum = sk.startsWith('beat_') ? parseInt(sk.replace('beat_', ''), 10) : 0;
        const BEAT_VARIANTS: PeriodVariant[] = ['sword', 'vessel', 'crown', 'torch', 'sword'];
        const variant = BEAT_VARIANTS[beatNum % BEAT_VARIANTS.length];
        return <PeriodObject3D variant={variant} />;
      })()}

      {/* ShotBrief-driven layout */}
      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* Fallback: documentary quote card for non-asset beats */}
      {!hasShotBrief && !isFullscreen && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DocumentaryQuote
            text={beat.narration}
            emphasisWord={emphasis_keyword}
            accentColor={CFG.colors.accent1}
          />
        </AbsoluteFill>
      )}

      {/* Fallback: narration text on asset beats */}
      {!hasShotBrief && isFullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: 300, left: 0, right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <AssetNarration text={beat.narration} emphasisWord={emphasis_keyword} />
        </div>
      )}

      {/* Mograph kinetic text: emphasis keyword + supporting words */}
      <KineticTextLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        accentFont={CFG.accentFont}
        bodyFont={CFG.bodyFont}
        durationFrames={durationFrames}
      />

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

export const Ch5Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  const { beats, soundDesign, fps, script } = manifest;
  const wordBoundaries = useWordBoundaries(beats);

  const audioDurationsMs: Record<string, number> = {};
  const pauseAfterMap: Record<string, 'breath' | 'beat' | 'cut'> = {};
  beats.forEach((b) => { if (b.audio?.durationMs) audioDurationsMs[b.beatId] = b.audio.durationMs; });
  (script?.beats ?? []).forEach((sb, i) => {
    pauseAfterMap[`beat_${i}`] = (sb as { pause_after?: 'breath' | 'beat' | 'cut' }).pause_after ?? 'cut';
  });
  const timedBeats: TimedBeat[] = buildTimedBeats(beats, fps ?? 30, audioDurationsMs, pauseAfterMap);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      <Soundtrack channelId="ch5" musicVolume={0.14} />

      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />

      <SfxLayer soundDesign={soundDesign ?? []} />

      {/* Global film grain overlay */}
      <FilmGrain opacity={0.035} />

      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={timedBeats}
          channelId="ch5"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
