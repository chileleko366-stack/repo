import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';

interface BackgroundSaaSLightProps {
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
}

export const BackgroundSaaSLight: React.FC<BackgroundSaaSLightProps> = ({
  color1 = '#e8f4fd',
  color2 = '#fce4ec',
  color3 = '#f3e5f5',
  color4 = '#e8eaf6',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const x1 = 50 + 30 * Math.sin(t * 0.4);
  const y1 = 50 + 25 * Math.cos(t * 0.3);
  const x2 = 50 + 30 * Math.cos(t * 0.35 + 1);
  const y2 = 50 + 25 * Math.sin(t * 0.25 + 2);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: color1 }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 70% 60% at ${x1}% ${y1}%, ${color2}cc, transparent)`,
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 60% 70% at ${x2}% ${y2}%, ${color3}cc, transparent)`,
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 80% 50% at 20% 80%, ${color4}88, transparent)`,
      }} />
    </div>
  );
};
