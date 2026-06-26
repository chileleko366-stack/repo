/**
 * Ch5Composition — The Quiet Record (untold history).
 * EB Garamond body / Fraunces accent / #100d08 bg / #c8a96e accent.
 */

import '@fontsource/eb-garamond';
import '@fontsource/fraunces';
import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
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
import { FilmGrain } from './FilmGrain';
import { HardCutFlash } from './HardCutFlash';
import { HistoricalArtifact3D } from './HistoricalArtifact3D';
import { PeriodObject3D } from './PeriodObject3D';
import type { PeriodVariant } from './PeriodObject3D';

const CFG = CHANNEL_CONFIGS.ch5;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
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
      {/* 1. Background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* 2. Asset — full screen, only when no shotBrief */}
      {isFullscreen && !hasShotBrief && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}

      {/* Vignette — always present */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* 3. Gradient scrim */}
      {isFullscreen && !hasShotBrief && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 680,
            background: `linear-gradient(to top, ${CFG.colors.bgPrimary}f5 0%, ${CFG.colors.bgPrimary}66 55%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 4. ShotBrief-driven layout */}
      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* 5. Channel fallback — horizontal line for bare beats, period 3D objects otherwise */}
      {!isFullscreen && !hasShotBrief && (() => {
        const sk = beat.sectionKey ?? '';
        if (sk === 'hook') return <HistoricalArtifact3D variant="artifact" />;
        if (sk === 'context') return <HistoricalArtifact3D variant="relic" />;
        const beatNum = sk.startsWith('beat_') ? parseInt(sk.replace('beat_', ''), 10) : 0;
        const BEAT_VARIANTS: PeriodVariant[] = ['sword', 'vessel', 'crown', 'torch', 'sword'];
        const variant = BEAT_VARIANTS[beatNum % BEAT_VARIANTS.length];
        return <PeriodObject3D variant={variant} />;
      })()}

      {/* 6. Beat audio */}
      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash />
    </AbsoluteFill>
  );
};

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
    <AbsoluteFill style={{ background: CFG.colors.bgPrimary, fontFamily: CFG.bodyFont }}>
      <Soundtrack channelId="ch5" musicVolume={0.14} />

      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />

      <SfxLayer soundDesign={soundDesign ?? []} />

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
