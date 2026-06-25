import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type PsychHeadVariant = 'spiral' | 'wave' | 'pulse' | 'orbit';

const Spiral: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.2} />
    <pointLight position={[0, 0, 3]} intensity={3.0} color="#d400ff" />
    <pointLight position={[3, 2, 1]} intensity={1.5} color="#00f0ff" />
    <mesh rotation={[t * 0.2, t * 0.5, t * 0.15]}>
      <torusKnotGeometry args={[1.2, 0.28, 200, 20, 2, 3]} />
      <meshStandardMaterial color="#9900cc" roughness={0.15} metalness={0.8} emissive="#440055" emissiveIntensity={0.4} />
    </mesh>
  </>
);

const Wave: React.FC<{ t: number }> = ({ t }) => {
  const count = 12;
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={2.0} color="#ffffff" />
      <pointLight position={[-2, 2, 2]} intensity={2.0} color="#d400ff" />
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const r = 1.5;
        const waveY = Math.sin(t * 2 + i * 0.8) * 0.5;
        const scale = 0.5 + Math.sin(t * 3 + i) * 0.2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, waveY, Math.sin(angle) * r]}
            scale={[scale, scale, scale]}
          >
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(0.75 + (i / count) * 0.15, 1, 0.55)}
              roughness={0.3}
              metalness={0.6}
              emissive={new THREE.Color().setHSL(0.75 + (i / count) * 0.15, 1, 0.2)}
            />
          </mesh>
        );
      })}
      <mesh rotation={[0, t * 0.3, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#d400ff" roughness={0.2} metalness={0.8} />
      </mesh>
    </>
  );
};

const Pulse: React.FC<{ t: number }> = ({ t }) => {
  const scale = 1 + Math.sin(t * 3) * 0.18;
  const inner = 1 + Math.sin(t * 3 + 1) * 0.12;
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 0]} intensity={4.0} color="#ff00ff" />
      <pointLight position={[3, 2, 2]} intensity={1.5} color="#00f0ff" />
      <mesh scale={[inner, inner, inner]} rotation={[t * 0.15, t * 0.3, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#cc00ff" roughness={0.1} metalness={0.9} emissive="#660099" emissiveIntensity={0.6} />
      </mesh>
      <mesh scale={[scale, scale, scale]} rotation={[t * 0.1, t * 0.2, 0]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#ff44ff" roughness={0.05} metalness={0.8} wireframe />
      </mesh>
      <mesh scale={[scale * 1.3, scale * 1.3, scale * 1.3]} rotation={[-t * 0.08, t * 0.15, 0]}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#aa00cc" roughness={0.05} metalness={0.7} wireframe />
      </mesh>
    </>
  );
};

const Orbit: React.FC<{ t: number }> = ({ t }) => {
  const moons: { r: number; speed: number; size: number; color: string }[] = [
    { r: 1.8, speed: 0.5, size: 0.22, color: '#ff44ff' },
    { r: 2.4, speed: 0.3, size: 0.16, color: '#00f0ff' },
    { r: 1.3, speed: 0.9, size: 0.14, color: '#ffaa00' },
    { r: 3.0, speed: 0.2, size: 0.28, color: '#9900ff' },
  ];
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 0, 0]} intensity={3.5} color="#d400ff" />
      <pointLight position={[4, 3, 2]} intensity={1.5} color="#ffffff" />
      <mesh rotation={[t * 0.15, t * 0.25, 0]}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial color="#cc00ff" roughness={0.2} metalness={0.85} emissive="#440066" />
      </mesh>
      {moons.map(({ r, speed, size, color }, i) => {
        const angle = t * speed + (i * Math.PI * 2) / moons.length;
        const tilt = (i * Math.PI) / moons.length;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * Math.sin(tilt) * r * 0.5;
        const z = Math.sin(angle) * Math.cos(tilt) * r;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[size, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        );
      })}
    </>
  );
};

const SCENES: Record<PsychHeadVariant, React.FC<{ t: number }>> = {
  spiral: Spiral,
  wave: Wave,
  pulse: Pulse,
  orbit: Orbit,
};

const PsychScene: React.FC<{ variant: PsychHeadVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const PsychHead3D: React.FC<{ variant?: PsychHeadVariant; durationFrames?: number }> = ({
  variant = 'spiral',
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
    camera={{ position: [0, 0, 4.5], fov: 50 }}
  >
    <PsychScene variant={variant} />
  </ThreeCanvas>
);
