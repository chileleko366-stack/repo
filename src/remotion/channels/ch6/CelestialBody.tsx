/**
 * CelestialBody — slowly rotating 3-D sphere for celestial beats.
 *
 * Uses @remotion/three ThreeCanvas driven by useCurrentFrame().
 * An outer transparent sphere creates an atmosphere haze.
 * Color is passed in so each topic can have a different planet.
 */

import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, useCurrentFrame } from 'remotion';

const PlanetMesh: React.FC<{ bodyColor: string; glowColor: string }> = ({
  bodyColor,
  glowColor,
}) => {
  const frame    = useCurrentFrame();
  const rotation = (frame / 30) * 0.25;
  const scale    = interpolate(frame, [0, 24], [0.4, 1], { extrapolateRight: 'clamp' });

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[8, 6, 10]}  intensity={2.8} color={glowColor} />
      <pointLight position={[-5, -4, 4]} intensity={0.8} color="#a0c4ff" />

      {/* Planet body */}
      <mesh rotation={[0.2, rotation, 0.05]} scale={[scale, scale, scale]}>
        <sphereGeometry args={[3.2, 64, 64]} />
        <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.1} />
      </mesh>

      {/* Atmosphere haze */}
      <mesh scale={[scale * 1.06, scale * 1.06, scale * 1.06]}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshStandardMaterial
          color={glowColor}
          transparent
          opacity={0.08}
          side={2}
        />
      </mesh>
    </>
  );
};

export const CelestialBody: React.FC<{
  bodyColor?: string;
  glowColor?: string;
}> = ({ bodyColor = '#c87941', glowColor = '#ff4500' }) => (
  <ThreeCanvas
    width={1080}
    height={1920}
    style={{ position: 'absolute', inset: 0 }}
  >
    <PlanetMesh bodyColor={bodyColor} glowColor={glowColor} />
  </ThreeCanvas>
);
