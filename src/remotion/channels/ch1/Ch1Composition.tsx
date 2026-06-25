/**
 * Ch1Composition — Dopamine Loop channel (ch1).
 *
 * Renders all 9 sections from the manifest inside frame-accurate <Sequence>s.
 * Layout per beat:
 *   ─ Background fill (beat.bg_color || channel bgPrimary)
 *   ─ AssetLayer       (person/brand/place/map — full-screen)
 *   ─ Gradient scrim   (bottom 600px, asset beats only — legibility)
 *   ─ SocialFigure3D   (non-asset non-shotbrief beats — variant per section)
 *   ─ KineticTextLayer (emphasis keyword reveal + supporting words)
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
import { HardCutFlash } from './HardCutFlash';
import { SocialFigure3D } from './SocialFigure3D';
import type { SocialFigureVariant } from './SocialFigure3D';

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
  const hasAsset = (() => {
    if (!resolvedAsset) return false;
    const a = resolvedAsset as unknown as Record<string, unknown>;
    if ('path' in a) return a.path != null;
    if ('svgString' in a) return true;
    if ('map_image' in a) return true;
    return false;
  })();

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
        <AssetLayer
          beat={beat}
          durationFrames={durationFrames}
          accentColors={{ primary: CFG.colors.accent1, secondary: CFG.colors.accent2 }}
        />
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

      {/* 3D social figure for non-asset, non-shotbrief beats */}
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

      {/* ShotBrief-driven layout: primitive at primaryAnchor position with depth effects */}
      {hasShotBrief && !isFullscreen && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* Mograph kinetic text: emphasis keyword + supporting words */}
      <KineticTextLayer
        beat={beat}
        accentColor={CFG.colors.accent1}
        accentFont={CFG.accentFont}
        bodyFont={CFG.bodyFont}
        durationFrames={durationFrames}
      />

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
