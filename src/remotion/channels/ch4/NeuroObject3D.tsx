import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export type NeuroVariant = 'neuron' | 'synapse' | 'cortex' | 'signal';

const Neuron: React.FC<{ t: number }> = ({ t }) => {
  const dendrites = 7;
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 6, 4]} intensity={2.5} color="#e0f8ff" />
      <pointLight position={[-3, 2, 2]} intensity={2.0} color="#00ccff" />
      <pointLight position={[2, -1, 3]} intensity={1.0} color="#0044ff" />
      <group rotation={[0, t * 0.2, 0]}>
        {/* Soma */}
        <mesh>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#00aadd" roughness={0.3} metalness={0.6} emissive="#004466" emissiveIntensity={0.4} />
        </mesh>
        {/* Dendrites */}
        {Array.from({ length: dendrites }, (_, i) => {
          const angle = (i / dendrites) * Math.PI * 2 + t * 0.3;
          const tilt = (i % 3) * 0.5;
          const len = 0.9 + (i % 3) * 0.3;
          const wave = Math.sin(t * 2 + i) * 0.15;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.65, tilt * 0.3, Math.sin(angle) * 0.65]}
              rotation={[wave, angle, tilt]}
            >
              <cylinderGeometry args={[0.04, 0.01, len, 6]} />
              <meshStandardMaterial color="#0088cc" roughness={0.4} metalness={0.5} />
            </mesh>
          );
        })}
        {/* Axon */}
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 1.5, 8]} />
          <meshStandardMaterial color="#00ccff" roughness={0.3} metalness={0.6} emissive="#003344" />
        </mesh>
      </group>
    </>
  );
};

const Synapse: React.FC<{ t: number }> = ({ t }) => {
  const pulsePos = (t * 0.8) % 1;
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 2]} intensity={3.0} color="#00ccff" />
      <pointLight position={[-2, 2, 2]} intensity={1.5} color="#0044ff" />
      <group rotation={[0, t * 0.15, 0]}>
        {/* Pre-synaptic terminal */}
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshStandardMaterial color="#00aadd" roughness={0.2} metalness={0.7} emissive="#003344" />
        </mesh>
        {/* Synaptic cleft gap */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
          <meshStandardMaterial color="#004466" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Post-synaptic terminal */}
        <mesh position={[0, -1.2, 0]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial color="#0066aa" roughness={0.3} metalness={0.6} emissive="#002233" />
        </mesh>
        {/* Neurotransmitter vesicles */}
        {[0, 1, 2, 3, 4].map((i) => {
          const ang = (i / 5) * Math.PI * 2 + t * 0.8;
          const y = 1.0 - pulsePos * 2.4 + (i * 0.15);
          return (
            <mesh key={i} position={[Math.sin(ang) * 0.18, y % 2.4 - 1.2, Math.cos(ang) * 0.18]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#00ffcc" emissive="#00aa88" emissiveIntensity={1.0} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

const Cortex: React.FC<{ t: number }> = ({ t }) => {
  const nodes = 12;
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={2.0} color="#e0f8ff" />
      <pointLight position={[-2, 2, 2]} intensity={2.0} color="#00ccff" />
      <group rotation={[0.2, t * 0.18, 0]}>
        {/* Cortex folds represented as layered spheres */}
        {[0, 1, 2].map((layer) => {
          const r = 0.7 + layer * 0.4;
          const alpha = 0.15 + layer * 0.15;
          return (
            <mesh key={layer} rotation={[layer * 0.5, layer * 0.8, 0]}>
              <sphereGeometry args={[r, 8 + layer * 4, 8 + layer * 4]} />
              <meshStandardMaterial
                color={new THREE.Color().setHSL(0.55, 0.8, 0.3 + layer * 0.1)}
                roughness={0.6}
                metalness={0.3}
                wireframe={layer > 0}
                transparent={layer > 0}
                opacity={alpha}
              />
            </mesh>
          );
        })}
        {/* Active nodes */}
        {Array.from({ length: nodes }, (_, i) => {
          const phi = Math.acos(-1 + (2 * i) / nodes);
          const theta = Math.sqrt(nodes * Math.PI) * phi + t;
          const r = 1.1;
          const active = Math.sin(t * 3 + i * 0.7) > 0.5;
          return (
            <mesh
              key={i}
              position={[
                r * Math.cos(theta) * Math.sin(phi),
                r * Math.cos(phi),
                r * Math.sin(theta) * Math.sin(phi),
              ]}
            >
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial
                color={active ? '#00ffff' : '#004466'}
                emissive={active ? '#00aaaa' : '#000000'}
                emissiveIntensity={active ? 1.5 : 0}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>
    </>
  );
};

const Signal: React.FC<{ t: number }> = ({ t }) => (
  <>
    <ambientLight intensity={0.1} />
    <pointLight position={[0, 0, 2]} intensity={3.0} color="#00ccff" />
    <pointLight position={[2, 2, 1]} intensity={1.5} color="#0044ff" />
    <group rotation={[0, t * 0.2, 0]}>
      {/* Signal wave rings */}
      {[0, 1, 2, 3].map((i) => {
        const phase = (t * 1.5 - i * 0.5) % (Math.PI * 2);
        const r = 0.4 + Math.abs(Math.sin(phase)) * 1.2;
        const opacity = Math.max(0.1, 1 - Math.abs(Math.sin(phase)) * 0.8);
        return (
          <mesh key={i} rotation={[Math.PI / 2, 0, i * 0.4]}>
            <torusGeometry args={[r, 0.05, 8, 60]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(0.55, 1, 0.5)}
              transparent
              opacity={opacity}
              emissive={new THREE.Color().setHSL(0.55, 1, 0.3)}
              emissiveIntensity={0.8}
              roughness={0.1}
            />
          </mesh>
        );
      })}
      {/* Core emitter */}
      <mesh>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00aacc" emissiveIntensity={2.0} roughness={0.2} />
      </mesh>
    </group>
  </>
);

const SCENES: Record<NeuroVariant, React.FC<{ t: number }>> = {
  neuron: Neuron,
  synapse: Synapse,
  cortex: Cortex,
  signal: Signal,
};

const NeuroScene: React.FC<{ variant: NeuroVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const Scene = SCENES[variant];
  return <Scene t={t} />;
};

export const NeuroObject3D: React.FC<{ variant?: NeuroVariant }> = ({
  variant = 'neuron',
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
    <NeuroScene variant={variant} />
  </ThreeCanvas>
);
