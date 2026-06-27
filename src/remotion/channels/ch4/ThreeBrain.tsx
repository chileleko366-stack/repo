import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

interface Props {
  accentColor?: string;
}

const BrainMesh: React.FC<{ accentColor: string; frame: number; fps: number }> = ({ accentColor, frame, fps }) => {
  const pulse = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2);
  return (
    <group scale={[pulse, pulse, pulse]}>
      <mesh>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshStandardMaterial color={accentColor} wireframe opacity={0.4} transparent />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshStandardMaterial color={accentColor} metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
};

export const ThreeBrain: React.FC<Props> = ({ accentColor = '#0097a7' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.5;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color={accentColor} />
        <pointLight position={[-3, -3, 3]} intensity={0.5} color="#5e35b1" />
        <group rotation={[0.2, rotation, 0]}>
          <BrainMesh accentColor={accentColor} frame={frame} fps={fps} />
        </group>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
