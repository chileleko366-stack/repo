/**
 * Ch5Composition — The Quiet Record (untold history).
 *
 * Layout per beat:
 *   ─ AssetLayer      (full-screen for person/brand/place)
 *   ─ Warm vignette   (always — corners darker)
 *   ─ ShotBriefLayer  (brief-driven primitive/positioning/depth for every beat)
 *   ─ Beat audio
 *   ─ HardCutFlash     (black fade — cinematic cut)
 * Global: AmbientBackground (one instance for the whole video — see
 *   BeatCompositor.tsx's useActiveBeatBgColor; NOT per-beat, since a
 *   per-beat instance would be nested inside BeatCompositor's
 *   TransitionSeries.Sequence and visibly slide/wipe with each beat's
 *   transition instead of staying fixed) + Soundtrack + SfxLayer +
 *   CaptionTrack + FilmGrain
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
import { BeatCompositor, buildTimedBeats, useActiveBeatBgColor } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { HeroWord } from '../../mograph/HeroWord';
import { AmbientBackground } from '../../backgrounds/AmbientBackground';
import { FilmGrain } from './FilmGrain';
import { HardCutFlash } from '../../transitions/HardCutFlash';

const CFG = CHANNEL_CONFIGS.ch5;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Beat section ──────────────────────────────────────────────────────────────────────────────

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath } = beat;
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

  const isFullscreen =
    hasAsset &&
    kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  // Suppress KineticTextLayer's keyword when the shot brief's own primitive
  // already shows the same word — see getShotBriefPrimaryText.
  const shotBriefPrimaryText = getShotBriefPrimaryText(beat);
  const keywordCollides = !!shotBriefPrimaryText && !!emphasis_keyword &&
    shotBriefPrimaryText.trim().toLowerCase() === emphasis_keyword.trim().toLowerCase();

  return (
    <AbsoluteFill>
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


      {/* ShotBrief-driven layout */}
      <ShotBriefLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        bgColor={bg}
        bodyFont={CFG.bodyFont}
        accentFont={CFG.accentFont}
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

      <HardCutFlash color="#000000" peakOpacity={0.7} durationFrames={8} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────────────────────────

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
  const activeBgColor = useActiveBeatBgColor(timedBeats, CFG.colors.bgPrimary);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      {/* Ambient animated background — one instance for the whole video, see
          BeatCompositor.tsx's useActiveBeatBgColor doc comment for why. */}
      <AmbientBackground
        baseColor={activeBgColor}
        accentColor={CFG.colors.accent1}
        accentColor2={CFG.colors.accent2}
        channelId="ch5"
      />

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
