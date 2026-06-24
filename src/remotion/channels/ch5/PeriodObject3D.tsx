/**
 * PeriodObject3D — historical/period objects for ch5 The Quiet Record beats.
 * variant='candle'   → ch5_candle.glb      (glass hurricane candle holder)
 * variant='lantern'  → ch5_lantern.glb     (old wooden street lantern)
 * variant='soldier'  → ch5_soldier.glb     (military historical figure)
 * variant='boombox'  → ch5_boombox.glb     (retro boombox cultural artifact)
 * variant='truck'    → ch5_milk_truck.glb  (animated vintage milk truck)
 * variant='mask'     → ch5_venice_mask.glb (Venetian carnival mask)
 * variant='corset'   → ch5_corset.glb      (period fabric corset)
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

export type PeriodVariant = 'candle' | 'lantern' | 'soldier' | 'boombox' | 'truck' | 'mask' | 'corset';

const CONFIGS: Record<PeriodVariant, {
  key: Parameters<typeof modelPath>[0];
  scale: [number, number, number];
  position: [number, number, number];
  rotX: number;
  rotY: (t: number) => number;
  camera: { position: [number, number, number]; fov: number };
}> = {
  candle: {
    key: 'ch5Candle',
    scale: [2.2, 2.2, 2.2],
    position: [0, -0.3, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.22) * 0.3,
    camera: { position: [0, 0.4, 4.0], fov: 46 },
  },
  lantern: {
    key: 'ch5Lantern',
    scale: [0.6, 0.6, 0.6],
    position: [0, 0, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.28) * 0.35,
    camera: { position: [0, 0.3, 4.0], fov: 48 },
  },
  soldier: {
    key: 'ch5Soldier',
    scale: [1.0, 1.0, 1.0],
    position: [0, -1.2, 0],
    rotX: 0,
    rotY: (t) => t * 0.15,
    camera: { position: [0, 1.0, 4.0], fov: 48 },
  },
  boombox: {
    key: 'ch5Boombox',
    scale: [0.012, 0.012, 0.012],
    position: [0, -0.2, 0],
    rotX: 0.1,
    rotY: (t) => Math.sin(t * 0.25) * 0.4,
    camera: { position: [0, 0.2, 4.0], fov: 48 },
  },
  truck: {
    key: 'ch5MilkTruck',
    scale: [1.2, 1.2, 1.2],
    position: [0, -0.3, 0],
    rotX: 0.05,
    rotY: (t) => t * 0.2,
    camera: { position: [0, 0.5, 4.5], fov: 50 },
  },
  mask: {
    key: 'ch5VeniceMask',
    scale: [2.2, 2.2, 2.2],
    position: [0, -0.2, 0],
    rotX: 0.05,
    rotY: (t) => Math.sin(t * 0.3) * 0.4,
    camera: { position: [0, 0.2, 4.0], fov: 46 },
  },
  corset: {
    key: 'ch5Corset',
    scale: [0.9, 0.9, 0.9],
    position: [0, -0.4, 0],
    rotX: 0,
    rotY: (t) => t * 0.18,
    camera: { position: [0, 0.5, 4.5], fov: 48 },
  },
};

const PeriodModel: React.FC<{ variant: PeriodVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cfg = CONFIGS[variant];
  const { scene } = useGLTF(modelPath(cfg.key));

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 6, 4]} intensity={2.2} color="#ffe8c0" />
      <pointLight position={[-3, 2, 2]} intensity={1.3} color="#c8a040" />
      <pointLight position={[3, -1, 3]} intensity={0.7} color="#8b5a14" />
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

export const PeriodObject3D: React.FC<{ variant?: PeriodVariant }> = ({
  variant = 'lantern',
}) => {
  const cfg = CONFIGS[variant];
  return (
    <ModelErrorBoundary accentColor="#c8a96e">
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
        <PeriodModel variant={variant} />
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};

useGLTF.preload(modelPath('ch5Candle'));
useGLTF.preload(modelPath('ch5Lantern'));
useGLTF.preload(modelPath('ch5Soldier'));
useGLTF.preload(modelPath('ch5Boombox'));
useGLTF.preload(modelPath('ch5MilkTruck'));
useGLTF.preload(modelPath('ch5VeniceMask'));
useGLTF.preload(modelPath('ch5Corset'));
