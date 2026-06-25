import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type HistoricalArtifactVariant = 'artifact' | 'coin' | 'relic' | 'seal';

const Artifact: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[3, 6, 4]} intensity={3.0} color="#ffe8c8" />
    <pointLight position={[-2, 2, 3]} intensity={1.5} color="#c8a040" />
    <pointLight position={[2, -1, 2]} intensity={0.8} color="#8b5a14" />
    <group rotation={[0.15, t * 0.25, 0]}>
      {/* Urn/vessel base */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.8, 0.5, 1.4, 24]} />
        <meshStandardMaterial color="#8b6914" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.3, 0.55, 0.5, 16]} />
        <meshStandardMaterial color="#9a7820" roughness={0.65} metalness={0.3} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 1.15, 0]}>
        <torusGeometry args={[0.38, 0.08, 8, 24]} />
        <meshStandardMaterial color="#c8a040" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Handles */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.85, 0.3, 0]} rotation={[0, 0, side * Math.PI / 3]}>
          <torusGeometry args={[0.22, 0.05, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#c8a040" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
    </group>
  </>
);

const HistoryCoin: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[3, 6, 4]} intensity={3.5} color="#ffe8c8" />
    <spotLight position={[0, 5, 2]} angle={0.35} penumbra={0.5} intensity={3.0} color="#ffdd88" />
    <pointLight position={[-2, 0, 3]} intensity={1.5} color="#c8a040" />
    <group rotation={[0.2, t * 0.4, 0]}>
      <mesh>
        <cylinderGeometry args={[1.3, 1.3, 0.14, 64]} />
        <meshStandardMaterial color="#c8a017" roughness={0.08} metalness={1.0} />
      </mesh>
      {/* Relief on face */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.02, 32]} />
        <meshStandardMaterial color="#d4b030" roughness={0.15} metalness={0.9} />
      </mesh>
      {/* Rim edge detail */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.28, 0.04, 8, 64]} />
        <meshStandardMaterial color="#aa8810" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  </>
);

const Relic: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.45} />
    <directionalLight position={[2, 6, 4]} intensity={2.5} color="#ffe8c8" />
    <pointLight position={[-2, 2, 3]} intensity={1.5} color="#e8c870" />
    <pointLight position={[2, -1, 2]} intensity={0.8} color="#c87820" />
    <group rotation={[0, Math.sin(t * 0.35) * 0.4, 0]}>
      {/* Head/bust pedestal */}
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[0.9, 0.55, 0.5]} />
        <meshStandardMaterial color="#888877" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.55, 12]} />
        <meshStandardMaterial color="#c8b090" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshStandardMaterial color="#c8b090" roughness={0.65} metalness={0.08} />
      </mesh>
      {/* Crown/headdress */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.4, 0.32, 0.5, 16]} />
        <meshStandardMaterial color="#c8a040" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  </>
);

const Seal: React.FC<{ t: number }> = ({ t }) => {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={2.5} color="#ffe8c8" />
      <pointLight position={[-2, 2, 3]} intensity={1.5} color="#c8a040" />
      <group rotation={[0.3, t * 0.35, 0]}>
        {/* Seal disc */}
        <mesh>
          <cylinderGeometry args={[1.2, 1.2, 0.18, 48]} />
          <meshStandardMaterial color="#8b4513" roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Wax surface */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 0.04, 48]} />
          <meshStandardMaterial color="#aa2200" roughness={0.8} metalness={0.0} />
        </mesh>
        {/* Concentric ring detail */}
        {[0.3, 0.6, 0.9].map((r) => (
          <mesh key={r} position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.03, 4, 32]} />
            <meshStandardMaterial color="#880000" roughness={0.7} metalness={0.1} />
          </mesh>
        ))}
        {/* Handle */}
        <mesh position={[0, -0.7, 0]}>
          <cylinderGeometry args={[0.18, 0.28, 1.1, 12]} />
          <meshStandardMaterial color="#6b3410" roughness={0.7} metalness={0.2} />
        </mesh>
      </group>
    </>
  );
};

const SCENES: Record<HistoricalArtifactVariant, React.FC<{ t: number }>> = {
  artifact: Artifact,
  coin: HistoryCoin,
  relic: Relic,
  seal: Seal,
};

const ArtifactScene: React.FC<{ variant: HistoricalArtifactVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const HistoricalArtifact3D: React.FC<{ variant?: HistoricalArtifactVariant }> = ({
  variant = 'artifact',
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
    camera={{ position: [0, 0.2, 4.0], fov: 48 }}
  >
    <ArtifactScene variant={variant} />
  </ThreeCanvas>
);
