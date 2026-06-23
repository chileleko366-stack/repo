/**
 * PsychHead3D — animated 3D face for psychology beats.
 * Uses facecap.glb from three.js examples.
 * File: public/models/facecap.glb
 *
 * Subtle oscillating rotation evokes consciousness / the mind turning over an idea.
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const HeadModel: React.FC<{ durationFrames: number }> = ({ durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(staticFile('models/facecap.glb'));

  const rotY = Math.sin(t * 0.4) * 0.3;
  const progress = durationFrames > 0 ? frame / durationFrames : 0;
  const scale = interpolate(progress, [0, 0.1, 1], [0.7, 1.0, 1.02], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 6, 4]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-3, 0, 2]} intensity={1.2} color="#d400ff" />
      <pointLight position={[3, -2, 2]} intensity={0.8} color="#00f0ff" />
      <group rotation={[0, rotY, 0]} scale={[scale, scale, scale]} position={[0, 0.3, 0]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const PsychHead3D: React.FC<{ durationFrames?: number }> = ({ durationFrames = 240 }) => (
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
    camera={{ position: [0, 0.2, 3.5], fov: 48 }}
  >
    <HeadModel durationFrames={durationFrames} />
  </ThreeCanvas>
);

useGLTF.preload(staticFile('models/facecap.glb'));
