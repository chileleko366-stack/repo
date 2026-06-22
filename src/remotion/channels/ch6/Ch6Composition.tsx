/**
 * Ch6Composition — Red Space Facts (astronomy).
 *
 * Layout per beat:
 *   ─ Background (deep space #050010)
 *   ─ Starfield           (always — drifting parallax stars)
 *   ─ AssetLayer          (full-screen for person/brand/place)
 *   ─ CelestialBody       (celestial beats — 3-D rotating sphere)
 *   ─ Gradient scrim
 *   ─ Counter             (stat beats)
 *   ─ Narration text      (Orbitron, bottom-anchor on asset/celestial, centred otherwise)
 *   ─ Beat audio
 *   ─ HardCutFlash        (orange accent flash)
 * Global: Soundtrack + SfxLayer + CaptionTrack
 */

import '@fontsource/orbitron';
import React from 'react';
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
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
import { CelestialBody } from './CelestialBody';
import { HardCutFlash } from './HardCutFlash';
import { Starfield } from './Starfield';

const CFG = CHANNEL_CONFIGS.ch6;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Narration overlay (Orbitron) ──────────────────────────────────────────────

const SpaceText: React.FC<{
  text: string;
  emphasisWord: string;
}> = ({ text, emphasisWord }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterY = spring({
    frame,
    fps,
    config: { damping: 36, stiffness: 400 },
  });
  const translateY = interpolate(enterY, [0, 1], [60, 0]);
  const opacity    = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        padding: '0 60px',
        textAlign: 'center',
      }}
    >
      {text.split(' ').map((word, i) => {
        const isEmphasis = word.toLowerCase().includes(emphasisWord?.toLowerCase() ?? '____');
        return (
          <span
            key={i}
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 56,
              fontWeight: isEmphasis ? 700 : 400,
              color: isEmphasis ? CFG.colors.accent1 : '#e0e8ff',
              textShadow: isEmphasis
                ? `0 0 28px ${CFG.colors.accent1}99`
                : '0 2px 10px rgba(0,0,0,0.8)',
              marginRight: 10,
              lineHeight: 1.35,
              display: 'inline-block',
              letterSpacing: '0.04em',
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
  const isCelestial = kind === 'celestial';
  const isStat      = kind === 'stat';
  const hasShotBrief = !!shotBrief;

  const isFullscreen =
    hasAsset &&
    !isCelestial && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy';

  const needsScrim = isFullscreen || isCelestial;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {/* Stars are always visible (behind everything) */}
      <Starfield />

      {isFullscreen && (
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
      )}

      {isCelestial && (
        <CelestialBody
          bodyName={beat.visual.value ?? 'Jupiter'}
          durationInFrames={durationFrames}
        />
      )}

      {needsScrim && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 700,
            background:
              'linear-gradient(to top, rgba(5,0,16,0.97) 0%, rgba(5,0,16,0.4) 65%, transparent 100%)',
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
            fontFamily="'Orbitron', sans-serif"
          />
        </AbsoluteFill>
      )}

      {/* Fallback: narration text */}
      {!hasShotBrief && !isStat && (
        <div
          style={{
            position: 'absolute',
            left: 0, right: 0,
            bottom: needsScrim ? 300 : undefined,
            top:    !needsScrim ? 200 : undefined,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <SpaceText text={beat.narration} emphasisWord={emphasis_keyword} />
        </div>
      )}

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent1} peakOpacity={0.4} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

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
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      <Soundtrack channelId="ch6" musicVolume={0.20} />

      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />

      <SfxLayer soundDesign={soundDesign ?? []} />

      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={beats}
          channelId="ch6"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
