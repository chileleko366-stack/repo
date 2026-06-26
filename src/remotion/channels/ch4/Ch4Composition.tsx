/**
 * Ch4Composition — The Grey Matter (neuroscience).
 * Fraunces body / Anton accent / #12121e bg / #e94560 accent / #4cc9f0 accent2.
 */

import '@fontsource/fraunces';
import '@fontsource/anton';
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
import { HardCutFlash } from './HardCutFlash';
import { NeuroObject3D } from './NeuroObject3D';
import type { NeuroVariant } from './NeuroObject3D';
import { ThreeBrain } from './ThreeBrain';

const CFG = CHANNEL_CONFIGS.ch4;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
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
  const hasShotBrief = !!shotBrief;

  const isFullscreen =
    hasAsset && !isAnatomy && kind !== 'none' && kind !== 'stat' && kind !== 'celestial';

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

      {/* Anatomy: 3-D brain (procedural ThreeCanvas) */}
      {isAnatomy && <ThreeBrain durationFrames={durationFrames} />}

      {/* 3. Gradient scrim */}
      {(isFullscreen || isAnatomy) && !hasShotBrief && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 680,
            background: `linear-gradient(to top, ${CFG.colors.bgPrimary}f5 0%, ${CFG.colors.bgPrimary}66 55%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 4. ShotBrief-driven mograph */}
      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
          suppressPrimitive={isAnatomy}
        />
      )}

      {/* 5. Channel fallback visual — procedural ThreeCanvas neuro objects */}
      {!isAnatomy && !isFullscreen && !hasShotBrief && (() => {
        const sk = beat.sectionKey ?? '';
        const beatNum = sk.startsWith('beat_') ? parseInt(sk.replace('beat_', ''), 10) : 0;
        const BEAT_VARIANTS: NeuroVariant[] = ['neuron', 'synapse', 'cortex', 'signal', 'neuron'];
        const variant: NeuroVariant =
          sk === 'hook' ? 'neuron' :
          sk === 'context' ? 'cortex' :
          BEAT_VARIANTS[beatNum % BEAT_VARIANTS.length];
        return <NeuroObject3D variant={variant} />;
      })()}

      {/* 6. Beat audio */}
      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent2} peakOpacity={0.35} />
    </AbsoluteFill>
  );
};

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
    <AbsoluteFill style={{ background: CFG.colors.bgPrimary, fontFamily: CFG.bodyFont }}>
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
