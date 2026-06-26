/**
 * Ch6Composition — Red Space Facts (astronomy).
 * Orbitron body / #050010 bg / #ff4500 accent1 / #a0c4ff accent2.
 */

import '@fontsource/orbitron';
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
import { CelestialBody } from './CelestialBody';
import { CosmicObject3D } from './CosmicObject3D';
import type { CosmicVariant } from './CosmicObject3D';
import { HardCutFlash } from './HardCutFlash';
import { Starfield } from './Starfield';

const CFG = CHANNEL_CONFIGS.ch6;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind        = visual.kind;
  const bg          = bg_color || CFG.colors.bgPrimary;
  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();
  const isCelestial  = kind === 'celestial';
  const hasShotBrief = !!shotBrief;

  const isFullscreen =
    hasAsset && !isCelestial && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy';

  const needsScrim = isFullscreen || isCelestial;

  return (
    <AbsoluteFill>
      {/* 1. Background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* Stars always present (parallax layer beneath everything) */}
      <Starfield />

      {/* 2. Asset — full screen, only when no shotBrief */}
      {isFullscreen && !hasShotBrief && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}

      {/* Celestial 3-D sphere */}
      {isCelestial && (
        <CelestialBody
          bodyName={beat.visual.value ?? 'Jupiter'}
          durationInFrames={durationFrames}
        />
      )}

      {/* 3. Gradient scrim */}
      {needsScrim && !hasShotBrief && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 700,
            background: 'linear-gradient(to top, rgba(5,0,16,0.97) 0%, rgba(5,0,16,0.4) 65%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 4. ShotBrief-driven layout — skip on celestial (planet owns the frame) */}
      {hasShotBrief && !isCelestial && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* 5. Channel fallback — cosmic 3-D objects for non-asset, non-celestial beats */}
      {!isCelestial && !isFullscreen && !hasShotBrief && (() => {
        const sk = beat.sectionKey ?? '';
        const beatNum = sk.startsWith('beat_') ? parseInt(sk.replace('beat_', ''), 10) : 0;
        const BEAT_VARIANTS: CosmicVariant[] = ['planet', 'nebula', 'satellite', 'blackhole', 'asteroid'];
        const variant: CosmicVariant =
          sk === 'hook' ? 'star' :
          sk === 'context' ? 'wormhole' :
          BEAT_VARIANTS[beatNum % BEAT_VARIANTS.length];
        return <CosmicObject3D variant={variant} />;
      })()}

      {/* 6. Beat audio */}
      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent1} peakOpacity={0.4} />
    </AbsoluteFill>
  );
};

export const Ch6Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
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
      <Soundtrack channelId="ch6" musicVolume={0.20} />

      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />

      <SfxLayer soundDesign={soundDesign ?? []} />

      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={timedBeats}
          channelId="ch6"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
