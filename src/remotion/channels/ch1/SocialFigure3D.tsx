import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export type SocialFigureVariant = 'figure' | 'crowd' | 'mirror' | 'shadow';

const Figure: React.FC<{ t: number }> = ({ t }) => {
  const sway = Math.sin(t * 1.2) * 0.12;
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={2.5} color="#ffe8d6" />
      <pointLight position={[-3, 2, 2]} intensity={1.5} color="#ff88aa" />
      <pointLight position={[2, -1, 3]} intensity={0.8} color="#8844ff" />
      <group rotation={[0, sway, 0]}>
        {/* Head */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color="#e8c4a0" roughness={0.6} metalness={0.05} />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.28, 0.32, 1.0, 16]} />
          <meshStandardMaterial color="#d400ff" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-0.45, 0.55, 0]} rotation={[0, 0, Math.PI / 6 + Math.sin(t * 1.5) * 0.15]}>
          <cylinderGeometry args={[0.1, 0.08, 0.8, 8]} />
          <meshStandardMaterial color="#d400ff" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.45, 0.55, 0]} rotation={[0, 0, -Math.PI / 6 - Math.sin(t * 1.5) * 0.15]}>
          <cylinderGeometry args={[0.1, 0.08, 0.8, 8]} />
          <meshStandardMaterial color="#d400ff" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Left leg */}
        <mesh position={[-0.2, -0.45, 0]} rotation={[Math.sin(t * 1.8) * 0.2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#333344" roughness={0.8} metalness={0.1} />
        </mesh>
        {/* Right leg */}
        <mesh position={[0.2, -0.45, 0]} rotation={[-Math.sin(t * 1.8) * 0.2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#333344" roughness={0.8} metalness={0.1} />
        </mesh>
      </group>
    </>
  );
};

const Crowd: React.FC<{ t: number }> = ({ t }) => {
  const positions: [number, number, number][] = [
    [0, 0, 0], [-0.9, 0, -0.4], [0.9, 0, -0.4],
    [-0.45, 0, -0.8], [0.45, 0, -0.8], [0, 0, -1.2],
  ];
  const colors = ['#d400ff', '#aa00dd', '#ee22ff', '#bb00ee', '#cc11ff', '#9900cc'];
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 4]} intensity={2.0} color="#ffe8d6" />
      <pointLight position={[-3, 3, 3]} intensity={2.0} color="#ff44aa" />
      {positions.map(([x, y, z], i) => {
        const scale = 0.7 + i * 0.05;
        const sway = Math.sin(t * (1.0 + i * 0.2) + i) * 0.08;
        return (
          <group key={i} position={[x, y, z]} rotation={[0, sway, 0]} scale={[scale, scale, scale]}>
            <mesh position={[0, 0.95, 0]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#e8c4a0" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.16, 0.18, 0.6, 8]} />
              <meshStandardMaterial color={colors[i]} roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[-0.12, -0.2, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.5, 6]} />
              <meshStandardMaterial color="#222233" roughness={0.8} />
            </mesh>
            <mesh position={[0.12, -0.2, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.5, 6]} />
              <meshStandardMaterial color="#222233" roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

const Mirror: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[3, 5, 4]} intensity={2.0} color="#ffffff" />
    <pointLight position={[-2, 2, 3]} intensity={1.5} color="#d400ff" />
    <pointLight position={[2, -1, 3]} intensity={1.2} color="#00f0ff" />
    <group rotation={[0, Math.sin(t * 0.4) * 0.4, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.5, 3]} />
        <meshStandardMaterial color="#ccbbff" roughness={0.05} metalness={0.95} />
      </mesh>
    </group>
    <group rotation={[Math.PI, Math.sin(t * 0.4) * 0.4 + Math.PI, 0]}>
      <mesh position={[0, -3.2, 0]}>
        <icosahedronGeometry args={[1.5, 3]} />
        <meshStandardMaterial color="#bbaaee" roughness={0.1} metalness={0.85} />
      </mesh>
    </group>
  </>
);

const Shadow: React.FC<{ t: number }> = ({ t }) => {
  const progress = interpolate(t % 4, [0, 2, 4], [0, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scale = 0.6 + progress * 0.6;
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[2, 5, 3]} intensity={1.5} color="#8844ff" />
      <pointLight position={[-2, 2, 2]} intensity={2.0} color="#440088" />
      <mesh rotation={[0, t * 0.3, 0]} scale={[scale, scale, scale]}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshStandardMaterial color="#110022" roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, t * 0.5, 0]}>
        <torusGeometry args={[2.0, 0.08, 8, 60]} />
        <meshStandardMaterial color="#9900ff" roughness={0.2} metalness={0.6} emissive="#440055" />
      </mesh>
    </>
  );
};

const SCENES: Record<SocialFigureVariant, React.FC<{ t: number }>> = {
  figure: Figure,
  crowd: Crowd,
  mirror: Mirror,
  shadow: Shadow,
};

const SocialScene: React.FC<{ variant: SocialFigureVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const SocialFigure3D: React.FC<{ variant?: SocialFigureVariant }> = ({
  variant = 'figure',
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
    camera={{ position: [0, 0.5, 4.5], fov: 48 }}
  >
    <SocialScene variant={variant} />
  </ThreeCanvas>
);
