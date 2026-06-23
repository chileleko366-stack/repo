/**
 * ClassifiedObject3D — noir/mystery objects for ch3 Redacted beats.
 * variant='steampunk_cam' → ch3_steampunk_cam.glb (ornate steampunk camera)
 * variant='skull'         → ch3_skull.glb         (human skull)
 * variant='lantern'       → ch3_lantern.glb        (old wooden lantern)
 * variant='soldier'       → ch3_soldier.glb        (military figure)
 * variant='broken_window' → ch3_broken_window.glb  (shattered glass)
 * variant='coals'         → ch3_coals.glb          (glowing coals)
 * variant='bust'          → ch3_bust.glb           (historical bust)
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';

export type ClassifiedVariant =
  | 'steampunk_cam' | 'skull' | 'lantern' | 'soldier' | 'broken_window' | 'coals' | 'bust';

const CONFIGS: Record<ClassifiedVariant, {
  key: Parameters<typeof modelPath>[0];
  scale: [number, number, number];
  position: [number, number, number];
  rotX: number;
  rotY: (t: number) => number;
  mode: 'oscillate' | 'spin';
  camera: { position: [number, number, number]; fov: number };
}> = {
  steampunk_cam: {
    key: 'ch3SteampunkCam',
    scale: [1.0, 1.0, 1.0],
    position: [0, -0.2, 0],
    rotX: 0.1,
    rotY: (t) => Math.sin(t * 0.28) * 0.45,
    mode: 'oscillate',
    camera: { position: [0, 0.5, 4.0], fov: 46 },
  },
  skull: {
    key: 'ch3Skull',
    scale: [1.8, 1.8, 1.8],
    position: [0, -0.2, 0],
    rotX: 0.05,
    rotY: (t) => Math.sin(t * 0.22) * 0.4,
    mode: 'oscillate',
    camera: { position: [0, 0.3, 4.0], fov: 48 },
  },
  lantern: {
    key: 'ch3Lantern',
    scale: [0.6, 0.6, 0.6],
    position: [0, 0, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.3) * 0.3,
    mode: 'oscillate',
    camera: { position: [0, 0.3, 4.0], fov: 48 },
  },
  soldier: {
    key: 'ch3Soldier',
    scale: [1.0, 1.0, 1.0],
    position: [0, -1.2, 0],
    rotX: 0,
    rotY: (t) => t * 0.15,
    mode: 'spin',
    camera: { position: [0, 1.0, 4.0], fov: 48 },
  },
  broken_window: {
    key: 'ch3BrokenWindow',
    scale: [2.0, 2.0, 2.0],
    position: [0, 0, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.18) * 0.25,
    mode: 'oscillate',
    camera: { position: [0, 0, 4.5], fov: 50 },
  },
  coals: {
    key: 'ch3Coals',
    scale: [1.2, 1.2, 1.2],
    position: [0, -0.3, 0],
    rotX: 0.3,
    rotY: (t) => t * 0.2,
    mode: 'spin',
    camera: { position: [0, 0.5, 4.0], fov: 50 },
  },
  bust: {
    key: 'ch3Bust',
    scale: [1.0, 1.0, 1.0],
    position: [0, -0.3, 0],
    rotX: 0.05,
    rotY: (t) => Math.sin(t * 0.2) * 0.35,
    mode: 'oscillate',
    camera: { position: [0, 0.2, 4.0], fov: 46 },
  },
};

const ClassifiedModel: React.FC<{ variant: ClassifiedVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cfg = CONFIGS[variant];
  const { scene } = useGLTF(modelPath(cfg.key));

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[2, 5, 3]} intensity={1.8} color="#ffe0c0" />
      <pointLight position={[-3, 1, 2]} intensity={1.2} color="#cc0000" />
      <pointLight position={[2, -2, 2]} intensity={0.6} color="#ff6600" />
      <group
        rotation={[cfg.rotX, cfg.rotY(t), 0]}
        scale={cfg.scale}
        position={cfg.position}
      >
        <primitive object={scene} />
      </group>
    </>
  );
};

export const ClassifiedObject3D: React.FC<{ variant?: ClassifiedVariant }> = ({
  variant = 'steampunk_cam',
}) => {
  const cfg = CONFIGS[variant];
  return (
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
      camera={{ position: cfg.camera.position, fov: cfg.camera.fov }}
    >
      <ClassifiedModel variant={variant} />
    </ThreeCanvas>
  );
};

useGLTF.preload(modelPath('ch3SteampunkCam'));
useGLTF.preload(modelPath('ch3Skull'));
useGLTF.preload(modelPath('ch3Lantern'));
useGLTF.preload(modelPath('ch3Soldier'));
useGLTF.preload(modelPath('ch3BrokenWindow'));
useGLTF.preload(modelPath('ch3Coals'));
useGLTF.preload(modelPath('ch3Bust'));
