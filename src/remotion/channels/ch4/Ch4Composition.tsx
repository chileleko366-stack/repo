/**
 * Ch4Composition — The Grey Matter (neuroscience / psychology).
 *
 * Layout per beat:
 *   ─ Background fill
 *   ─ AssetLayer      (full-screen for person/brand/place/map)
 *   ─ ThreeBrain      (anatomy beats — real BrainStem.glb 3D model)
 *   ─ Gradient scrim
 *   ─ Counter         (stat beats)
 *   ─ Narration text  (Fraunces italic for general, Anton for anatomy)
 *   ─ Beat audio
 *   ─ HardCutFlash    (cyan accent flash)
 * Global: Soundtrack + SfxLayer + CaptionTrack
 */

import '@fontsource/fraunces';
import '@fontsource/anton';
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ManifestBeat, VideoManifest } from '../../../pipeline/types';
import { CHANNEL_CONFIGS } from '../../../pipeline/channelConfigs';
import { AssetLayer } from '../../assets/AssetLayer';
import { CaptionTrack } from '../../captions/CaptionTrack';
import { useWordBoundaries } from '../../captions/useWordBoundaries';
import { Counter } from '../../morph/Counter';
import { ShotBriefLayer } from '../../mograph/ShotBriefLayer';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { BeatCompositor, buildTimedBeats } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { HardCutFlash } from './HardCutFlash';
import { NeuroObject3D } from './NeuroObject3D';
import type { NeuroVariant } from './NeuroObject3D';
import { ThreeBrain } from './ThreeBrain';

const CFG = CHANNEL_CONFIGS.ch4;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Narration overlay ─────────────────────────────────────────────────────────

const NarrationText: React.FC<{
  text: string;
  emphasisWord: string;
  isAnatomy: boolean;
}> = ({ text, emphasisWord, isAnatomy }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterY = spring({
    frame,
    fps,
    config: { damping: 36, stiffness: 400 },
  });
  const translateY = interpolate(enterY, [0, 1], [72, 0]);
  const opacity    = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });

  const fontFamily = isAnatomy ? 'Anton, sans-serif' : "'Fraunces', serif";
  const fontSize   = isAnatomy ? 72 : 62;
  const fontStyle  = isAnatomy ? 'normal' : 'italic';

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        padding: '0 64px',
        textAlign: 'center',
      }}
    >
      {text.split(' ').map((word, i) => {
        const isEmphasis = word.toLowerCase().includes(emphasisWord?.toLowerCase() ?? '____');
        return (
          <span
            key={i}
            style={{
              fontFamily,
              fontSize,
              fontStyle,
              fontWeight: isAnatomy ? 400 : 700,
              color: isEmphasis ? CFG.colors.accent1 : CFG.colors.text,
              textShadow: isEmphasis
                ? `0 0 24px ${CFG.colors.accent1}88`
                : '0 2px 8px rgba(0,0,0,0.6)',
              marginRight: 8,
              lineHeight: 1.3,
              display: 'inline-block',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ── Beat section ──────────────────────────────────────────────────────────────

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
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
  const isStat    = kind === 'stat';
  const hasShotBrief = !!shotBrief;

  const isFullscreen =
    hasAsset && !isAnatomy && kind !== 'none' && kind !== 'stat' && kind !== 'celestial';

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {/* Full-screen asset (person/brand/place/map) */}
      {isFullscreen && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}

      {/* Anatomy: 3-D brain */}
      {isAnatomy && <ThreeBrain durationFrames={durationFrames} />}

      {/* Neuro objects for non-anatomy, non-fullscreen, non-shotbrief beats */}
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

      {/* Gradient scrim */}
      {(isFullscreen || isAnatomy) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 720,
            background:
              'linear-gradient(to top, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.15) 45%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ShotBrief-driven layout */}
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

      {/* Fallback: stat counter */}
      {!hasShotBrief && isStat && (
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <Counter
            to={parseFloat(visual.stat_value?.toString() ?? visual.value ?? '0') || 0}
            prefix={visual.prefix}
            suffix={visual.suffix}
            delayFrames={108}
            durationFrames={108}
            fontSize={148}
            color={CFG.colors.accent1}
            fontFamily="Anton, sans-serif"
          />
        </AbsoluteFill>
      )}

      {/* Fallback: narration text */}
      {!hasShotBrief && !isStat && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0,
            bottom: isFullscreen || isAnatomy ? 300 : undefined,
            top: !isFullscreen && !isAnatomy ? 180 : undefined,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <NarrationText
            text={beat.narration}
            emphasisWord={emphasis_keyword}
            isAnatomy={isAnatomy}
          />
        </div>
      )}

      {/* Mograph kinetic text: emphasis keyword + supporting words */}
      <KineticTextLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        accentFont={CFG.accentFont}
        bodyFont={CFG.bodyFont}
        durationFrames={durationFrames}
      />

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent2} peakOpacity={0.35} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

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
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
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
