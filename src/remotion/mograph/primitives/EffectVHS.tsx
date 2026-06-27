import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

export const EffectVHS: React.FC<{
  accentColor?: string;
}> = ({
  accentColor = '#ff0000',
}) => {
  const frame = useCurrentFrame();
  const bleed = Math.sin(frame * 0.3) * 3 + (Math.sin(frame * 0.7) > 0.9 ? 8 : 0);
  const scanY = (frame * 6) % 1920;
  const opacity = Math.min(frame / 20, 0.85);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
      }} />
      <div style={{ position: 'absolute', top: scanY, left: 0, right: 0, height: 40, background: 'rgba(255,255,255,0.03)' }} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <filter id="vhs-b">
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
          <feOffset dx={bleed} dy={0} />
        </filter>
        <rect x={0} y={0} width={1080} height={1920} fill={`${accentColor}11`} filter="url(#vhs-b)" />
      </svg>
    </AbsoluteFill>
  );
};
