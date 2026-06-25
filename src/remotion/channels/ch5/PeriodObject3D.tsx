import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export type PeriodVariant = 'sword' | 'vessel' | 'crown' | 'torch';

const Sword: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[4, 6, 3]} intensity={3.5} color="#ffe8c8" />
    <spotLight position={[0, 5, 3]} angle={0.3} penumbra={0.5} intensity={3.0} color="#ffffff" />
    <pointLight position={[-2, 2, 3]} intensity={1.5} color="#c8a040" />
    <group rotation={[0.2, Math.sin(t * 0.4) * 0.35 + t * 0.08, 0.1]}>
      {/* Blade */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.1, 2.2, 0.04]} />
        <meshStandardMaterial color="#ccddee" roughness={0.1} metalness={0.95} />
      </mesh>
      {/* Fuller (groove) */}
      <mesh position={[0, 0.8, 0.025]}>
        <boxGeometry args={[0.025, 1.8, 0.01]} />
        <meshStandardMaterial color="#aabbcc" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Crossguard */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[0.9, 0.12, 0.1]} />
        <meshStandardMaterial color="#c8a040" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Grip */}
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.8, 12]} />
        <meshStandardMaterial color="#553311" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Pommel */}
      <mesh position={[0, -1.1, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color="#c8a040" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  </>
);

const Vessel: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[3, 6, 4]} intensity={2.5} color="#ffe8c8" />
    <pointLight position={[-2, 2, 3]} intensity={1.5} color="#c8a040" />
    <group rotation={[0, Math.sin(t * 0.3) * 0.3 + t * 0.1, 0]}>
      {/* Goblet bowl */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.65, 0.35, 0.9, 24]} />
        <meshStandardMaterial color="#c8a040" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.0, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.65, 12]} />
        <meshStandardMaterial color="#c8a040" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.18, 24]} />
        <meshStandardMaterial color="#c8a040" roughness={0.2} metalness={0.85} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 1.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.63, 0.05, 8, 32]} />
        <meshStandardMaterial color="#d4b030" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  </>
);

const Crown: React.FC<{ t: number }> = ({ t }) => {
  const points = 6;
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={3.0} color="#ffe8c8" />
      <spotLight position={[0, 5, 2]} angle={0.4} penumbra={0.4} intensity={2.5} color="#ffdd88" />
      <pointLight position={[-2, 1, 3]} intensity={1.5} color="#c8a040" />
      <group rotation={[0.1, t * 0.3, 0]}>
        {/* Band */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.0, 0.18, 12, 48]} />
          <meshStandardMaterial color="#c8a017" roughness={0.1} metalness={1.0} />
        </mesh>
        {/* Points */}
        {Array.from({ length: points }, (_, i) => {
          const angle = (i / points) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * 1.0, 0.55, Math.sin(angle) * 1.0]}>
              <coneGeometry args={[0.12, 0.65, 6]} />
              <meshStandardMaterial color="#d4b030" roughness={0.1} metalness={1.0} />
            </mesh>
          );
        })}
        {/* Gems */}
        {Array.from({ length: points }, (_, i) => {
          const angle = ((i + 0.5) / points) * Math.PI * 2;
          const gemColors = ['#ff4444', '#4444ff', '#44ff44', '#ff44ff', '#ffff44', '#44ffff'];
          return (
            <mesh key={i} position={[Math.cos(angle) * 1.0, 0.05, Math.sin(angle) * 1.0]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color={gemColors[i]} roughness={0.0} metalness={0.2} transparent opacity={0.85} emissive={gemColors[i]} emissiveIntensity={0.3} />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

const Torch: React.FC<{ t: number }> = ({ t }) => {
  const flicker = 0.8 + Math.sin(t * 12) * 0.12 + Math.sin(t * 7.3) * 0.08;
  const flameScale = flicker;
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 1.2, 0]} intensity={5.0 * flicker} color="#ff8800" />
      <pointLight position={[-2, 2, 2]} intensity={1.0} color="#cc4400" />
      <directionalLight position={[3, 5, 3]} intensity={1.5} color="#ffe8c8" />
      <group rotation={[0.15, Math.sin(t * 0.4) * 0.25, 0]}>
        {/* Handle */}
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 1.5, 10]} />
          <meshStandardMaterial color="#553311" roughness={0.85} metalness={0.1} />
        </mesh>
        {/* Binding wrap */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, -0.3 + i * 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.13, 0.03, 6, 16]} />
            <meshStandardMaterial color="#c8a040" roughness={0.4} metalness={0.6} />
          </mesh>
        ))}
        {/* Torch head */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.18, 0.45, 12]} />
          <meshStandardMaterial color="#664422" roughness={0.7} metalness={0.15} />
        </mesh>
        {/* Flame base */}
        <mesh position={[0, 0.75, 0]} scale={[flameScale, flameScale, flameScale]}>
          <coneGeometry args={[0.25, 0.7, 12]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={1.5} roughness={1.0} transparent opacity={0.85} />
        </mesh>
        {/* Flame tip */}
        <mesh position={[Math.sin(t * 4) * 0.04, 1.25, Math.cos(t * 3.5) * 0.04]}
          scale={[flameScale * 0.6, flameScale, flameScale * 0.6]}>
          <coneGeometry args={[0.14, 0.55, 8]} />
          <meshStandardMaterial color="#ffee00" emissive="#ffaa00" emissiveIntensity={2.0} roughness={1.0} transparent opacity={0.75} />
        </mesh>
      </group>
    </>
  );
};

const SCENES: Record<PeriodVariant, React.FC<{ t: number }>> = {
  sword: Sword,
  vessel: Vessel,
  crown: Crown,
  torch: Torch,
};

const PeriodScene: React.FC<{ variant: PeriodVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const PeriodObject3D: React.FC<{ variant?: PeriodVariant }> = ({
  variant = 'vessel',
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
    camera={{ position: [0, 0.3, 4.5], fov: 48 }}
  >
    <PeriodScene variant={variant} />
  </ThreeCanvas>
);
