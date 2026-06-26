/**
 * Ch2Composition — FinanceFiction channel.
 * JetBrains Mono body / Space Grotesk accent / #0a0e1a bg / #00ff88 accent1.
 */

import '@fontsource/jetbrains-mono';
import '@fontsource/space-grotesk';
import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
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

const CFG = CHANNEL_CONFIGS.ch2;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind = visual.kind;
  const bg = bg_color || CFG.colors.bgPrimary;
  const frame = useCurrentFrame();

  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return (a.path as string | null) != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();

  const isFullscreen =
    hasAsset && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  const hasShotBrief = !!shotBrief;
  const floatY = Math.sin(frame * 0.035) * 8;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {isFullscreen && !hasShotBrief && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}

      {isFullscreen && !hasShotBrief && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 720,
          background: `linear-gradient(to top, ${CFG.colors.bgPrimary}f8 0%, ${CFG.colors.bgPrimary}88 50%, transparent 100%)`,
          pointerEvents: 'none',
        }} />
      )}

      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {!isFullscreen && !hasShotBrief && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            width: 480, height: 480, borderRadius: '50%',
            background: `radial-gradient(circle at 38% 33%, ${CFG.colors.accent2}33 0%, ${CFG.colors.accent1}22 45%, transparent 70%)`,
            boxShadow: `0 0 80px ${CFG.colors.accent1}44`,
            transform: `translateY(${floatY}px)`,
          }} />
        </AbsoluteFill>
      )}

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}
    </AbsoluteFill>
  );
};

export const Ch2Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
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
      <Soundtrack channelId="ch2" musicVolume={0.14} />
      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />
      <SfxLayer soundDesign={soundDesign ?? []} />
      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={timedBeats}
          channelId="ch2"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
