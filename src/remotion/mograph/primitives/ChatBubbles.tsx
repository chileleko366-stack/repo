import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface ChatBubblesProps {
  accentColor?: string;
  backgroundColor?: string;
}

const BUBBLES = [
  { text: '💬', align: 'left'  as const, delay: 0  },
  { text: '💬', align: 'right' as const, delay: 12 },
  { text: '💬', align: 'left'  as const, delay: 24 },
];

export const ChatBubbles: React.FC<ChatBubblesProps> = ({
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: backgroundColor, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 32 }}>
      {BUBBLES.map((b, i) => {
        const opacity = interpolate(frame, [b.delay, b.delay + 18], [0, 1], { extrapolateRight: 'clamp' });
        const translateX = interpolate(frame, [b.delay, b.delay + 18], [b.align === 'left' ? -40 : 40, 0], { extrapolateRight: 'clamp' });
        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateX(${translateX}px)`,
              alignSelf: b.align === 'left' ? 'flex-start' : 'flex-end',
              marginLeft: b.align === 'left' ? 60 : 0,
              marginRight: b.align === 'right' ? 60 : 0,
              background: b.align === 'left' ? `${accentColor}22` : `${accentColor}44`,
              border: `1.5px solid ${accentColor}66`,
              borderRadius: b.align === 'left' ? '4px 20px 20px 20px' : '20px 4px 20px 20px',
              padding: '24px 36px',
              minWidth: 220,
            }}
          >
            <div style={{ width: 180, height: 16, background: `${accentColor}55`, borderRadius: 8 }} />
            <div style={{ width: 120, height: 16, background: `${accentColor}33`, borderRadius: 8, marginTop: 10 }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
