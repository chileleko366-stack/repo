/**
 * Ch4Composition — The Grey Matter (neuroscience / psychology).
 *
 * Layout per beat:
 *   ─ Background fill
 *   ─ AssetLayer      (full-screen for person/brand/place/map/stock_video)
 *   ─ NeuronPulse     (anatomy beats — SVG neuron overlay)
 *   ─ ThreeBrain      (anatomy beats — 3-D wireframe brain)
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
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { HardCutFlash } from './HardCutFlash';
import { NeuronPulse } from './NeuronPulse';
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
    config: { damping: 20, stiffness: 180, mass: 1.0 },
  });
  const translateY = interpolate(enterY, [0, 1], [44, 0]);
  const opacity    = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

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
              color: isEmphasis ? CFG.colors.accent1 : '#ffffff',
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

const BeatSection: React.FC<{ beat: ManifestBeat }> = ({ beat }) => {
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath } = beat;
  const kind      = visual.kind;
  const bg        = bg_color || CFG.colors.bgPrimary;
  const hasAsset  = !!resolvedAsset;
  const isAnatomy = kind === 'anatomy';
  const isStat    = kind === 'stat';

  const isFullscreen =
    hasAsset && !isAnatomy && kind !== 'none' && kind !== 'stat' && kind !== 'celestial';

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {/* Full-screen asset (person/brand/place/map/stock_video) */}
      {isFullscreen && (
        <AssetLayer beat={beat} durationFrames={beat.durationFrames} />
      )}

      {/* Anatomy: SVG neuron + 3-D brain */}
      {isAnatomy && (
        <>
          <NeuronPulse durationFrames={beat.durationFrames} />
          <ThreeBrain />
        </>
      )}

      {/* Gradient scrim */}
      {(isFullscreen || isAnatomy) && (
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 720,
            background:
              'linear-gradient(to top, rgba(18,18,30,0.97) 0%, rgba(18,18,30,0.4) 60%, transparent 100%)',
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
            value={parseFloat(visual.stat_value?.toString() ?? visual.value ?? '0')}
            prefix={visual.prefix}
            suffix={visual.suffix}
            delayFrames={54}
            durationFrames={54}
            fontSize={148}
            color={CFG.colors.accent1}
            fontFamily="Anton, sans-serif"
          />
        </AbsoluteFill>
      )}

      {/* Narration text */}
      <div
        style={{
          position: 'absolute',
          left: 0, right: 0,
          bottom: isFullscreen || isAnatomy ? 300 : undefined,
          top: !isFullscreen && !isAnatomy && !isStat ? 180 : undefined,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {!isStat && (
          <NarrationText
            text={beat.narration}
            emphasisWord={emphasis_keyword}
            isAnatomy={isAnatomy}
          />
        )}
      </div>

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      <HardCutFlash color={CFG.colors.accent2} peakOpacity={0.35} />
    </AbsoluteFill>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

export const Ch4Composition: React.FC<{ manifest: VideoManifest }> = ({ manifest }) => {
  const { beats, soundDesign } = manifest;
  const wordBoundaries = useWordBoundaries(beats);

  return (
    <AbsoluteFill
      style={{
        background: CFG.colors.bgPrimary,
        fontFamily: CFG.bodyFont,
      }}
    >
      <Soundtrack channelId="ch4" musicVolume={0.15} />

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
          channelId="ch4"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
