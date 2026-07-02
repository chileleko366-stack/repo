/**
 * Ch1Composition — Dopamine Loop channel (ch1).
 *
 * Renders all 9 sections from the manifest inside frame-accurate <Sequence>s.
 * Global:
 *   ─ AmbientBackground (one instance for the whole video — see below; NOT
 *     per-beat, since a per-beat instance would be nested inside
 *     BeatCompositor's TransitionSeries.Sequence and visibly slide/wipe with
 *     each beat's transition instead of staying fixed)
 * Layout per beat:
 *   ─ Background fill (beat.bg_color || channel bgPrimary — read by the
 *     global AmbientBackground via useActiveBeatBgColor, not rendered here)
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
import { ShotBriefLayer, getShotBriefPrimaryText } from '../../mograph/ShotBriefLayer';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { BeatCompositor, buildTimedBeats, useActiveBeatBgColor } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { KineticTextLayer } from '../../mograph/KineticTextLayer';
import { HeroWord } from '../../mograph/HeroWord';
import { AmbientBackground } from '../../backgrounds/AmbientBackground';
import { HardCutFlash } from '../../transitions/HardCutFlash';

const CFG = CHANNEL_CONFIGS.ch1;

/** Strip the 'public/' prefix so staticFile() resolves correctly. */
function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Beat section ──────────────────────────────────────────────────────────────────────────────

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

  // person/brand/place/map/distance take the full frame
  const isFullscreen =
    hasAsset && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  // Suppress KineticTextLayer's keyword when the shot brief's own primitive
  // already shows the same word — see getShotBriefPrimaryText.
  const shotBriefPrimaryText = !isFullscreen ? getShotBriefPrimaryText(beat) : undefined;
  const keywordCollides = !!shotBriefPrimaryText && !!emphasis_keyword &&
    shotBriefPrimaryText.trim().toLowerCase() === emphasis_keyword.trim().toLowerCase();

  return (
    <AbsoluteFill>
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


      {/* ShotBrief-driven layout: primitive at primaryAnchor position with depth effects */}
      {!isFullscreen && (
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
        suppressKeyword={keywordCollides}
      />

      {/* Hero word — punchy accent on beat.heroWord, fires for ~18 frames. */}
      {beat.heroWord && (
        <HeroWord
          word={beat.heroWord}
          accentColor={CFG.colors.accent1}
          fontFamily={CFG.accentFont}
          startFrame={0}
          durationFrames={Math.min(18, durationFrames)}
        />
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

// ── Root composition ──────────────────────────────────────────────────────────────────────────────

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
  const activeBgColor = useActiveBeatBgColor(timedBeats, CFG.colors.bgPrimary);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      {/* Ambient animated background — one instance for the whole video,
          rendered outside BeatCompositor's TransitionSeries so it never
          slides/wipes with a beat transition. */}
      <AmbientBackground
        baseColor={activeBgColor}
        accentColor={CFG.colors.accent1}
        accentColor2={CFG.colors.accent2}
        channelId="ch1"
      />

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
