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
import { MorphText } from '../../morph/MorphText';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { HardCutFlash } from './HardCutFlash';
import { KineticTitle } from './KineticTitle';
import { PsychCard } from './PsychCard';

const CFG = CHANNEL_CONFIGS.ch1;

/** Strip the 'public/' prefix so staticFile() resolves correctly. */
function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Beat section ──────────────────────────────────────────────────────────────

const BeatSection: React.FC<{ beat: ManifestBeat }> = ({ beat }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath } = beat;
  const kind     = visual.kind;
  const bg       = bg_color || CFG.colors.bgPrimary;
  const hasAsset = !!resolvedAsset;

  // person/brand/place/map/distance take the full frame
  const isFullscreen =
    hasAsset && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  return (
    <AbsoluteFill>
      {/* Base background */}
      <AbsoluteFill style={{ background: bg }} />

      {/* Full-screen asset */}
      {isFullscreen && (
        <AssetLayer beat={beat} durationFrames={beat.durationFrames} />
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

      {/* Stat / none beats — PsychCard is the primary visual */}
      {(kind === 'none' || kind === 'stat') && (
        <PsychCard
          keyword={emphasis_keyword}
          kind={kind}
          statValue={
            kind === 'stat' ? parseFloat(visual.value ?? '0') : undefined
          }
          statPrefix={visual.prefix}
          statSuffix={visual.suffix}
        />
      )}

      {/* Kinetic narration text */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          // On asset beats: anchor near bottom above captions
          // On card beats: sit above the card
          bottom: isFullscreen ? 300 : undefined,
          top:    isFullscreen ? undefined : 160,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {!isFullscreen && (
          <KineticTitle
            text={beat.narration}
            emphasisWord={emphasis_keyword}
          />
        )}
      </div>

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
  const { beats, soundDesign } = manifest;

  const wordBoundaries = useWordBoundaries(beats);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      {/* Music bed */}
      <Soundtrack channelId="ch1" musicVolume={0.15} />

      {/* Beat sequences */}
      {beats.map((beat) => (
        <Sequence
          key={beat.beatId}
          from={beat.startFrame}
          durationInFrames={beat.durationFrames}
          layout="none"
        >
          <BeatSection beat={beat} />
        </Sequence>
      ))}

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
