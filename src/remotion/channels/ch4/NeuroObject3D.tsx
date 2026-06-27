import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

export const NeuroObject3D: React.FC<Props> = ({ accentColor = '#0097a7' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.6;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1} color={accentColor} />
        <group rotation={[rotation * 0.3, rotation, 0]}>
          <mesh>
            <torusKnotGeometry args={[1, 0.35, 128, 16]} />
            <meshStandardMaterial color={accentColor} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
