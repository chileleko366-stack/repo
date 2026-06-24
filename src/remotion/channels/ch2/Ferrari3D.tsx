/**
 * Ferrari3D — animated sports car for ch2 FinanceFiction hook beats.
 * Uses ferrari.glb (three.js example) via ModelLibrary registry.
 * Download: python scripts/download_models.py
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

const FerrariModel: React.FC<{ durationFrames: number }> = ({ durationFrames: _d }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(modelPath('ferrari'));

  const rotY = t * 0.35;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 4]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-4, 2, 3]} intensity={1.5} color="#00ff88" />
      <pointLight position={[3, -1, 3]} intensity={1.0} color="#00f0ff" />
      <spotLight position={[0, 8, 2]} angle={0.5} penumbra={0.4} intensity={2.0} color="#ffffff" />
      <group rotation={[0.08, rotY, 0]} scale={[1.4, 1.4, 1.4]} position={[0, -0.6, 0]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const Ferrari3D: React.FC<{ durationFrames?: number }> = ({ durationFrames = 240 }) => (
  <ModelErrorBoundary accentColor="#00ff88">
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
      camera={{ position: [0, 1.2, 4.5], fov: 50 }}
    >
      <FerrariModel durationFrames={durationFrames} />
    </ThreeCanvas>
  </ModelErrorBoundary>
);

useGLTF.preload(modelPath('ferrari'));
