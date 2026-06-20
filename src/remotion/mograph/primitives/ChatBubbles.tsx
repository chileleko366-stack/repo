// Ported from:
// /tmp/refs/saas-engine/src/skills/messaging.md
// Implements: flexbox left/right alignment, staggered slide+fade, spring bounce on bubble entrance.
// Dark (WhatsApp-style) color theme by default; iMessage-style available via `theme` prop.

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_CONFIGS } from './SpringConfigs';

const STAGGER_DELAY = 38;
const FADE_DURATION = 18;

const DARK_THEME = {
  bg: '#0b141a',
  sent: '#1f8a70',
  received: '#202c33',
  text: '#e9edef',
} as const;

const LIGHT_THEME = {
  bg: '#ffffff',
  sent: '#007AFF',
  received: '#E9E9EB',
  text: '#000000',
} as const;

export interface ChatMessage {
  text: string;
  sent: boolean;
}

interface ChatBubblesProps {
  messages: ChatMessage[];
  theme?: 'dark' | 'light';
  fontFamily?: string;
}

export const ChatBubbles: React.FC<ChatBubblesProps> = ({
  messages,
  theme = 'dark',
  fontFamily = "'Space Grotesk', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '60px 40px',
        paddingBottom: 120,
      }}
    >
      {messages.map((msg, i) => {
        const startFrame = i * STAGGER_DELAY;
        const opacity = interpolate(frame - startFrame, [0, FADE_DURATION], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const slideX = interpolate(opacity, [0, 1], [msg.sent ? 40 : -40, 0]);

        const bounce = spring({
          frame: frame - startFrame,
          fps,
          config: { damping: 12, stiffness: 170 },
        });
        const scaleValue = interpolate(bounce, [0, 1], [0.98, 1]);

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.sent ? 'flex-end' : 'flex-start',
              marginTop: 12,
              opacity,
              transform: `translateX(${slideX}px) scale(${scaleValue})`,
              transformOrigin: msg.sent ? '100% 100%' : '0% 100%',
            }}
          >
            <div
              style={{
                maxWidth: '72%',
                padding: '14px 18px',
                borderRadius: 18,
                backgroundColor: msg.sent ? colors.sent : colors.received,
                color: colors.text,
                fontSize: 32,
                fontFamily,
                lineHeight: 1.4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {msg.text}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
