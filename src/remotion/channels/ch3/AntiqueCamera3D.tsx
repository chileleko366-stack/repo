import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type AntiqueCameraVariant = 'lens' | 'reel' | 'aperture' | 'flash';

const Lens: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.2} />
    <directionalLight position={[3, 6, 4]} intensity={3.0} color="#ffe8c8" />
    <pointLight position={[-3, 1, 2]} intensity={2.0} color="#cc0000" />
    <pointLight position={[2, -2, 3]} intensity={1.0} color="#ff6600" />
    <group rotation={[Math.sin(t * 0.25) * 0.1, Math.sin(t * 0.35) * 0.5, 0]}>
      {/* Lens barrel */}
      <mesh>
        <cylinderGeometry args={[0.7, 0.75, 1.5, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Front glass */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 32]} />
        <meshStandardMaterial color="#aaccff" roughness={0.0} metalness={0.1} transparent opacity={0.6} />
      </mesh>
      {/* Focus ring */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, t * 0.5, 0]}>
        <torusGeometry args={[0.76, 0.08, 8, 32]} />
        <meshStandardMaterial color="#888888" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Aperture ring */}
      <mesh position={[0, -0.3, 0]} rotation={[Math.PI / 2, t * 0.8, 0]}>
        <torusGeometry args={[0.76, 0.06, 8, 32]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  </>
);

const Reel: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[3, 5, 4]} intensity={2.5} color="#ffe8c8" />
    <pointLight position={[-2, 2, 3]} intensity={1.5} color="#cc0000" />
    <group rotation={[0.3, t * 0.15, 0]}>
      {/* Film reel */}
      <mesh rotation={[0, 0, t * 2.5]}>
        <cylinderGeometry args={[1.3, 1.3, 0.18, 32]} />
        <meshStandardMaterial color="#222222" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Hub */}
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.22, 16]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Spokes */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const ang = (i / 6) * Math.PI * 2 + t * 2.5;
        return (
          <mesh key={i} position={[Math.cos(ang) * 0.83, 0, Math.sin(ang) * 0.83]}
            rotation={[Math.PI / 2, ang, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.96, 4]} />
            <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.8} />
          </mesh>
        );
      })}
      {/* Film strip */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, t * 2.5]}>
        <torusGeometry args={[1.25, 0.06, 4, 64]} />
        <meshStandardMaterial color="#1a0a00" roughness={0.9} metalness={0.0} />
      </mesh>
    </group>
  </>
);

const Aperture: React.FC<{ t: number }> = ({ t }) => {
  const blades = 8;
  const openAmount = (Math.sin(t * 0.8) + 1) * 0.5;
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 3]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-2, 2, 2]} intensity={1.5} color="#cc0000" />
      <group rotation={[0, 0, t * 0.3]}>
        {Array.from({ length: blades }, (_, i) => {
          const angle = (i / blades) * Math.PI * 2;
          const r = 0.5 + openAmount * 0.3;
          const rot = angle + openAmount * 0.5;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * r * 0.3, Math.sin(angle) * r * 0.3, 0]}
              rotation={[0, 0, rot]}
            >
              <boxGeometry args={[0.85, 0.25, 0.04]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.02, 0.8, 0.15 + i * 0.01)}
                roughness={0.4}
                metalness={0.7}
              />
            </mesh>
          );
        })}
        {/* Inner glow */}
        <mesh>
          <cylinderGeometry args={[openAmount * 0.45 + 0.1, openAmount * 0.45 + 0.1, 0.02, 32]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={openAmount * 2.0} roughness={1.0} />
        </mesh>
      </group>
    </>
  );
};

const Flash: React.FC<{ t: number }> = ({ t }) => {
  const flashOn = Math.sin(t * 2) > 0.85;
  const intensity = flashOn ? 8.0 : 0.2;
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[3, 5, 4]} intensity={2.0} color="#ffe8c8" />
      <pointLight position={[0, 0, 2]} intensity={intensity} color="#ffffff" />
      <pointLight position={[-2, 1, 2]} intensity={1.0} color="#cc0000" />
      <group rotation={[Math.sin(t * 0.3) * 0.15, t * 0.2, 0]}>
        {/* Flash head */}
        <mesh>
          <boxGeometry args={[1.8, 0.6, 0.55]} />
          <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Tube */}
        <mesh position={[0, 0, 0.3]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 1.5, 16]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#aaaaff"
            emissiveIntensity={flashOn ? 3.0 : 0.1}
            roughness={0.1}
            metalness={0.0}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Reflector */}
        <mesh position={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.5, 0.3, 0.35, 32]} />
          <meshStandardMaterial color="#eeeecc" roughness={0.05} metalness={0.95} />
        </mesh>
      </group>
    </>
  );
};

const SCENES: Record<AntiqueCameraVariant, React.FC<{ t: number }>> = {
  lens: Lens,
  reel: Reel,
  aperture: Aperture,
  flash: Flash,
};

const CameraScene: React.FC<{ variant: AntiqueCameraVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const AntiqueCamera3D: React.FC<{ variant?: AntiqueCameraVariant }> = ({
  variant = 'lens',
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
    camera={{ position: [0, 0.5, 4.0], fov: 46 }}
  >
    <CameraScene variant={variant} />
  </ThreeCanvas>
);
