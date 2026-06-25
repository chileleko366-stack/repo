import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type BrainVariant = 'scan' | 'map' | 'wave' | 'lattice';

const Scan: React.FC<{ t: number }> = ({ t }) => {
  const scanY = ((t * 0.5) % 1) * 4 - 2;
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 6, 4]} intensity={2.5} color="#e0f8ff" />
      <pointLight position={[-2, 2, 2]} intensity={2.0} color="#00ccff" />
      <group rotation={[0.1, t * 0.28, 0]}>
        {/* Brain shape approximation: distorted sphere */}
        <mesh>
          <sphereGeometry args={[1.3, 32, 32]} />
          <meshStandardMaterial color="#d4f5f7" roughness={0.55} metalness={0.08} transparent opacity={0.85} />
        </mesh>
        {/* Lobes */}
        <mesh position={[0.4, 0.1, 0]}>
          <sphereGeometry args={[0.85, 16, 16]} />
          <meshStandardMaterial color="#c8f0f4" roughness={0.6} metalness={0.06} transparent opacity={0.7} />
        </mesh>
        <mesh position={[-0.4, 0.1, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#ccf2f5" roughness={0.6} metalness={0.06} transparent opacity={0.7} />
        </mesh>
        {/* Scan plane */}
        <mesh position={[0, scanY, 0]}>
          <boxGeometry args={[3.5, 0.02, 3.5]} />
          <meshStandardMaterial color="#00ffff" emissive="#00cccc" emissiveIntensity={1.5} transparent opacity={0.6} />
        </mesh>
      </group>
    </>
  );
};

const Map: React.FC<{ t: number }> = ({ t }) => {
  const regions = 8;
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={2.0} color="#e0f8ff" />
      <pointLight position={[-2, 2, 2]} intensity={1.8} color="#00ccff" />
      <group rotation={[0.15, t * 0.2, 0]}>
        <mesh>
          <sphereGeometry args={[1.35, 24, 24]} />
          <meshStandardMaterial color="#334455" roughness={0.8} metalness={0.2} transparent opacity={0.5} />
        </mesh>
        {Array.from({ length: regions }, (_, i) => {
          const phi = Math.acos(-1 + (2 * i) / regions);
          const theta = Math.sqrt(regions * Math.PI) * phi;
          const r = 1.38;
          const active = Math.sin(t * 1.5 + i * 0.9) > 0.0;
          const color = new THREE.Color().setHSL(
            active ? 0.55 + i * 0.04 : 0.6,
            active ? 1.0 : 0.4,
            active ? 0.55 : 0.25
          );
          return (
            <mesh
              key={i}
              position={[
                r * Math.cos(theta) * Math.sin(phi),
                r * Math.cos(phi),
                r * Math.sin(theta) * Math.sin(phi),
              ]}
            >
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color={color} emissive={active ? color : new THREE.Color(0, 0, 0)} emissiveIntensity={0.5} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

const Wave: React.FC<{ t: number }> = ({ t }) => {
  const count = 5;
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 3]} intensity={3.0} color="#00ccff" />
      <pointLight position={[-2, 2, 2]} intensity={1.5} color="#4dd0e1" />
      <group rotation={[0, t * 0.15, 0]}>
        {Array.from({ length: count }, (_, i) => {
          const phase = t * 2 - i * 0.6;
          const r = 0.5 + Math.abs(Math.sin(phase)) * 1.5;
          const opacity = 0.8 - i * 0.12;
          return (
            <mesh key={i} rotation={[Math.PI / 2, i * 0.4, t * 0.05]}>
              <torusGeometry args={[r, 0.06, 8, 80]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.52 + i * 0.02, 0.9, 0.5)}
                transparent
                opacity={Math.max(0.05, opacity)}
                emissive={new THREE.Color().setHSL(0.52 + i * 0.02, 0.9, 0.25)}
                emissiveIntensity={0.6}
                roughness={0.1}
              />
            </mesh>
          );
        })}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#00ffff" emissive="#00aacc" emissiveIntensity={1.5} roughness={0.3} />
        </mesh>
      </group>
    </>
  );
};

const Lattice: React.FC<{ t: number }> = ({ t }) => {
  const size = 3;
  const nodes: [number, number, number][] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        nodes.push([x * 1.1, y * 1.1, z * 1.1]);
      }
    }
  }
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[3, 5, 4]} intensity={2.0} color="#e0f8ff" />
      <pointLight position={[-2, 2, 2]} intensity={1.8} color="#00ccff" />
      <group rotation={[t * 0.1, t * 0.2, t * 0.05]}>
        {nodes.map(([x, y, z], i) => {
          const pulse = Math.sin(t * 2 + i * 0.5) * 0.5 + 0.5;
          return (
            <mesh key={i} position={[x, y, z]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.55, 1, 0.4 + pulse * 0.2)}
                emissive={new THREE.Color().setHSL(0.55, 1, pulse * 0.25)}
                emissiveIntensity={1.0}
                roughness={0.2}
              />
            </mesh>
          );
        })}
        {/* Wireframe cube */}
        <mesh rotation={[t * 0.1, t * 0.2, 0]}>
          <boxGeometry args={[2.3, 2.3, 2.3]} />
          <meshStandardMaterial color="#00aacc" wireframe transparent opacity={0.3} />
        </mesh>
      </group>
    </>
  );
};

const SCENES: Record<BrainVariant, React.FC<{ t: number }>> = {
  scan: Scan,
  map: Map,
  wave: Wave,
  lattice: Lattice,
};

const BrainScene: React.FC<{ variant: BrainVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const ThreeBrain: React.FC<{ variant?: BrainVariant; durationFrames?: number }> = ({
  variant = 'scan',
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
    camera={{ position: [0, 0.5, 5.0], fov: 44 }}
  >
    <BrainScene variant={variant} />
  </ThreeCanvas>
);
