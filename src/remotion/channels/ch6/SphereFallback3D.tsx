/**
 * SphereFallback3D — metallic sphere for ch6 non-celestial space beats.
 * Uses MetalRoughSpheresNoTextures.glb (space_sphere.glb) via ModelLibrary.
 * Gives non-named-planet beats (hook, context, outro) a space feel.
 * Download: python scripts/download_models.py
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';

const SphereModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(modelPath('sphereClean'));

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[3, 5, 4]} intensity={3.5} color="#ffffff" />
      <pointLight position={[-4, 1, 2]} intensity={1.8} color="#ff1744" />
      <pointLight position={[4, -2, 3]} intensity={1.2} color="#00e5ff" />
      <group rotation={[0.2, t * 0.3, 0]} scale={[2, 2, 2]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const SphereFallback3D: React.FC = () => (
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
    camera={{ position: [0, 0, 5], fov: 50 }}
  >
    <SphereModel />
  </ThreeCanvas>
);

useGLTF.preload(modelPath('sphereClean'));
