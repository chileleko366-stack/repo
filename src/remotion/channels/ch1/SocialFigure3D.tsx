import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

const FigureMesh: React.FC<{ accentColor: string }> = ({ accentColor }) => (
  <group>
    <mesh position={[0, 1, 0]}>
      <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
      <meshStandardMaterial color={accentColor} />
    </mesh>
    <mesh position={[0, 2.4, 0]}>
      <sphereGeometry args={[0.45, 16, 16]} />
      <meshStandardMaterial color={accentColor} />
    </mesh>
  </group>
);

export const SocialFigure3D: React.FC<Props> = ({ accentColor = '#d400ff' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.6;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 5, 3]} intensity={1.2} color={accentColor} />
        <group rotation={[0, rotation, 0]}>
          <FigureMesh accentColor={accentColor} />
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
