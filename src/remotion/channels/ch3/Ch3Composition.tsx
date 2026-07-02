/**
 * Ch3Composition — Redacted channel (ch3).
 * Space Grotesk body / Anton accent / #080808 bg / #cc0000 accent.
 *
 * Beat layout:
 *   hook/context   → ScrambleReveal text + GlitchWord emphasis
 *   other non-asset→ plain body text + GlitchWord emphasis
 *   twist          → ClassifiedStamp overlay
 *   person/place   → AssetLayer full-screen
 * Global: scanline texture, red top rule, Soundtrack, SfxLayer, CaptionTrack.
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
import { HardCutFlash } from '../../transitions/HardCutFlash';
import { ClassifiedStamp } from './ClassifiedStamp';

const CFG = CHANNEL_CONFIGS.ch3;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

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
  const isFullscreen = hasAsset && kind !== 'none' && kind !== 'stat';
  const isTwist      = beat.sectionKey === 'twist';

  // Suppress KineticTextLayer's keyword when the shot brief's own primitive
  // already shows the same word — see getShotBriefPrimaryText. Not
  // applicable on twist beats: ShotBriefLayer doesn't render there.
  const shotBriefPrimaryText = !isTwist ? getShotBriefPrimaryText(beat) : undefined;
  const keywordCollides = !!shotBriefPrimaryText && !!emphasis_keyword &&
    shotBriefPrimaryText.trim().toLowerCase() === emphasis_keyword.trim().toLowerCase();

  return (
    <AbsoluteFill>
      {/* Scanline texture */}
      <div
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 4px)',
        }}
      />

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
            background: 'linear-gradient(to top, rgba(8,8,8,0.97) 0%, transparent 100%)',
          }}
        />
      )}


      {/* ShotBrief-driven layout */}
      {!isTwist && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

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

      <HardCutFlash color={CFG.colors.accent1} peakOpacity={0.22} durationFrames={8} />
    </AbsoluteFill>
  );
};

export const Ch3Composition: React.FC<{ manifest: VideoManifest }> = ({
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
  const activeBgColor = useActiveBeatBgColor(timedBeats, CFG.colors.bgPrimary);

  return (
    <AbsoluteFill style={{ background: CFG.colors.bgPrimary, fontFamily: CFG.bodyFont }}>
      {/* Ambient animated background — one instance for the whole video, see
          BeatCompositor.tsx's useActiveBeatBgColor doc comment for why. */}
      <AmbientBackground
        baseColor={activeBgColor}
        accentColor={CFG.colors.accent1}
        accentColor2={CFG.colors.accent2}
        channelId="ch3"
      />
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
