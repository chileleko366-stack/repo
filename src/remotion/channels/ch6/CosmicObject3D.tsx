import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type CosmicVariant =
  | 'planet' | 'nebula' | 'satellite' | 'blackhole'
  | 'asteroid' | 'star' | 'wormhole';

const Planet: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.1} />
    <directionalLight position={[4, 3, 5]} intensity={3.5} color="#c0d8ff" />
    <pointLight position={[-4, 2, 2]} intensity={2.0} color="#ff4400" />
    <mesh rotation={[0.3, t * 0.25, 0]}>
      <sphereGeometry args={[1.6, 64, 64]} />
      <meshStandardMaterial color="#1a3a6e" roughness={0.7} metalness={0.1} />
    </mesh>
    <mesh rotation={[1.3, t * 0.4, 0]}>
      <torusGeometry args={[2.4, 0.18, 16, 100]} />
      <meshStandardMaterial color="#8899bb" roughness={0.5} metalness={0.6} />
    </mesh>
  </>
);

const Nebula: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.2} />
    <pointLight position={[0, 0, 0]} intensity={3.0} color="#cc44ff" />
    <pointLight position={[2, -1, 1]} intensity={1.5} color="#0044ff" />
    <pointLight position={[-2, 1, 1]} intensity={1.5} color="#ff2200" />
    {[0, 1, 2, 3].map((i) => {
      const angle = (i / 4) * Math.PI * 2 + t * 0.2;
      const r = 1.0 + i * 0.35;
      return (
        <mesh key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r * 0.5, 0]}
          rotation={[t * 0.3, t * 0.5 + i, 0]}>
          <icosahedronGeometry args={[0.35 + i * 0.08, 0]} />
          <meshStandardMaterial color="#9933ff" roughness={0.3} metalness={0.8} wireframe={i % 2 === 0} />
        </mesh>
      );
    })}
    <mesh rotation={[0, t * 0.15, t * 0.1]}>
      <torusKnotGeometry args={[0.8, 0.12, 128, 16, 2, 3]} />
      <meshStandardMaterial color="#ff44cc" roughness={0.2} metalness={0.9} emissive="#440022" />
    </mesh>
  </>
);

const Satellite: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.15} />
    <directionalLight position={[5, 4, 3]} intensity={4.0} color="#ffffff" />
    <pointLight position={[-3, 0, 2]} intensity={1.5} color="#4488ff" />
    <group rotation={[0.4, t * 0.3, 0]}>
      <mesh>
        <boxGeometry args={[0.7, 0.4, 0.4]} />
        <meshStandardMaterial color="#ccddee" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, t * 0.8]}>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 8]} />
        <meshStandardMaterial color="#aabbcc" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.04]} />
        <meshStandardMaterial color="#223355" roughness={0.8} metalness={0.1} emissive="#001133" />
      </mesh>
      <mesh position={[-1.5, 0, 0]}>
        <boxGeometry args={[1.0, 0.6, 0.04]} />
        <meshStandardMaterial color="#223355" roughness={0.8} metalness={0.1} emissive="#001133" />
      </mesh>
    </group>
  </>
);

const Blackhole: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.05} />
    <pointLight position={[3, 2, 3]} intensity={2.5} color="#ff6600" />
    <pointLight position={[-3, -2, 2]} intensity={1.5} color="#ffaa00" />
    <mesh>
      <sphereGeometry args={[0.9, 32, 32]} />
      <meshStandardMaterial color="#000000" roughness={1.0} metalness={0.0} />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, t * (0.5 + i * 0.2), 0]}>
        <torusGeometry args={[1.4 + i * 0.5, 0.06 - i * 0.01, 8, 120]} />
        <meshStandardMaterial
          color={new THREE.Color().setHSL(0.08 + i * 0.04, 1, 0.5)}
          roughness={0.1}
          metalness={0.0}
          emissive={new THREE.Color().setHSL(0.08 + i * 0.04, 1, 0.25)}
        />
      </mesh>
    ))}
  </>
);

const Asteroid: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.1} />
    <directionalLight position={[5, 3, 2]} intensity={3.5} color="#ffeedd" />
    <pointLight position={[-3, 1, 2]} intensity={1.0} color="#4488ff" />
    <group rotation={[t * 0.12, t * 0.28, t * 0.08]}>
      <mesh>
        <dodecahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#665544" roughness={0.95} metalness={0.05} />
      </mesh>
    </group>
    <group rotation={[t * 0.25, -t * 0.15, t * 0.2]} position={[2, 0.5, 0]}>
      <mesh>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial color="#554433" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  </>
);

const Star: React.FC<{ t: number }> = ({ t }) => {
  const pulse = 1 + Math.sin(t * 3) * 0.08;
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={5.0} color="#ffffaa" />
      <pointLight position={[3, 2, 2]} intensity={1.5} color="#ff8800" />
      <mesh scale={[pulse, pulse, pulse]} rotation={[t * 0.1, t * 0.2, 0]}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#ffcc00"
          roughness={0.3}
          metalness={0.1}
          emissive="#ff8800"
          emissiveIntensity={0.6 + Math.sin(t * 4) * 0.2}
        />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2 + t * 0.4;
        return (
          <mesh key={i} position={[Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#ffee44" emissive="#ffaa00" emissiveIntensity={1.0} />
          </mesh>
        );
      })}
    </>
  );
};

const Wormhole: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.1} />
    <pointLight position={[0, 0, 2]} intensity={3.0} color="#00ccff" />
    <pointLight position={[0, 0, -2]} intensity={2.0} color="#cc00ff" />
    {[0, 1, 2, 3, 4].map((i) => {
      const r = 0.5 + i * 0.35;
      const speed = 0.3 + i * 0.1;
      return (
        <mesh key={i} rotation={[Math.PI / 2, t * speed + (i * Math.PI) / 5, 0]}>
          <torusGeometry args={[r, 0.04, 8, 80]} />
          <meshStandardMaterial
            color={new THREE.Color().setHSL(0.55 + i * 0.06, 1, 0.6)}
            emissive={new THREE.Color().setHSL(0.55 + i * 0.06, 1, 0.3)}
            emissiveIntensity={0.8}
            roughness={0.1}
            metalness={0.5}
          />
        </mesh>
      );
    })}
    <mesh rotation={[0, t * 0.5, 0]}>
      <torusKnotGeometry args={[0.4, 0.08, 128, 8, 2, 5]} />
      <meshStandardMaterial color="#ffffff" emissive="#88aaff" emissiveIntensity={1.0} />
    </mesh>
  </>
);

const SCENES: Record<CosmicVariant, React.FC<{ t: number }>> = {
  planet: Planet,
  nebula: Nebula,
  satellite: Satellite,
  blackhole: Blackhole,
  asteroid: Asteroid,
  star: Star,
  wormhole: Wormhole,
};

const CosmicScene: React.FC<{ variant: CosmicVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const CosmicObject3D: React.FC<{ variant?: CosmicVariant }> = ({
  variant = 'planet',
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
    camera={{ position: [0, 0, 5], fov: 50 }}
  >
    <CosmicScene variant={variant} />
  </ThreeCanvas>
);
