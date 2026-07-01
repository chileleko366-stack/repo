/**
 * Ch4Composition — The Grey Matter (neuroscience / psychology).
 *
 * Layout per beat:
 *   ─ Background fill
 *   ─ AssetLayer      (full-screen for person/brand/place/map)
 *   ─ ThreeBrain      (anatomy beats — real BrainStem.glb 3D model, via ShotBriefLayer suppressPrimitive)
 *   ─ Gradient scrim
 *   ─ ShotBriefLayer  (brief-driven primitive/positioning/depth for every beat)
 *   ─ Beat audio
 *   ─ HardCutFlash    (cyan accent flash)
 * Global: Soundtrack + SfxLayer + CaptionTrack
 */

import '@fontsource/anton';
import '@fontsource/space-grotesk';
import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import type { ManifestBeat, VideoManifest } from '../../../pipeline/types';
import { CHANNEL_CONFIGS } from '../../../pipeline/channelConfigs';
import { AssetLayer } from '../../assets/AssetLayer';
import { CaptionTrack } from '../../captions/CaptionTrack';
import { useWordBoundaries } from '../../captions/useWordBoundaries';
import { ShotBriefLayer, getShotBriefPrimaryText } from '../../mograph/ShotBriefLayer';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { BeatCompositor, buildTimedBeats } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { HeroWord } from '../../mograph/HeroWord';
import { AmbientBackground } from '../../backgrounds/AmbientBackground';
import { HardCutFlash } from '../../transitions/HardCutFlash';

const CFG = CHANNEL_CONFIGS.ch4;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Beat section ──────────────────────────────────────────────────────────────────────────────

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath } = beat;
  const kind      = visual.kind;
  const bg        = bg_color || CFG.colors.bgPrimary;
  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();
  const isAnatomy = kind === 'anatomy';

  const isFullscreen =
    hasAsset && !isAnatomy && kind !== 'none' && kind !== 'stat' && kind !== 'celestial';

  // Suppress KineticTextLayer's keyword when the shot brief's own primitive
  // already shows the same word — see getShotBriefPrimaryText.
  const shotBriefPrimaryText = getShotBriefPrimaryText(beat, isAnatomy);
  const keywordCollides = !!shotBriefPrimaryText && !!emphasis_keyword &&
    shotBriefPrimaryText.trim().toLowerCase() === emphasis_keyword.trim().toLowerCase();

  return (
    <AbsoluteFill>
      <AmbientBackground baseColor={bg} accentColor={CFG.colors.accent1} accentColor2={CFG.colors.accent2} channelId="ch4" />

      {/* Full-screen asset (person/brand/place/map) */}
      {isFullscreen && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}


      {/* Gradient scrim */}
      {(isFullscreen || isAnatomy) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 720,
            background:
              'linear-gradient(to top, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.15) 45%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ShotBrief-driven layout */}
      <ShotBriefLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        bgColor={bg}
        bodyFont={CFG.bodyFont}
        accentFont={CFG.accentFont}
        suppressPrimitive={isAnatomy}
      />

      {/* Mograph kinetic text: emphasis keyword + supporting words */}
      <KineticTextLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        accentFont={CFG.accentFont}
        bodyFont={CFG.bodyFont}
        durationFrames={durationFrames}
        suppressKeyword={keywordCollides}
      />

      {beat.heroWord && (
        <HeroWord
          word={beat.heroWord}
          accentColor={CFG.colors.accent1}
          fontFamily={CFG.accentFont}
          startFrame={0}
          durationFrames={Math.min(18, durationFrames)}
        />
      )}

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent2} peakOpacity={0.35} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────────────────────────

export const Ch4Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
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
      <Soundtrack channelId="ch4" musicVolume={0.15} />

      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />

      <SfxLayer soundDesign={soundDesign ?? []} />

      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={timedBeats}
          channelId="ch4"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
