import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

export const PeriodObject3D: React.FC<Props> = ({ accentColor = '#c8a96e' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.4;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.4} color="#fff8e0" />
        <pointLight position={[4, 6, 4]} intensity={1} color="#ffe4a0" />
        <group rotation={[0, rotation, 0]}>
          <mesh>
            <torusGeometry args={[1, 0.15, 8, 32]} />
            <meshStandardMaterial color={accentColor} metalness={0.5} roughness={0.6} />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
