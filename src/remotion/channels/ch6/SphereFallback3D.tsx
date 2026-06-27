import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
  color?: string;
}

export const SphereFallback3D: React.FC<Props> = ({ accentColor = '#ff4500', color = '#ff4500' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.3;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 5, 5]} intensity={2} color="#ffffff" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color={accentColor} />
        <group rotation={[0, rotation, 0.05]}>
          <mesh>
            <sphereGeometry args={[1.5, 64, 64]} />
            <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.55, 32, 32]} />
            <meshStandardMaterial color={accentColor} wireframe opacity={0.15} transparent />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
