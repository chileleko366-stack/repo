import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';

export type FerrariVariant = 'racer' | 'wheels' | 'chassis' | 'turbo';

const Racer: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[4, 8, 4]} intensity={3.5} color="#ffffff" />
    <pointLight position={[-4, 2, 3]} intensity={2.0} color="#00ff88" />
    <pointLight position={[3, -1, 3]} intensity={1.2} color="#00f0ff" />
    <group rotation={[0.06, Math.sin(t * 0.4) * 0.2 + t * 0.05, 0]}>
      {/* Body */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.2, 0.32, 0.85]} />
        <meshStandardMaterial color="#cc0000" roughness={0.15} metalness={0.85} />
      </mesh>
      {/* Cockpit */}
      <mesh position={[0.1, 0.32, 0]}>
        <boxGeometry args={[0.7, 0.28, 0.6]} />
        <meshStandardMaterial color="#111122" roughness={0.05} metalness={0.9} />
      </mesh>
      {/* Front wing */}
      <mesh position={[-1.2, -0.12, 0]}>
        <boxGeometry args={[0.3, 0.05, 1.3]} />
        <meshStandardMaterial color="#cc0000" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Rear wing */}
      <mesh position={[1.1, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.06, 1.1]} />
        <meshStandardMaterial color="#cc0000" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Wheels */}
      {([-0.85, 0.85] as number[]).map((x) =>
        ([-0.52, 0.52] as number[]).map((z) => (
          <mesh key={`${x}_${z}`} position={[x, -0.16, z]} rotation={[t * 8, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.18, 20]} />
            <meshStandardMaterial color="#111111" roughness={0.9} metalness={0.1} />
          </mesh>
        ))
      )}
    </group>
  </>
);

const Wheels: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[3, 6, 4]} intensity={3.0} color="#ffffff" />
    <pointLight position={[-3, 2, 3]} intensity={1.8} color="#00ff88" />
    {[0, 1, 2].map((i) => {
      const angle = (i / 3) * Math.PI * 2;
      const r = i === 1 ? 0 : 1.8;
      const scale = i === 1 ? 1.2 : 0.85;
      return (
        <group key={i} position={[Math.cos(angle) * r, Math.sin(angle) * r * 0.3, 0]}>
          <mesh rotation={[t * (3 + i * 0.5), 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.55 * scale, 0.55 * scale, 0.4 * scale, 24]} />
            <meshStandardMaterial color="#111111" roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh rotation={[t * (3 + i * 0.5), 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38 * scale, 0.38 * scale, 0.42 * scale, 6]} />
            <meshStandardMaterial color="#cc0000" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      );
    })}
  </>
);

const Chassis: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.35} />
    <directionalLight position={[4, 6, 3]} intensity={3.0} color="#ffffff" />
    <spotLight position={[0, 6, 2]} angle={0.4} penumbra={0.5} intensity={3.0} color="#ffffff" />
    <pointLight position={[-3, 0, 3]} intensity={1.5} color="#00ff88" />
    <group rotation={[0.3, t * 0.4, 0]}>
      <mesh>
        <boxGeometry args={[1.8, 0.08, 0.75]} />
        <meshStandardMaterial color="#882222" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Suspension arms */}
      {([-0.7, 0.7] as number[]).map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, x > 0 ? 0.3 : -0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}
      {/* Engine block */}
      <mesh position={[0.2, 0.2, 0]}>
        <boxGeometry args={[0.7, 0.35, 0.5]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  </>
);

const Turbo: React.FC<{ t: number }> = ({ t }) => {
  const spinSpeed = 6 + Math.sin(t * 2) * 3;
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 2]} intensity={3.0} color="#ff4400" />
      <pointLight position={[-2, 2, 2]} intensity={1.5} color="#00ff88" />
      <group rotation={[t * 0.15, t * 0.2, 0]}>
        {/* Turbine housing */}
        <mesh>
          <cylinderGeometry args={[0.9, 0.9, 0.6, 32]} />
          <meshStandardMaterial color="#555566" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* Spinning impeller */}
        <mesh rotation={[Math.PI / 2, 0, t * spinSpeed]}>
          <torusGeometry args={[0.6, 0.08, 6, 12]} />
          <meshStandardMaterial color="#cc4400" roughness={0.2} metalness={0.8} emissive="#441100" />
        </mesh>
        {/* Intake */}
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.45, 0.55, 0.55, 16]} />
          <meshStandardMaterial color="#444455" roughness={0.4} metalness={0.8} />
        </mesh>
        {/* Heat glow */}
        <mesh position={[0, -0.5, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff1100" emissiveIntensity={1.5} roughness={1.0} metalness={0.0} />
        </mesh>
      </group>
    </>
  );
};

const SCENES: Record<FerrariVariant, React.FC<{ t: number }>> = {
  racer: Racer,
  wheels: Wheels,
  chassis: Chassis,
  turbo: Turbo,
};

const FerrariScene: React.FC<{ variant: FerrariVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const Ferrari3D: React.FC<{ variant?: FerrariVariant; durationFrames?: number }> = ({
  variant = 'racer',
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
    camera={{ position: [0, 1.2, 4.5], fov: 50 }}
  >
    <FerrariScene variant={variant} />
  </ThreeCanvas>
);
