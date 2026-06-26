/**
 * Ch3Composition — Redacted channel (ch3).
 * Special Elite font / #080808 bg / #cc0000 accent.
 */

import '@fontsource/special-elite';
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
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
import { AntiqueCamera3D } from './AntiqueCamera3D';
import { ClassifiedObject3D } from './ClassifiedObject3D';
import type { ClassifiedVariant } from './ClassifiedObject3D';
import { ClassifiedStamp } from './ClassifiedStamp';

const CFG = CHANNEL_CONFIGS.ch3;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const frame = useCurrentFrame();
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
  const isFullscreen = hasAsset && kind !== 'none' && kind !== 'stat';
  const isHookCtx    = beat.sectionKey === 'hook' || beat.sectionKey === 'context';
  const isTwist      = beat.sectionKey === 'twist';
  const hasShotBrief = !!shotBrief;

  return (
    <AbsoluteFill>
      {/* 1. Background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* Scanline texture */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 4px)',
        }}
      />

      {/* 2. Asset — full screen, only when no shotBrief */}
      {isFullscreen && !hasShotBrief && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}
      {isFullscreen && !hasShotBrief && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 700,
            background: `linear-gradient(to top, ${CFG.colors.bgPrimary}f7 0%, transparent 100%)`,
          }}
        />
      )}

      {/* 3. Gradient scrim */}
      {isFullscreen && !hasShotBrief && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 680,
          background: `linear-gradient(to top, ${CFG.colors.bgPrimary}f5 0%, ${CFG.colors.bgPrimary}66 55%, transparent 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* 4. ShotBrief-driven layout */}
      {hasShotBrief && !isTwist && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* 5. Channel fallback visual */}
      {!isFullscreen && !hasShotBrief && !isTwist && (() => {
        if (isHookCtx) return <AntiqueCamera3D />;
        const sk = beat.sectionKey ?? '';
        const beatNum = sk.startsWith('beat_') ? parseInt(sk.replace('beat_', ''), 10) : 0;
        const BEAT_VARIANTS: ClassifiedVariant[] = ['file', 'eye', 'lock', 'signal', 'file'];
        const variant = BEAT_VARIANTS[beatNum % BEAT_VARIANTS.length];
        return <ClassifiedObject3D variant={variant} />;
      })()}

      {/* Classified stamp on twist */}
      {isTwist && <ClassifiedStamp delayFrames={24} />}

      {/* Red top rule */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(to right, transparent, ${CFG.colors.accent1}, transparent)`,
          opacity: 0.85,
        }}
      />

      {/* 6. Beat audio */}
      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      {/* Red cut flash */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: CFG.colors.accent1,
          opacity: interpolate(frame, [0, 8], [0.22, 0], { extrapolateRight: 'clamp' }),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const Ch3Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
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
      <Soundtrack channelId="ch3" musicVolume={0.12} />
      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />
      <SfxLayer soundDesign={soundDesign ?? []} />
      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={timedBeats}
          channelId="ch3"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
