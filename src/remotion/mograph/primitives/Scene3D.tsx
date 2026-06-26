import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';

interface Scene3DProps {
  accentColor?: string;
  backgroundColor?: string;
}

const Scene3DInner: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 6, 4]} intensity={2.5} />
      <pointLight position={[-3, 2, 3]} intensity={1.5} color={accent} />
      <group rotation={[t * 0.3, t * 0.5, 0]}>
        <mesh>
          <icosahedronGeometry args={[1.4, 2]} />
          <meshStandardMaterial color={accent} roughness={0.2} metalness={0.7} wireframe />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial color={accent} roughness={0.1} metalness={0.9} transparent opacity={0.15} />
        </mesh>
      </group>
    </>
  );
};

export const Scene3D: React.FC<Scene3DProps> = ({
  accentColor = '#00ff88',
  backgroundColor = '#0a0e1a',
}) => (
  <AbsoluteFill style={{ background: backgroundColor }}>
    <ThreeCanvas
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0 }}
      gl={{ failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: true, powerPreference: 'low-power' as WebGLPowerPreference, antialias: true }}
      camera={{ position: [0, 0, 4.5], fov: 50 }}
    >
      <Scene3DInner accent={accentColor} />
    </ThreeCanvas>
  </AbsoluteFill>
);
