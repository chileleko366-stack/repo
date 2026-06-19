/**
 * Ch5Composition — The Quiet Record (untold history).
 *
 * Layout per beat:
 *   ─ Background fill (deep sepia #100d08)
 *   ─ AssetLayer      (full-screen for person/brand/place/stock_video)
 *   ─ Warm vignette   (always — corners darker)
 *   ─ DocumentaryQuote (non-asset beats: centred quote card)
 *   ─ Narration text   (asset beats: bottom anchor, EB Garamond)
 *   ─ Beat audio
 *   ─ HardCutFlash     (black fade — cinematic cut)
 * Global: Soundtrack + SfxLayer + CaptionTrack + FilmGrain
 */

import '@fontsource/eb-garamond';
import '@fontsource/fraunces';
import React from 'react';
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ManifestBeat, VideoManifest } from '../../../pipeline/types';
import { CHANNEL_CONFIGS } from '../../../pipeline/channelConfigs';
import { AssetLayer } from '../../assets/AssetLayer';
import { CaptionTrack } from '../../captions/CaptionTrack';
import { useWordBoundaries } from '../../captions/useWordBoundaries';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { DocumentaryQuote } from './DocumentaryQuote';
import { FilmGrain } from './FilmGrain';
import { HardCutFlash } from './HardCutFlash';

const CFG = CHANNEL_CONFIGS.ch5;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

// ── Asset-beat narration (EB Garamond, bottom anchor) ─────────────────────────

const AssetNarration: React.FC<{
  text: string;
  emphasisWord: string;
}> = ({ text, emphasisWord }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterY = spring({
    frame,
    fps,
    config: { damping: 22, stiffness: 110, mass: 1.4 },
    durationInFrames: 30,
  });
  const translateY = interpolate(enterY, [0, 1], [36, 0]);
  const opacity    = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        transform: `translateY(${translateY}px)`,
        opacity,
        padding: '0 72px',
        textAlign: 'center',
      }}
    >
      {text.split(' ').map((word, i) => {
        const isEmphasis = word.toLowerCase().includes(emphasisWord?.toLowerCase() ?? '____');
        return (
          <span
            key={i}
            style={{
              fontFamily: "'EB Garamond', serif",
              fontStyle: 'italic',
              fontSize: 60,
              fontWeight: 400,
              lineHeight: 1.45,
              color: isEmphasis ? CFG.colors.accent1 : CFG.colors.text,
              textShadow: '0 2px 12px rgba(0,0,0,0.7)',
              marginRight: 8,
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

const BeatSection: React.FC<{ beat: ManifestBeat }> = ({ beat }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath } = beat;
  const kind     = visual.kind;
  const bg       = bg_color || CFG.colors.bgPrimary;
  const hasAsset = !!resolvedAsset;

  const isFullscreen =
    hasAsset &&
    kind !== 'none' && kind !== 'stat' && kind !== 'anatomy' && kind !== 'celestial';

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {isFullscreen && <AssetLayer beat={beat} durationFrames={beat.durationFrames} />}

      {/* Warm vignette — always present */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(16,13,8,0.72) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom scrim for asset beats */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 640,
            background:
              'linear-gradient(to top, rgba(16,13,8,0.96) 0%, rgba(16,13,8,0.35) 65%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Documentary quote card for non-asset beats */}
      {!isFullscreen && (
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DocumentaryQuote
            text={beat.narration}
            emphasisWord={emphasis_keyword}
            accentColor={CFG.colors.accent1}
          />
        </AbsoluteFill>
      )}

      {/* Narration text on asset beats */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: 300, left: 0, right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <AssetNarration text={beat.narration} emphasisWord={emphasis_keyword} />
        </div>
      )}

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

export const Ch5Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  const { beats, soundDesign } = manifest;
  const wordBoundaries = useWordBoundaries(beats);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      <Soundtrack channelId="ch5" musicVolume={0.14} />

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

      <SfxLayer soundDesign={soundDesign ?? []} />

      {/* Global film grain overlay */}
      <FilmGrain opacity={0.035} />

      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={beats}
          channelId="ch5"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
