/**
 * ThreeBrain — real 3D brain anatomy for ch4 The Grey Matter.
 * Uses BrainStem.glb from public/models/ via ModelLibrary registry.
 * Download: python scripts/download_models.py
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { modelPath } from '../../assets/ModelLibrary';

// Preload so first frame doesn't stall
useGLTF.preload(modelPath('brain'));

const BrainModel: React.FC<{ durationFrames: number }> = ({ durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(modelPath('brain'));

  // Slow orbit
  const rotY = t * 0.28;

  // Dolly zoom — pull viewer in over the beat
  const progress = durationFrames > 0 ? frame / durationFrames : 0;
  const _cameraZ = interpolate(progress, [0, 1], [7, 5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Apply ch4 cyan tint — traverse once per scene identity
  React.useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (mat && mat instanceof THREE.MeshStandardMaterial) {
          mat.color.set('#d4f5f7');
          mat.roughness = 0.55;
          mat.metalness = 0.08;
        }
      }
    });
  }, [scene]);

  return (
    <>
      <directionalLight position={[0, 8, 4]} intensity={3.0} color="#e0f8ff" />
      <pointLight position={[0, -5, 2]} intensity={1.6} color="#0097a7" />
      <pointLight position={[-4, 2, 3]} intensity={1.0} color="#4dd0e1" />
      <ambientLight intensity={0.45} />
      <group rotation={[0.1, rotY, 0]} scale={[0.9, 0.9, 0.9]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const ThreeBrain: React.FC<{ durationFrames?: number }> = ({
  durationFrames = 240,
}) => (
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
    camera={{ position: [0, 0.5, 6.5], fov: 42 }}
  >
    <BrainModel durationFrames={durationFrames} />
  </ThreeCanvas>
);
