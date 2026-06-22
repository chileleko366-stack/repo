/**
 * ThreeBrain — animated 3-D icosahedron wireframe brain for anatomy beats.
 *
 * Uses @remotion/three ThreeCanvas so the scene is driven by useCurrentFrame()
 * (no R3F useFrame — that would break Remotion frame accuracy).
 * Two overlapping wireframe meshes (red + cyan) create a dual-hemisphere look.
 */

import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

const BrainMesh: React.FC = () => {
  const frame    = useCurrentFrame();
  const { fps }  = useVideoConfig();
  const rotation = (frame / fps) * 0.4;
  const scale    = interpolate(frame, [0, 40], [0.4, 1], { extrapolateRight: 'clamp' });

  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 8, 8]}  intensity={3.5} color="#e94560" />
      <pointLight position={[-6, -4, 6]} intensity={1.8} color="#4cc9f0" />

      {/* Primary red hemisphere */}
      <mesh rotation={[0.3, rotation, 0.1]} scale={[scale, scale, scale]}>
        <icosahedronGeometry args={[2.8, 3]} />
        <meshStandardMaterial
          color="#e94560"
          wireframe
          opacity={0.55}
          transparent
        />
      </mesh>

      {/* Cyan inner shell — slightly smaller, counter-rotates */}
      <mesh rotation={[-0.2, -rotation * 0.6, 0.15]} scale={[scale * 0.72, scale * 0.72, scale * 0.72]}>
        <icosahedronGeometry args={[2.8, 2]} />
        <meshStandardMaterial
          color="#4cc9f0"
          wireframe
          opacity={0.35}
          transparent
        />
      </mesh>
    </>
  );
};

export const ThreeBrain: React.FC = () => (
  <ThreeCanvas
    width={1080}
    height={1920}
    style={{ position: 'absolute', inset: 0 }}
  >
    <BrainMesh />
  </ThreeCanvas>
);
