import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type ClassifiedVariant = 'file' | 'eye' | 'lock' | 'signal';

const File: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.2} />
    <directionalLight position={[3, 5, 4]} intensity={2.0} color="#ffe0c0" />
    <pointLight position={[-3, 1, 2]} intensity={1.8} color="#cc0000" />
    <group rotation={[0, Math.sin(t * 0.3) * 0.4, 0]}>
      {/* Document stack */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.06, i * 0.03, i * 0.06]} rotation={[0, i * 0.15, 0]}>
          <boxGeometry args={[1.4, 1.8, 0.05]} />
          <meshStandardMaterial color={i === 0 ? '#cccccc' : '#eeeeee'} roughness={0.8} metalness={0.05} />
        </mesh>
      ))}
      {/* REDACTED stamp */}
      <mesh position={[0, 0.1, 0.14]}>
        <boxGeometry args={[1.1, 0.22, 0.02]} />
        <meshStandardMaterial color="#cc0000" roughness={0.6} metalness={0.1} emissive="#440000" />
      </mesh>
      {/* Folder tab */}
      <mesh position={[-0.42, 0.98, 0]}>
        <boxGeometry args={[0.38, 0.18, 0.07]} />
        <meshStandardMaterial color="#ddbb55" roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  </>
);

const Eye: React.FC<{ t: number }> = ({ t }) => {
  const blink = Math.abs(Math.sin(t * 0.7)) > 0.97 ? 0.05 : 1.0;
  const pupilX = Math.sin(t * 0.6) * 0.18;
  const pupilY = Math.sin(t * 0.8) * 0.1;
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[2, 5, 4]} intensity={2.5} color="#ffffff" />
      <pointLight position={[0, 0, 2]} intensity={2.0} color="#ff2200" />
      <pointLight position={[-2, 1, 2]} intensity={1.0} color="#cc0000" />
      {/* Sclera */}
      <mesh rotation={[0, t * 0.05, 0]}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial color="#f0ece4" roughness={0.5} metalness={0.0} />
      </mesh>
      {/* Iris */}
      <mesh position={[pupilX * 0.5, pupilY * 0.5, 0.95]} scale={[1, blink, 1]}>
        <cylinderGeometry args={[0.52, 0.52, 0.08, 32]} />
        <meshStandardMaterial color="#4a2200" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Pupil */}
      <mesh position={[pupilX, pupilY, 1.04]} scale={[1, blink, 1]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 24]} />
        <meshStandardMaterial color="#050505" roughness={0.7} metalness={0.0} />
      </mesh>
      {/* Highlight */}
      <mesh position={[pupilX + 0.12, pupilY + 0.12, 1.1]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.0} emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
    </>
  );
};

const Lock: React.FC<{ t: number }> = ({ t }) => {
  const shake = Math.sin(t * 8) * (Math.sin(t * 0.5) > 0.8 ? 0.08 : 0);
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 6, 4]} intensity={2.5} color="#ffffff" />
      <pointLight position={[-2, 1, 3]} intensity={1.5} color="#cc0000" />
      <pointLight position={[2, -2, 2]} intensity={0.8} color="#ff6600" />
      <group rotation={[0, shake + Math.sin(t * 0.25) * 0.2, 0]}>
        {/* Lock body */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[1.2, 1.0, 0.55]} />
          <meshStandardMaterial color="#666677" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Keyhole */}
        <mesh position={[0, -0.3, 0.29]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
          <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.2} />
        </mesh>
        {/* Shackle */}
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.38, 0.1, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#555566" roughness={0.25} metalness={0.9} />
        </mesh>
      </group>
    </>
  );
};

const Signal: React.FC<{ t: number }> = ({ t }) => {
  const count = 5;
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 0, 2]} intensity={3.0} color="#cc0000" />
      <pointLight position={[2, 2, 1]} intensity={1.5} color="#ff6600" />
      <group rotation={[0, t * 0.15, 0]}>
        {Array.from({ length: count }, (_, i) => {
          const r = 0.5 + i * 0.45;
          const opacity = 0.3 + Math.sin(t * 3 - i * 0.8) * 0.3;
          return (
            <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, 0.06, 8, 64, Math.PI * 0.7]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.02, 1, 0.4 + opacity * 0.3)}
                roughness={0.3}
                metalness={0.5}
                transparent
                opacity={Math.max(0.15, opacity)}
                emissive={new THREE.Color().setHSL(0.02, 1, opacity * 0.3)}
              />
            </mesh>
          );
        })}
        {/* Antenna base */}
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.06, 0.12, 0.9, 8]} />
          <meshStandardMaterial color="#555566" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Pulse dot */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.12 + Math.sin(t * 4) * 0.04, 16, 16]} />
          <meshStandardMaterial color="#ff0000" emissive="#cc0000" emissiveIntensity={1.0} roughness={0.5} />
        </mesh>
      </group>
    </>
  );
};

const SCENES: Record<ClassifiedVariant, React.FC<{ t: number }>> = {
  file: File,
  eye: Eye,
  lock: Lock,
  signal: Signal,
};

const ClassifiedScene: React.FC<{ variant: ClassifiedVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const ClassifiedObject3D: React.FC<{ variant?: ClassifiedVariant }> = ({
  variant = 'file',
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
    camera={{ position: [0, 0, 4.5], fov: 48 }}
  >
    <ClassifiedScene variant={variant} />
  </ThreeCanvas>
);
