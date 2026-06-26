import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props {
  accentColor: string;
  children?: React.ReactNode;
  durationFrames?: number;
  delay?: number;
}

export const LinearWipe: React.FC<Props> = ({ children, durationFrames = 18, delay = 0 }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - delay);
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const t = easeOut(Math.min(elapsed / durationFrames, 1));
  const reveal = 100 - t * 100;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      clipPath: `inset(0 ${reveal}% 0 0)`,
    }}>
      {children}
    </div>
  );
};
