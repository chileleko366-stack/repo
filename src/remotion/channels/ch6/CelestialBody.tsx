import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  bodyName?: string;
  accentColor?: string;
  color?: string;
  ringColor?: string;
  hasRings?: boolean;
}

const BODY_COLORS: Record<string, string> = {
  mercury: '#8c8c8c',
  venus: '#e8cda0',
  earth: '#1a6b9a',
  mars: '#c1440e',
  jupiter: '#c88b3a',
  saturn: '#e4d191',
  uranus: '#7de8e8',
  neptune: '#3f54ba',
  pluto: '#bbb7a0',
  moon: '#d4d4d4',
  sun: '#ffd700',
};

const PlanetMesh: React.FC<{
  color: string;
  accentColor: string;
  hasRings: boolean;
  ringColor: string;
  frame: number;
  fps: number;
}> = ({ color, accentColor, hasRings, ringColor, frame, fps }) => {
  const rotation = (frame / fps) * 0.4;
  return (
    <group rotation={[0.2, rotation, 0]}>
      <mesh>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
      </mesh>
      {hasRings && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]}>
          <torusGeometry args={[2.2, 0.4, 2, 64]} />
          <meshStandardMaterial color={ringColor} opacity={0.7} transparent roughness={0.9} />
        </mesh>
      )}
    </group>
  );
};

export const CelestialBody: React.FC<Props> = ({
  bodyName = 'mars',
  accentColor = '#ff4500',
  color,
  ringColor = '#c8b890',
  hasRings = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resolvedColor = color ?? BODY_COLORS[bodyName.toLowerCase()] ?? '#888888';
  const showRings = hasRings || bodyName.toLowerCase() === 'saturn';

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.15} />
        <directionalLight position={[8, 2, 5]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-10, -5, -5]} intensity={0.3} color={accentColor} />
        <PlanetMesh
          color={resolvedColor}
          accentColor={accentColor}
          hasRings={showRings}
          ringColor={ringColor}
          frame={frame}
          fps={fps}
        />
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
