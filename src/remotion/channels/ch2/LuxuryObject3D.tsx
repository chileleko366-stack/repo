import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type LuxuryVariant = 'coin' | 'crystal' | 'tower' | 'ring';

const Coin: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[4, 6, 4]} intensity={4.0} color="#ffffff" />
    <spotLight position={[0, 6, 2]} angle={0.4} penumbra={0.4} intensity={3.0} color="#ffdd88" />
    <pointLight position={[-3, 0, 2]} intensity={1.5} color="#ffaa00" />
    <group rotation={[0.1, t * 0.45, 0]}>
      <mesh>
        <cylinderGeometry args={[1.4, 1.4, 0.12, 64]} />
        <meshStandardMaterial color="#d4a017" roughness={0.05} metalness={1.0} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.25, 1.25, 0.01, 64]} />
        <meshStandardMaterial color="#ffcc33" roughness={0.15} metalness={0.95} />
      </mesh>
    </group>
  </>
);

const Crystal: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.15} />
    <directionalLight position={[3, 6, 4]} intensity={3.0} color="#ffffff" />
    <pointLight position={[-3, 2, 3]} intensity={2.0} color="#00ff88" />
    <pointLight position={[2, -2, 2]} intensity={1.5} color="#00ccff" />
    <pointLight position={[0, 4, 1]} intensity={1.5} color="#ff44ff" />
    <group rotation={[Math.sin(t * 0.3) * 0.2, t * 0.35, Math.sin(t * 0.4) * 0.1]}>
      <mesh>
        <octahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial color="#aaeeff" roughness={0.0} metalness={0.1} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[0.5, 0.5, 0]}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#ccffee" roughness={0.0} metalness={0.2} transparent opacity={0.5} />
      </mesh>
    </group>
  </>
);

const Tower: React.FC<{ t: number }> = ({ t }) => {
  const floors = 6;
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 8, 3]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-3, 2, 3]} intensity={1.5} color="#00ff88" />
      <group rotation={[0, t * 0.2, 0]}>
        {Array.from({ length: floors }, (_, i) => {
          const y = i * 0.45 - 1.1;
          const scale = 1 - i * 0.08;
          return (
            <mesh key={i} position={[0, y, 0]}>
              <boxGeometry args={[scale * 1.2, 0.38, scale * 1.2]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.55, 0.6, 0.3 + i * 0.06)}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          );
        })}
        {/* Antenna */}
        <mesh position={[0, floors * 0.45 - 0.85, 0]}>
          <cylinderGeometry args={[0.02, 0.04, 0.6, 8]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>
    </>
  );
};

const Ring: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[4, 6, 3]} intensity={4.0} color="#ffffff" />
    <spotLight position={[0, 5, 3]} angle={0.3} penumbra={0.5} intensity={3.0} />
    <pointLight position={[-2, 1, 3]} intensity={1.8} color="#ffcc44" />
    <group rotation={[0.5, t * 0.4, Math.sin(t * 0.3) * 0.2]}>
      <mesh>
        <torusGeometry args={[1.1, 0.22, 32, 128]} />
        <meshStandardMaterial color="#d4a017" roughness={0.04} metalness={1.0} />
      </mesh>
      {/* Diamond */}
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 6, t * 0.6, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#eeffff" roughness={0.0} metalness={0.2} transparent opacity={0.85} />
      </mesh>
    </group>
  </>
);

const SCENES: Record<LuxuryVariant, React.FC<{ t: number }>> = {
  coin: Coin,
  crystal: Crystal,
  tower: Tower,
  ring: Ring,
};

const LuxuryScene: React.FC<{ variant: LuxuryVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const LuxuryObject3D: React.FC<{ variant?: LuxuryVariant }> = ({
  variant = 'coin',
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
    camera={{ position: [0, 0.5, 4.5], fov: 46 }}
  >
    <LuxuryScene variant={variant} />
  </ThreeCanvas>
);
