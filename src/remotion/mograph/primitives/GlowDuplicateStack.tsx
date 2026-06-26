import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; }

export const GlowDuplicateStack: React.FC<Props> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const blurs = [30, 60, 90, 120];
  const scales = [1.0, 1.15, 1.30, 1.45];
  const colors = [accentColor, accentColor + 'dd', accentColor + 'aa', accentColor + '55'];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {blurs.map((blur, i) => {
        const delay = i * 6;
        const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 22, stiffness: 200 } });
        const tx = interpolate(s, [0, 1], [-300, 80]);
        const scaleY = 1 + Math.sin(frame * 0.08 + i) * 0.15;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 480,
              height: 260,
              borderRadius: 32,
              backgroundColor: colors[i],
              filter: `blur(${blur}px)`,
              transform: `translateX(${tx}px) scaleY(${scaleY}) scale(${scales[i]})`,
              opacity: frame < delay ? 0 : 1,
            }}
          />
        );
      })}
    </div>
  );
};
