/**
 * Ch6Composition — Red Space Facts (astronomy).
 *
 * Layout per beat:
 *   ─ Background (deep space #050010)
 *   ─ Starfield           (always — drifting parallax stars)
 *   ─ AssetLayer          (full-screen for person/brand/place/stock_video)
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
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ManifestBeat, VideoManifest } from '../../../pipeline/types';
import { CHANNEL_CONFIGS } from '../../../pipeline/channelConfigs';
import { AssetLayer } from '../../assets/AssetLayer';
import { CaptionTrack } from '../../captions/CaptionTrack';
import { useWordBoundaries } from '../../captions/useWordBoundaries';
import { Counter } from '../../morph/Counter';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
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
    config: { damping: 16, stiffness: 200, mass: 0.9 },
  });
  const translateY = interpolate(enterY, [0, 1], [40, 0]);
  const opacity    = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

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

const BeatSection: React.FC<{ beat: ManifestBeat }> = ({ beat }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath } = beat;
  const kind        = visual.kind;
  const bg          = bg_color || CFG.colors.bgPrimary;
  const hasAsset    = !!resolvedAsset;
  const isCelestial = kind === 'celestial';
  const isStat      = kind === 'stat';

  const isFullscreen =
    hasAsset &&
    !isCelestial && kind !== 'none' && kind !== 'stat' && kind !== 'anatomy';

  const needsScrim = isFullscreen || isCelestial;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {/* Stars are always visible (behind everything) */}
      <Starfield />

      {isFullscreen && <AssetLayer beat={beat} durationFrames={beat.durationFrames} />}

      {isCelestial && (
        <CelestialBody
          bodyColor="#c87941"
          glowColor={CFG.colors.accent1}
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

      {/* Stat counter */}
      {isStat && (
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
            delayFrames={54}
            durationFrames={54}
            fontSize={148}
            color={CFG.colors.accent1}
            fontFamily="'Orbitron', sans-serif"
          />
        </AbsoluteFill>
      )}

      {/* Narration */}
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0,
          bottom: needsScrim ? 300 : undefined,
          top:    !needsScrim && !isStat ? 200 : undefined,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {!isStat && (
          <SpaceText text={beat.narration} emphasisWord={emphasis_keyword} />
        )}
      </div>

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent1} peakOpacity={0.4} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

export const Ch6Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  const { beats, soundDesign } = manifest;
  const wordBoundaries = useWordBoundaries(beats);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      <Soundtrack channelId="ch6" musicVolume={0.20} />

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
