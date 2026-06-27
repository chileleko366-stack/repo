import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

const CameraMesh: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <group>
    <mesh>
      <boxGeometry args={[2, 1.4, 1]} />
      <meshStandardMaterial color="#2a2010" roughness={0.9} />
    </mesh>
    <mesh position={[0.8, 0, 0]}>
      <cylinderGeometry args={[0.35, 0.45, 0.8, 16]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
    </mesh>
  </group>
);

export const AntiqueCamera3D: React.FC<Props> = ({ accentColor = '#cc0000' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.4;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color={accentColor} />
        <group rotation={[0.15, rotation, 0]}>
          <CameraMesh accentColor={accentColor} />
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
