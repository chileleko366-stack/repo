import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

const CameraModel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { scene } = useGLTF(staticFile('models/antique_camera.glb'));

  const rotY = Math.sin(t * 0.28) * 0.45;
  const rotX = Math.sin(t * 0.15) * 0.08;

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={2.2} color="#ffe8c8" />
      <pointLight position={[-3, 1, 2]} intensity={1.4} color="#cc0000" />
      <pointLight position={[2, -2, 3]} intensity={0.7} color="#ff6600" />
      <group rotation={[rotX, rotY, 0]} scale={[1.2, 1.2, 1.2]} position={[0, 0, 0]}>
        <primitive object={scene} />
      </group>
    </>
  );
};

export const AntiqueCamera3D: React.FC = () => (
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
    camera={{ position: [0, 0.5, 4.0], fov: 46 }}
  >
    <CameraModel />
  </ThreeCanvas>
);

useGLTF.preload(staticFile('models/antique_camera.glb'));
