/**
 * HistoricalArtifact3D — rotating artifact for ch5 The Quiet Record.
 * variant='helmet' → DamagedHelmet.glb (battle-worn flight helmet)
 * variant='nefertiti' → Nefertiti.glb (Egyptian bust scan)
 * Both via ModelLibrary registry. Download: python scripts/download_models.py
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

const HelmetModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(modelPath('damagedHelmet'));
  const rotY = t * 0.22;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 5, 4]} intensity={2.0} color="#f5e6c8" />
      <pointLight position={[-2, 1, 3]} intensity={1.1} color="#c8a96e" />
      <pointLight position={[3, -2, 2]} intensity={0.6} color="#8b6914" />
      <group rotation={[0.1, rotY, 0]} scale={[2.2, 2.2, 2.2]} position={[0, 0, 0]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

const NefertitiModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(modelPath('nefertiti'));
  const rotY = Math.sin(t * 0.3) * 0.4;

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2, 6, 4]} intensity={2.4} color="#ffe8c8" />
      <pointLight position={[-3, 2, 2]} intensity={1.3} color="#e8c870" />
      <pointLight position={[3, -1, 3]} intensity={0.8} color="#c87820" />
      <group rotation={[0, rotY, 0]} scale={[0.12, 0.12, 0.12]} position={[0, -0.5, 0]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const HistoricalArtifact3D: React.FC<{ variant?: 'helmet' | 'nefertiti' }> = ({
  variant = 'helmet',
}) => (
  <ModelErrorBoundary accentColor="#c8a040">
    <ThreeCanvas
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0 }}
      gl={{
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power' as WebGLPowerPreference,
        antialias: true,
      }}
      camera={{ position: [0, 0.2, 3.8], fov: 48 }}
    >
      {variant === 'nefertiti' ? <NefertitiModel /> : <HelmetModel />}
    </ThreeCanvas>
  </ModelErrorBoundary>
);

useGLTF.preload(modelPath('damagedHelmet'));
useGLTF.preload(modelPath('nefertiti'));
