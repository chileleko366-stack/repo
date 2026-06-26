/**
 * Ch2Composition — FinanceFiction channel (ch2).
 * JetBrains Mono body / Space Grotesk accent / #0a0e1a bg / #00ff88 accent.
 */

import '@fontsource/jetbrains-mono';
import '@fontsource/space-grotesk';
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
import { CandlestickChart } from './CandlestickChart';
import { Ferrari3D } from './Ferrari3D';
import { LuxuryObject3D } from './LuxuryObject3D';
import type { LuxuryVariant } from './LuxuryObject3D';
import { TickerTape } from './TickerTape';

const CFG = CHANNEL_CONFIGS.ch2;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const frame = useCurrentFrame();
  const { visual, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind    = visual.kind;
  const bg      = bg_color || CFG.colors.bgPrimary;
  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();
  const isFullscreen = hasAsset && kind !== 'none' && kind !== 'stat';
  const hasShotBrief = !!shotBrief;

  return (
    <AbsoluteFill>
      {/* 1. Background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* Candlestick BG on stat/none beats — visible regardless of shotBrief */}
      {(kind === 'stat' || kind === 'none') && (
        <CandlestickChart durationFrames={durationFrames} />
      )}

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

      {/* 5. Channel fallback visual — CSS/procedural 3D, no GLBs */}
      {!isFullscreen && !hasShotBrief && (() => {
        const sk = beat.sectionKey ?? '';
        if (sk === 'hook') return <Ferrari3D durationFrames={durationFrames} />;
        const variant: LuxuryVariant =
          kind === 'stat' ? 'coin' :
          kind === 'chart' ? 'ring' :
          sk === 'context' ? 'tower' :
          'crystal';
        return <LuxuryObject3D variant={variant} />;
      })()}

      {(beat.sectionKey === 'context' || (beat.sectionKey ?? '').startsWith('beat_')) && (
        <TickerTape durationFrames={durationFrames} accent={CFG.colors.accent1} />
      )}

      {/* 6. Beat audio */}
      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      {/* Cut flash */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: CFG.colors.accent1,
          opacity: interpolate(frame, [0, 8], [0.28, 0], { extrapolateRight: 'clamp' }),
          pointerEvents: 'none',
        }}
      />
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
