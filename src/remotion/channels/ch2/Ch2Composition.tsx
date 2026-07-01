/**
 * Ch2Composition — FinanceFiction channel (ch2).
 * Space Grotesk body / Anton accent / #0a0e1a bg / #00ff88 accent.
 *
 * Beat layout:
 *   stat / none  → CandlestickChart bg + Counter or text
 *   brand/person → AssetLayer full-screen
 *   hook/context → BrowserFrame chrome at top
 * Global: TickerTape strip on every beat, Soundtrack, SfxLayer, CaptionTrack.
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
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { HeroWord } from '../../mograph/HeroWord';
import { AmbientBackground } from '../../backgrounds/AmbientBackground';
import { HardCutFlash } from '../../transitions/HardCutFlash';
import { CandlestickChart } from './CandlestickChart';
import { TickerTape } from './TickerTape';

const CFG = CHANNEL_CONFIGS.ch2;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, resolvedAsset, bg_color, audioPath } = beat;
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

  return (
    <AbsoluteFill>
      <AmbientBackground baseColor={bg} accentColor={CFG.colors.accent1} accentColor2={CFG.colors.accent2} channelId="ch2" />

      {(kind === 'stat' || kind === 'none') && (
        <CandlestickChart durationFrames={durationFrames} />
      )}

      {isFullscreen && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 700,
            background: 'linear-gradient(to top, rgba(10,14,26,0.97) 0%, transparent 100%)',
          }}
        />
      )}


      {/* ShotBrief-driven layout: primitive at primaryAnchor */}
      <ShotBriefLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        bgColor={bg}
        bodyFont={CFG.bodyFont}
        accentFont={CFG.accentFont}
      />

      {(beat.sectionKey === 'context' || (beat.sectionKey ?? '').startsWith('beat_')) && (
        <TickerTape durationFrames={durationFrames} accent={CFG.colors.accent1} />
      )}

      {/* Mograph kinetic text: emphasis keyword + supporting words */}
      <KineticTextLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        accentFont={CFG.accentFont}
        bodyFont={CFG.bodyFont}
        durationFrames={durationFrames}
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

      <HardCutFlash color={CFG.colors.accent1} peakOpacity={0.28} durationFrames={8} />
    </AbsoluteFill>
  );
};

export const Ch2Composition: React.FC<{ manifest: VideoManifest }> = ({
  manifest,
}) => {
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
