import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';

interface SocialFrameProps {
  accentColor?: string;
  backgroundColor?: string;
}

export const SocialFrame: React.FC<SocialFrameProps> = ({
  accentColor = '#d400ff',
  backgroundColor = '#16121f',
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = Math.sin(frame * 0.12) * 0.5 + 0.5;

  return (
    <AbsoluteFill style={{ background: backgroundColor, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity: enter, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {/* Profile circle */}
        <div style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${accentColor}44, ${accentColor}22)`,
          border: `3px solid ${accentColor}`,
          boxShadow: `0 0 ${30 + pulse * 20}px ${accentColor}44`,
        }} />
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 48, marginTop: 16 }}>
          {['1.2M', '847K', '3.4K'].map((v, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'sans-serif', fontSize: 52, fontWeight: 800, color: accentColor }}>{v}</div>
              <div style={{ fontFamily: 'sans-serif', fontSize: 28, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {['followers', 'likes', 'posts'][i]}
              </div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ width: 480, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
          <div style={{ width: `${65 + pulse * 10}%`, height: '100%', background: accentColor, borderRadius: 3 }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
