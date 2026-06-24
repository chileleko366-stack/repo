/**
 * NeuroObject3D — neuroscience objects for ch4 The Grey Matter beats.
 * variant='skull'    → ch4_skull.glb          (human skull)
 * variant='plant'    → ch4_plant.glb           (potted plant — growth)
 * variant='fish'     → ch4_fish.glb            (barramundi — evolution)
 * variant='spheres'  → ch4_metal_spheres.glb   (PBR spheres — neural network)
 * variant='crystal'  → ch4_crystal_dragon.glb  (glass dragon — complexity)
 * variant='vase'     → ch4_glass_vase.glb      (glass vase — fragility)
 * variant='mosquito' → ch4_mosquito_amber.glb  (amber fossil)
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

export type NeuroVariant = 'skull' | 'plant' | 'fish' | 'spheres' | 'crystal' | 'vase' | 'mosquito';

const CONFIGS: Record<NeuroVariant, {
  key: Parameters<typeof modelPath>[0];
  scale: [number, number, number];
  position: [number, number, number];
  rotX: number;
  rotY: (t: number) => number;
  camera: { position: [number, number, number]; fov: number };
}> = {
  skull: {
    key: 'ch4Skull',
    scale: [1.8, 1.8, 1.8],
    position: [0, -0.2, 0],
    rotX: 0.05,
    rotY: (t) => Math.sin(t * 0.22) * 0.4,
    camera: { position: [0, 0.3, 4.0], fov: 48 },
  },
  plant: {
    key: 'ch4Plant',
    scale: [2.0, 2.0, 2.0],
    position: [0, -0.5, 0],
    rotX: 0,
    rotY: (t) => t * 0.18,
    camera: { position: [0, 0.5, 4.5], fov: 48 },
  },
  fish: {
    key: 'ch4Fish',
    scale: [0.5, 0.5, 0.5],
    position: [0, 0, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.3) * 0.5,
    camera: { position: [0, 0, 4.5], fov: 50 },
  },
  spheres: {
    key: 'ch4MetalSpheres',
    scale: [0.28, 0.28, 0.28],
    position: [0, 0, 0],
    rotX: 0.1,
    rotY: (t) => t * 0.22,
    camera: { position: [0, 0, 4.5], fov: 50 },
  },
  crystal: {
    key: 'ch4CrystalDragon',
    scale: [1.4, 1.4, 1.4],
    position: [0, -0.3, 0],
    rotX: 0.1,
    rotY: (t) => t * 0.25,
    camera: { position: [0, 0.5, 4.5], fov: 48 },
  },
  vase: {
    key: 'ch4GlassVase',
    scale: [2.5, 2.5, 2.5],
    position: [0, -0.4, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.25) * 0.4,
    camera: { position: [0, 0.3, 4.0], fov: 46 },
  },
  mosquito: {
    key: 'ch4MosquitoAmber',
    scale: [1.2, 1.2, 1.2],
    position: [0, 0, 0],
    rotX: 0.15,
    rotY: (t) => t * 0.2,
    camera: { position: [0, 0, 4.5], fov: 48 },
  },
};

const NeuroModel: React.FC<{ variant: NeuroVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cfg = CONFIGS[variant];
  const { scene } = useGLTF(modelPath(cfg.key));

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 6, 4]} intensity={2.0} color="#ffffff" />
      <pointLight position={[-3, 2, 2]} intensity={1.4} color="#00ccff" />
      <pointLight position={[2, -1, 3]} intensity={0.8} color="#0044ff" />
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

export const NeuroObject3D: React.FC<{ variant?: NeuroVariant }> = ({
  variant = 'spheres',
}) => {
  const cfg = CONFIGS[variant];
  return (
    <ModelErrorBoundary accentColor="#e94560">
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
        <NeuroModel variant={variant} />
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};

useGLTF.preload(modelPath('ch4Skull'));
useGLTF.preload(modelPath('ch4Plant'));
useGLTF.preload(modelPath('ch4Fish'));
useGLTF.preload(modelPath('ch4MetalSpheres'));
useGLTF.preload(modelPath('ch4CrystalDragon'));
useGLTF.preload(modelPath('ch4GlassVase'));
useGLTF.preload(modelPath('ch4MosquitoAmber'));
