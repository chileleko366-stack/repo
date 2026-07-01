/**
 * KineticTextLayer — mograph text that IS the visual composition, not captions.
 *
 * The emphasis_keyword enters at full mograph treatment:
 * - Mask reveal: clip-path inset(100% 0 0 0) → inset(0 0 0 0) over 22 frames
 *   (text slides up from behind a mask — the broadcast standard reveal)
 * - Scale: 0.88 → 1.0 with spring as mask opens
 * - Size: 80-160px depending on word length
 * - Color: channel accent1
 * - Position: lower third (paddingBottom 300)
 *
 * Supporting words (first 7 words of narration, minus the emphasis word) appear
 * ABOVE the keyword at 52px, white, staggered 5 frames apart with wipe-in clips.
 *
 * Exit fade: starts at 88% of durationFrames, but always finishes (opacity 0)
 * at least MAX_TRANSITION_FRAMES before the beat ends — see the comment above
 * the exit-fade computation below for why.
 *
 * suppressKeyword: when the shot brief's own primitive already displays
 * this beat's emphasis_keyword as its typography.primary text, the caller
 * passes suppressKeyword to skip re-rendering it here — otherwise the same
 * word appears twice in the frame. Supporting words are unaffected.
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ManifestBeat } from '../../pipeline/types';
import { SOCIAL_SAFE_ZONE } from './primitives';
import { MAX_TRANSITION_FRAMES } from '../transitions/BeatCompositor';

export interface KineticTextLayerProps {
  beat: ManifestBeat;
  accentColor: string;
  accentFont: string;
  bodyFont: string;
  durationFrames: number;
  suppressKeyword?: boolean;
}

function getKeywordSize(word: string): number {
  const len = word.length;
  if (len <= 3) return 160;
  if (len <= 6) return 140;
  if (len <= 10) return 120;
  if (len <= 14) return 96;
  return 80;
}

export const KineticTextLayer: React.FC<KineticTextLayerProps> = ({
  beat,
  accentColor,
  accentFont,
  bodyFont,
  durationFrames,
  suppressKeyword = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const sidePad = Math.round(width * SOCIAL_SAFE_ZONE.sidePct);

  const keyword = suppressKeyword ? '' : (beat.emphasis_keyword ?? '').toUpperCase();

  const supportingWords = beat.narration
    .split(' ')
    .filter(w => w.toLowerCase() !== beat.emphasis_keyword?.toLowerCase())
    .slice(0, 7)
    .map(w => w.toUpperCase());

  // Exit fade: normally starts at 88% of duration, but TransitionSeries
  // (BeatCompositor) mounts the NEXT beat's Sequence on top of this one's
  // tail MAX_TRANSITION_FRAMES before this beat nominally ends — during that
  // overlap window both beats' KineticTextLayer render simultaneously. If
  // this beat's own headline hasn't finished fading out by then, two
  // different words are visible at the same screen position at once (the
  // reported ghosting). Clamp exitEnd so opacity always reaches 0 before
  // that window starts, regardless of the 88% heuristic.
  const exitEnd = Math.max(0, durationFrames - MAX_TRANSITION_FRAMES);
  const exitStart = Math.min(durationFrames * 0.88, Math.max(0, exitEnd - 10));
  const exitProgress = interpolate(frame, [exitStart, exitEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const globalOpacity = 1 - exitProgress;

  // ── Keyword mask reveal ───────────────────────────────────────────────────
  const keywordReveal = spring({
    frame,
    fps,
    config: { damping: 28, stiffness: 200, mass: 0.7 },
    durationInFrames: 22,
  });

  const topInset = interpolate(keywordReveal, [0, 1], [102, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const keywordClip = `inset(${topInset}% 0 0 0)`;

  const keywordScale = interpolate(keywordReveal, [0, 1], [0.88, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        opacity: globalOpacity,
        pointerEvents: 'none',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 300,
        paddingLeft: sidePad,
        paddingRight: sidePad,
      }}
    >
      <div style={{ width: '100%', maxWidth: 1000, textAlign: 'center' }}>

        {/* Supporting words — wipe in left-to-right, ABOVE the keyword */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0 10px',
            marginBottom: 32,
          }}
        >
          {supportingWords.map((word, i) => {
            const wordDelay = 8 + i * 5;
            const wordReveal = spring({
              frame: Math.max(0, frame - wordDelay),
              fps,
              config: { damping: 22, stiffness: 180, mass: 0.6 },
              durationInFrames: 16,
            });

            // Whole-word pop (opacity + scale + translateY), matching the
            // proven token-reveal treatment in CaptionPage.tsx — not a
            // clip-path wipe, which shows only a partial/sliced word mid-reveal.
            const wordOpacity = interpolate(wordReveal, [0, 1], [0, 1]);
            const wordScale = interpolate(wordReveal, [0, 1], [0.5, 1]);
            const wordTranslateY = interpolate(wordReveal, [0, 1], [18, 0]);

            return (
              <span
                key={`support-${i}`}
                style={{
                  display: 'inline-block',
                  fontFamily: bodyFont,
                  fontSize: 52,
                  fontWeight: 700,
                  color: '#ffffff',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.04em',
                  opacity: wordOpacity,
                  transform: `scale(${wordScale}) translateY(${wordTranslateY}px)`,
                  WebkitTextStroke: '5px rgba(0,0,0,0.9)',
                  paintOrder: 'stroke fill',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* EMPHASIS KEYWORD — the headline word */}
        {keyword && (
          <div
            style={{
              overflow: 'hidden',
              display: 'inline-block',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontFamily: accentFont,
                fontSize: getKeywordSize(keyword),
                fontWeight: 900,
                color: accentColor,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.03em',
                lineHeight: 1,
                clipPath: keywordClip,
                transform: `scale(${keywordScale})`,
                transformOrigin: 'center bottom',
                textShadow: `
                  0 0 60px ${accentColor}80,
                  0 0 120px ${accentColor}40,
                  2px 2px 0 rgba(0,0,0,1),
                  -2px -2px 0 rgba(0,0,0,1)
                `,
              }}
            >
              {keyword}
            </span>
          </div>
        )}

      </div>
    </AbsoluteFill>
  );
};
