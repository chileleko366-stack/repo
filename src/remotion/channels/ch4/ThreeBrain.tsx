/**
 * ThreeBrain — real 3D brain stem model (BrainStem.glb from KhronosGroup).
 *
 * Replaces the wireframe icosahedron with an actual brain geometry.
 * Uses @remotion/three + @react-three/drei's useGLTF.
 *
 * Camera slowly orbits around the brain. Accent lights from above and below
 * give it a cinematic MRI/scan aesthetic in ch4's cyan color palette.
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

const BrainModel: React.FC<{ durationFrames: number }> = ({ durationFrames: _durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(staticFile('models/brain.glb'));

  // Slow orbit: full rotation in 20 seconds
  const rotY = t * 0.31;

  // Apply cyan/teal material tint to match ch4 aesthetic
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.color = new THREE.Color('#d0f4f7');
        mat.roughness = 0.6;
        mat.metalness = 0.1;
      }
    }
  });

  return (
    <>
      {/* Main overhead light — bright, cool, medical */}
      <directionalLight position={[0, 8, 4]} intensity={2.8} color="#e0f8ff" />
      {/* Rim light from below — adds depth */}
      <pointLight position={[0, -5, 2]} intensity={1.4} color="#0097a7" />
      {/* Ambient fill */}
      <ambientLight intensity={0.4} />
      {/* Accent glow */}
      <pointLight position={[-4, 2, 3]} intensity={1.0} color="#4dd0e1" />

      <group rotation={[0.1, rotY, 0]} scale={[0.9, 0.9, 0.9]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const ThreeBrain: React.FC<{ durationFrames?: number }> = ({ durationFrames = 240 }) => (
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

useGLTF.preload(staticFile('models/brain.glb'));
