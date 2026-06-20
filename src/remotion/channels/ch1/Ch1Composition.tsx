/**
 * Ch1Composition — Dopamine Loop channel (ch1).
 *
 * Renders all 9 sections from the manifest inside frame-accurate <Sequence>s.
 * Layout per beat:
 *   ─ Background fill (beat.bg_color || channel bgPrimary)
 *   ─ AssetLayer       (person/brand/place/map — full-screen)
 *   ─ Gradient scrim   (bottom 600px, asset beats only — legibility)
 *   ─ KineticTitle     (narration text, overlaid bottom-of-asset or centered)
 *   ─ PsychCard        (stat/none beats — centered card)
 *   ─ Beat audio       (<Audio> per beat voiceover)
 *   ─ HardCutFlash     (accent flash on frames 0-4 of each Sequence)
 * Global:
 *   ─ Soundtrack       (music bed, fade in/out)
 *   ─ SfxLayer         (SFX events from manifest.soundDesign)
 *   ─ CaptionTrack     (word-level TikTok captions)
 */

import '@fontsource/anton';
import '@fontsource/space-grotesk';
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
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
import { KineticTitle } from './KineticTitle';
import { PsychCard } from './PsychCard';

const CFG = CHANNEL_CONFIGS.ch1;

/** Strip the 'public/' prefix so staticFile() resolves correctly. */
function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Beat section ──────────────────────────────────────────────────────────────

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind     = visual.kind;
  const bg       = bg_color || CFG.colors.bgPrimary;
  const hasAsset = !!resolvedAsset;

  // person/brand/place/map/distance take the full frame
  const isFullscreen =
    hasAsset && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  // When shotBrief is present: use its primaryAnchor for text position; skip hardcoded layout.
  const hasShotBrief = !!shotBrief;

  return (
    <AbsoluteFill>
      {/* Base background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* Full-screen asset */}
      {isFullscreen && (
        <AssetLayer beat={beat} durationFrames={durationFrames} />
      )}

      {/* Gradient scrim on asset beats so text stays legible */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 680,
            background:
              'linear-gradient(to top, rgba(22,18,31,0.96) 0%, rgba(22,18,31,0.4) 60%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ShotBrief-driven layout: primitive at primaryAnchor position with depth effects */}
      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* Fallback: stat / none beats — PsychCard is the primary visual */}
      {!hasShotBrief && (kind === 'none' || kind === 'stat') && (
        <PsychCard
          keyword={emphasis_keyword}
          kind={kind}
          statValue={
            kind === 'stat' ? (parseFloat(visual.value ?? '0') || 0) : undefined
          }
          statPrefix={visual.prefix}
          statSuffix={visual.suffix}
        />
      )}

      {/* Fallback: kinetic narration text (hardcoded anchoring) */}
      {!hasShotBrief && !isFullscreen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 160,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <KineticTitle
            text={beat.narration}
            emphasisWord={emphasis_keyword}
          />
        </div>
      )}

      {/* Beat voiceover */}
      {audioPath ? (
        <Audio src={toStatic(audioPath)} volume={1} />
      ) : null}

      {/* Hard-cut accent flash */}
      <HardCutFlash color="#d400ff" peakOpacity={0.45} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

export const Ch1Composition: React.FC<{ manifest: VideoManifest }> = ({
  manifest,
}) => {
  const { beats, soundDesign, fps, script } = manifest;

  const wordBoundaries = useWordBoundaries(beats);

  // Build timing data for BeatCompositor from TTS audio durations + script pause markers.
  const audioDurationsMs: Record<string, number> = {};
  const pauseAfterMap: Record<string, 'breath' | 'beat' | 'cut'> = {};
  beats.forEach((b) => {
    if (b.audio?.durationMs) audioDurationsMs[b.beatId] = b.audio.durationMs;
  });
  (script?.beats ?? []).forEach((sb, i) => {
    const beatId = `beat_${i}`;
    pauseAfterMap[beatId] = (sb as { pause_after?: 'breath' | 'beat' | 'cut' }).pause_after ?? 'cut';
  });

  const timedBeats: TimedBeat[] = buildTimedBeats(beats, fps ?? 30, audioDurationsMs, pauseAfterMap);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      {/* Music bed */}
      <Soundtrack channelId="ch1" musicVolume={0.15} />

      {/* BeatCompositor: TransitionSeries-based pacing with speech-rhythm transitions */}
      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat, _i) => (
          <BeatSection beat={beat} durationFrames={beat.audioFrames} />
        )}
      />

      {/* Frame-synced SFX */}
      <SfxLayer soundDesign={soundDesign ?? []} />

      {/* Word-level captions */}
      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={beats}
          channelId="ch1"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
