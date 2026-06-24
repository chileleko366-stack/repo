/**
 * AvatarOrbit — coloured avatar badges orbiting a centre with upright rotation.
 *
 * Lesson source: AE scene 3 — Mimojis in coloured circles parented to null
 * layer for orbital rotation. Expression: thisLayer.rotation * -1 applied
 * to each child keeps their orientation upright while orbiting.
 *
 * Usage: team/collaboration beats (ch1, ch2), neuron network (ch4),
 * satellite constellation (ch6), historical figures (ch5).
 * LLM key: "AvatarOrbit"
 */
import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface AvatarBadge {
  initial: string;  // Letter or short text shown in circle
  color: string;    // Circle background colour
}

export const AvatarOrbit: React.FC<{
  avatars?: AvatarBadge[];
  orbitRadius?: number;
  rotationSpeed?: number;  // degrees per frame
  backgroundColor?: string;
  accentColor?: string;
  centreLabel?: string;
  fontFamily?: string;
}> = ({
  avatars = [
    { initial: 'A', color: '#a855f7' },
    { initial: 'B', color: '#3b82f6' },
    { initial: 'C', color: '#ef4444' },
    { initial: 'D', color: '#f59e0b' },
  ],
  orbitRadius = 280,
  rotationSpeed = 0.25,
  backgroundColor = 'transparent',
  accentColor = '#a855f7',
  centreLabel = 'TEAM',
  fontFamily = "'Space Grotesk', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Global orbit angle (degrees)
  const orbitAngle = frame * rotationSpeed;

  // Entrance spring
  const entry = spring({ frame, fps, config: { damping: 26, stiffness: 220 }, durationInFrames: 50 });
  const globalScale = interpolate(entry, [0, 1], [0, 1]);

  const count = avatars.length;

  return (
    <AbsoluteFill style={{ backgroundColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

      {/* Centre hub */}
      <div style={{
        position: 'absolute',
        width: 120 * globalScale,
        height: 120 * globalScale,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}44, ${accentColor}11)`,
        border: `2px solid ${accentColor}88`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        fontSize: 28 * globalScale,
        fontWeight: 700,
        color: accentColor,
        boxShadow: `0 0 40px ${accentColor}44`,
      }}>
        {centreLabel}
      </div>

      {/* Orbit ring */}
      <div style={{
        position: 'absolute',
        width: orbitRadius * 2 * globalScale,
        height: orbitRadius * 2 * globalScale,
        borderRadius: '50%',
        border: `1px solid ${accentColor}28`,
      }} />

      {/* Avatar badges */}
      {avatars.map((avatar, i) => {
        const startAngle = (i / count) * 360;
        // Current angle in radians
        const angleRad = ((startAngle + orbitAngle) * Math.PI) / 180;
        const x = Math.cos(angleRad) * orbitRadius * globalScale;
        const y = Math.sin(angleRad) * orbitRadius * globalScale;

        // Individual entrance stagger
        const badgeEntry = spring({
          frame: frame - i * 6,
          fps,
          config: { damping: 22, stiffness: 280 },
          durationInFrames: 30,
        });
        const badgeScale = interpolate(badgeEntry, [0, 1], [0, 1]);

        // Counter-rotation: keeps badge upright (AE expression: thisLayer.rotation * -1)
        const counterRotation = -orbitAngle;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
          >
            <div style={{
              transform: `rotate(${counterRotation}deg) scale(${badgeScale})`,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: avatar.color,
              border: '3px solid rgba(255,255,255,0.4)',
              boxShadow: `0 4px 20px ${avatar.color}66, 0 0 0 1px ${avatar.color}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily,
              fontSize: 32,
              fontWeight: 700,
              color: '#fff',
            }}>
              {avatar.initial}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
