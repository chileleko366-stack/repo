import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

export const CosmicObject3D: React.FC<Props> = ({ accentColor = '#ff4500' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.7;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.1} />
        <pointLight position={[6, 6, 6]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-4, -4, 4]} intensity={0.8} color={accentColor} />
        <group rotation={[rotation * 0.4, rotation, 0]}>
          <mesh>
            <icosahedronGeometry args={[1.2, 2]} />
            <meshStandardMaterial color={accentColor} wireframe opacity={0.6} transparent />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color="#00d4ff" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
