import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';

const SphereScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1.5} />
      <mesh rotation={[t * 0.15, t * 0.4, t * 0.1]}>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshNormalMaterial />
      </mesh>
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
    <SphereScene />
  </ThreeCanvas>
);
