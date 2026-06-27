import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

export const HistoricalArtifact3D: React.FC<Props> = ({ accentColor = '#c8a96e' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.35;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.5} color="#fff8e0" />
        <pointLight position={[5, 8, 5]} intensity={1.2} color="#ffe4a0" />
        <group rotation={[0.1, rotation, 0]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.8, 2.5, 6]} />
            <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial color={accentColor} metalness={0.2} roughness={0.9} />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
