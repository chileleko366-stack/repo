import React, { Suspense } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

const ACCENT = '#d400ff';

const FallbackHead: React.FC = () => (
  <mesh>
    <sphereGeometry args={[1.2, 32, 32]} />
    <meshStandardMaterial color={ACCENT} wireframe />
  </mesh>
);

const HeadModel: React.FC = () => {
  return <FallbackHead />;
};

interface Props {
  accentColor?: string;
}

export const PsychHead3D: React.FC<Props> = ({ accentColor = ACCENT }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rotation = (frame / fps) * 0.8;

  return (
    <ModelErrorBoundary accentColor={accentColor}>
      <ThreeCanvas width={1080} height={1920}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color={accentColor} />
        <Suspense fallback={<FallbackHead />}>
          <group rotation={[0, rotation, 0]}>
            <HeadModel />
          </group>
        </Suspense>
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};
