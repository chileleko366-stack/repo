import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

export const ClassifiedObject3D: React.FC<Props> = ({ accentColor = '#cc0000' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.6;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.3} />
        <pointLight position={[4, 6, 4]} intensity={1} color={accentColor} />
        <group rotation={[0, rotation, 0.1]}>
          <mesh>
            <octahedronGeometry args={[1.2]} />
            <meshStandardMaterial color={accentColor} wireframe opacity={0.7} transparent />
          </mesh>
          <mesh>
            <octahedronGeometry args={[0.8]} />
            <meshStandardMaterial color="#ffffff" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
