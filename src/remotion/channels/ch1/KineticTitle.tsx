/**
 * KineticTitle — ch1 (Dopamine Loop) animated headline.
 *
 * Words enter from below with a staggered spring, left-to-right.
 * The word matching emphasisWord gets accent1 colour (#d400ff) + larger size.
 * All animation is a pure function of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const SPRING_CFG = { damping: 36, stiffness: 400 } as const;
const WORD_STAGGER = 8;
const SPRING_DUR  = 36;

function normalise(s: string) {
  return s.toLowerCase().replace(/\W/g, '');
}

export const KineticTitle: React.FC<{
  text: string;
  emphasisWord?: string;
  /** Frame within the parent Sequence to start the entrance */
  startFrame?: number;
}> = ({ text, emphasisWord = '', startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(' ');
  const empNorm = normalise(emphasisWord);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-end',
        columnGap: 14,
        rowGap: 4,
        padding: '0 64px',
      }}
    >
      {words.map((word, i) => {
        const localFrame = Math.max(0, frame - startFrame - i * WORD_STAGGER);
        const enter = spring({
          frame: localFrame,
          fps,
          config: SPRING_CFG,
          durationInFrames: SPRING_DUR,
        });

        const isEmphasis = empNorm.length > 0 && normalise(word) === empNorm;
        const translateY = (1 - enter) * 80;

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              fontFamily: "'Anton', sans-serif",
              fontSize: isEmphasis ? 94 : 76,
              lineHeight: 1.1,
              textTransform: 'uppercase' as const,
              letterSpacing: isEmphasis ? '0.02em' : '0.01em',
              color: isEmphasis ? '#d400ff' : '#ffffff',
              transform: `translateY(${translateY}px)`,
              opacity: enter,
              textShadow: isEmphasis
                ? '0 0 48px rgba(212,0,255,0.65)'
                : '0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
