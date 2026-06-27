import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

const CarMesh: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <group>
    <mesh position={[0, 0.3, 0]}>
      <boxGeometry args={[3.2, 0.6, 1.4]} />
      <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.7, 0]}>
      <boxGeometry args={[1.8, 0.5, 1.3]} />
      <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
    </mesh>
    {[-1.1, 1.1].map((x, i) =>
      [-0.55, 0.55].map((z, j) => (
        <mesh key={`${i}-${j}`} position={[x, 0.0, z]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      ))
    )}
  </group>
);

export const Ferrari3D: React.FC<Props> = ({ accentColor = '#00ff88' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.5;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, 2, -3]} intensity={0.8} color={accentColor} />
        <group rotation={[0.2, rotation, 0]} position={[0, 0, 0]}>
          <CarMesh accentColor={accentColor} />
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
