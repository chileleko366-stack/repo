/**
 * Ch1Composition — Dopamine Loop channel (ch1).
 *
 * Renders all sections from the manifest inside speech-rhythm TransitionSeries.
 * Layout per beat:
 *   ─ Background fill (beat.bg_color || channel bgPrimary)
 *   ─ AssetLayer       (person/brand/place/map — full-screen, only when no shotBrief)
 *   ─ Gradient scrim   (bottom fade, asset beats only)
 *   ─ ShotBriefLayer   (when shotBrief is present)
 *   ─ SocialFigure3D   (non-asset non-shotbrief beats — procedural ThreeCanvas)
 *   ─ Beat audio       (<Audio> per beat voiceover)
 * Global:
 *   ─ Soundtrack       (music bed)
 *   ─ SfxLayer         (SFX events from manifest.soundDesign)
 *   ─ CaptionTrack     (word-level captioneer captions)
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
import { ShotBriefLayer } from '../../mograph/ShotBriefLayer';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { BeatCompositor, buildTimedBeats } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { HardCutFlash } from './HardCutFlash';
import { SocialFigure3D } from './SocialFigure3D';
import type { SocialFigureVariant } from './SocialFigure3D';

const CFG = CHANNEL_CONFIGS.ch1;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind = visual.kind;
  const bg   = bg_color || CFG.colors.bgPrimary;

  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();

  const isFullscreen =
    hasAsset && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  const hasShotBrief = !!shotBrief;

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

      {/* 4. ShotBrief-driven mograph */}
      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* 5. Channel fallback — procedural ThreeCanvas social figure */}
      {!isFullscreen && !hasShotBrief && (() => {
        const sk = beat.sectionKey ?? '';
        const beatNum = sk.startsWith('beat_') ? parseInt(sk.replace('beat_', ''), 10) : 0;
        const BEAT_VARIANTS: SocialFigureVariant[] = ['figure', 'crowd', 'mirror'];
        const variant: SocialFigureVariant =
          sk === 'hook' ? 'figure' :
          sk === 'context' ? 'crowd' :
          sk === 'outro' ? 'shadow' :
          BEAT_VARIANTS[beatNum % BEAT_VARIANTS.length];
        return <SocialFigure3D variant={variant} />;
      })()}

      {/* 6. Beat audio */}
      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      {/* Flash */}
      <HardCutFlash color="#d400ff" peakOpacity={0.45} />
    </AbsoluteFill>
  );
};

export const Ch1Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  const { beats, soundDesign, fps, script } = manifest;

  const wordBoundaries = useWordBoundaries(beats);

  const audioDurationsMs: Record<string, number> = {};
  const pauseAfterMap: Record<string, 'breath' | 'beat' | 'cut'> = {};
  beats.forEach((b) => {
    if (b.audio?.durationMs) audioDurationsMs[b.beatId] = b.audio.durationMs;
  });
  (script?.beats ?? []).forEach((sb, i) => {
    pauseAfterMap[`beat_${i}`] = (sb as { pause_after?: 'breath' | 'beat' | 'cut' }).pause_after ?? 'cut';
  });

  const timedBeats: TimedBeat[] = buildTimedBeats(beats, fps ?? 30, audioDurationsMs, pauseAfterMap);

  return (
    <AbsoluteFill style={{ background: CFG.colors.bgPrimary, fontFamily: CFG.bodyFont }}>
      <Soundtrack channelId="ch1" musicVolume={0.15} />

      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />

      <SfxLayer soundDesign={soundDesign ?? []} />

      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={timedBeats}
          channelId="ch1"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
