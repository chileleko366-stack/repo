/**
 * Ch3Composition — Redacted channel (ch3).
 * Special Elite font / #080808 bg / #cc0000 accent.
 *
 * Beat layout:
 *   hook/context   → ScrambleReveal text + GlitchWord emphasis
 *   other non-asset→ plain Special Elite text + GlitchWord emphasis
 *   twist          → ClassifiedStamp overlay
 *   person/place   → AssetLayer full-screen
 * Global: scanline texture, red top rule, Soundtrack, SfxLayer, CaptionTrack.
 */

import '@fontsource/special-elite';
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
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
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { HeroWord } from '../../mograph/HeroWord';
import { AmbientBackground } from '../../backgrounds/AmbientBackground';
import { ClassifiedStamp } from './ClassifiedStamp';
import { GlitchWord } from './GlitchWord';
import { ScrambleReveal } from './ScrambleReveal';

const CFG = CHANNEL_CONFIGS.ch3;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
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

  const enter = spring({
    frame, fps,
    config: { damping: 28, stiffness: 300 },
    durationInFrames: 44,
  });

  return (
    <AbsoluteFill>
      <AmbientBackground baseColor={bg} accentColor={CFG.colors.accent1} channelId="ch3" />

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
      {hasShotBrief && !isTwist && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* Fallback: non-asset text */}
      {!hasShotBrief && !isFullscreen && (
        <div
          style={{
            position: 'absolute', left: 60, right: 60, top: 200,
            opacity: enter,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 28,
          }}
        >
          {isHookCtx ? (
            <ScrambleReveal text={beat.narration} fontSize={62} />
          ) : (
            <div
              style={{
                fontFamily: "'Special Elite', cursive",
                fontSize: 62,
                color: CFG.colors.text,
                lineHeight: 1.35,
                textAlign: 'center',
              }}
            >
              {beat.narration}
            </div>
          )}

          {emphasis_keyword && (
            <GlitchWord
              text={emphasis_keyword.toUpperCase()}
              fontSize={100}
              color={CFG.colors.accent1}
            />
          )}
        </div>
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
