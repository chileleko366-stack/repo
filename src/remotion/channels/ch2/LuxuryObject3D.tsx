import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

export const LuxuryObject3D: React.FC<Props> = ({ accentColor = '#00ff88' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.7;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color={accentColor} />
        <group rotation={[0.3, rotation, 0.1]}>
          <mesh>
            <torusGeometry args={[1.2, 0.35, 16, 64]} />
            <meshStandardMaterial color={accentColor} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
