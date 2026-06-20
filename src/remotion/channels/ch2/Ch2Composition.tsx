/**
 * Ch2Composition — FinanceFiction channel (ch2).
 * JetBrains Mono body / Space Grotesk accent / #0a0e1a bg / #00ff88 accent.
 *
 * Beat layout:
 *   stat / none  → CandlestickChart bg + Counter or text
 *   brand/person → AssetLayer full-screen
 *   hook/context → BrowserFrame chrome at top
 * Global: TickerTape strip on every beat, Soundtrack, SfxLayer, CaptionTrack.
 */

import '@fontsource/jetbrains-mono';
import '@fontsource/space-grotesk';
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
import { Counter } from '../../morph/Counter';
import { ShotBriefLayer } from '../../mograph/ShotBriefLayer';
import { SfxLayer } from '../../sound/SfxLayer';
import { Soundtrack } from '../../sound/Soundtrack';
import { BeatCompositor, buildTimedBeats } from '../../transitions/BeatCompositor';
import type { TimedBeat } from '../../transitions/BeatCompositor';
import { BrowserFrame } from './BrowserFrame';
import { CandlestickChart } from './CandlestickChart';
import { TickerTape } from './TickerTape';

const CFG = CHANNEL_CONFIGS.ch2;

function toStatic(p: string) {
  return staticFile(p.replace(/^public\//, ''));
}

function norm(s: string) {
  return s.toLowerCase().replace(/\W/g, '');
}

const BeatSection: React.FC<{ beat: ManifestBeat; durationFrames: number }> = ({ beat, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { visual, emphasis_keyword, resolvedAsset, bg_color, audioPath, shotBrief } = beat;
  const kind    = visual.kind;
  const bg      = bg_color || CFG.colors.bgPrimary;
  const hasAsset    = !!resolvedAsset;
  const isFullscreen = hasAsset && kind !== 'none' && kind !== 'stat';
  const showBrowser  = beat.sectionKey === 'hook' || beat.sectionKey === 'context';
  const hasShotBrief = !!shotBrief;

  const enter = spring({
    frame, fps,
    config: { damping: 16, stiffness: 180, mass: 0.9 },
    durationInFrames: 20,
  });
  const translateY = interpolate(enter, [0, 1], [40, 0]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: bg }} />

      {(kind === 'stat' || kind === 'none') && (
        <CandlestickChart durationFrames={durationFrames} />
      )}

      {isFullscreen && (
        <AssetLayer beat={beat} durationFrames={durationFrames} />
      )}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 700,
            background: 'linear-gradient(to top, rgba(10,14,26,0.97) 0%, transparent 100%)',
          }}
        />
      )}

      {showBrowser && <BrowserFrame />}

      {/* ShotBrief-driven layout: primitive at primaryAnchor */}
      {hasShotBrief && (
        <ShotBriefLayer
          beat={beat}
          accentColor={CFG.colors.accent1}
          bgColor={bg}
          bodyFont={CFG.bodyFont}
          accentFont={CFG.accentFont}
        />
      )}

      {/* Fallback: narration text with hardcoded anchoring */}
      {!hasShotBrief && (
        <div
          style={{
            position: 'absolute',
            left: 60, right: 60,
            ...(isFullscreen ? { bottom: 300 } : { top: showBrowser ? 120 : 200 }),
            opacity: enter,
            transform: `translateY(${translateY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 62,
              fontWeight: 700,
              color: CFG.colors.text,
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {beat.narration.split(' ').map((w, i) => (
              <span
                key={i}
                style={{
                  color:
                    emphasis_keyword && norm(w) === norm(emphasis_keyword)
                      ? CFG.colors.accent1
                      : CFG.colors.text,
                }}
              >
                {w}{' '}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: stat counter */}
      {!hasShotBrief && kind === 'stat' && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, top: '44%',
            transform: 'translateY(-50%)',
            display: 'flex', justifyContent: 'center',
          }}
        >
          <Counter
            to={parseFloat(visual.value ?? '0')}
            durationFrames={54}
            delayFrames={54}
            prefix={visual.prefix}
            suffix={visual.suffix}
            fontSize={160}
            color={CFG.colors.accent1}
            fontFamily="'Space Grotesk', sans-serif"
          />
        </div>
      )}

      <TickerTape durationFrames={durationFrames} accent={CFG.colors.accent1} />

      {audioPath ? <Audio src={toStatic(audioPath)} volume={1} /> : null}

      {/* Cut flash */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: CFG.colors.accent1,
          opacity: interpolate(frame, [0, 4], [0.28, 0], { extrapolateRight: 'clamp' }),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const Ch2Composition: React.FC<{ manifest: VideoManifest }> = ({
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
      <Soundtrack channelId="ch2" musicVolume={0.14} />
      <BeatCompositor
        timedBeats={timedBeats}
        renderBeat={(beat) => <BeatSection beat={beat} durationFrames={beat.audioFrames} />}
      />
      <SfxLayer soundDesign={soundDesign ?? []} />
      {wordBoundaries && (
        <CaptionTrack
          wordBoundariesByBeat={wordBoundaries}
          beats={beats}
          channelId="ch2"
          accentColor={CFG.colors.accent1}
          accentFont={CFG.accentFont}
          bodyFont={CFG.bodyFont}
        />
      )}
    </AbsoluteFill>
  );
};
