/**
 * LuxuryObject3D — rotating luxury objects for ch2 FinanceFiction beats.
 * variant='watch'    → ch2_watch.glb       (chronograph wristwatch)
 * variant='rolex'    → ch2_rolex.glb       (luxury watch)
 * variant='shoe'     → ch2_shoe.glb        (designer shoe)
 * variant='city'     → ch2_virtual_city.glb (urban scale model)
 * variant='gears'    → ch2_gears.glb       (mechanical gears)
 * variant='bike'     → ch2_carbon_bike.glb  (carbon racing bike)
 * variant='toycar'   → ch2_toy_car.glb     (vibrant toy car)
 * variant='sunglasses'→ ch2_sunglasses.glb (designer sunglasses)
 * variant='tokyo'    → ch2_tokyo.glb       (miniature Tokyo)
 * variant='concept'  → ch2_car_concept.glb (concept car)
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';

export type LuxuryVariant =
  | 'watch' | 'rolex' | 'shoe' | 'city' | 'gears'
  | 'bike' | 'toycar' | 'sunglasses' | 'tokyo' | 'concept';

const CONFIGS: Record<LuxuryVariant, {
  key: Parameters<typeof modelPath>[0];
  scale: [number, number, number];
  position: [number, number, number];
  rotBase: [number, number, number];
  rotY: (t: number) => number;
  camera: { position: [number, number, number]; fov: number };
}> = {
  watch: {
    key: 'ch2Watch',
    scale: [18, 18, 18],
    position: [0, 0, 0],
    rotBase: [0.2, 0, 0],
    rotY: (t) => t * 0.28,
    camera: { position: [0, 0.5, 4.5], fov: 46 },
  },
  rolex: {
    key: 'ch2Rolex',
    scale: [0.8, 0.8, 0.8],
    position: [0, 0, 0],
    rotBase: [0.15, 0, 0],
    rotY: (t) => Math.sin(t * 0.25) * 0.5,
    camera: { position: [0, 0.5, 4.0], fov: 46 },
  },
  shoe: {
    key: 'ch2Shoe',
    scale: [3.2, 3.2, 3.2],
    position: [0, -0.3, 0],
    rotBase: [0.1, 0, 0],
    rotY: (t) => t * 0.22,
    camera: { position: [0, 0.4, 4.2], fov: 48 },
  },
  city: {
    key: 'ch2VirtualCity',
    scale: [0.012, 0.012, 0.012],
    position: [0, -0.5, 0],
    rotBase: [0.3, 0, 0],
    rotY: (t) => t * 0.15,
    camera: { position: [0, 1.0, 4.5], fov: 52 },
  },
  gears: {
    key: 'ch2Gears',
    scale: [1.8, 1.8, 1.8],
    position: [0, 0, 0],
    rotBase: [0, 0, 0],
    rotY: (t) => t * 0.4,
    camera: { position: [0, 0, 4.0], fov: 48 },
  },
  bike: {
    key: 'ch2CarbonBike',
    scale: [1.4, 1.4, 1.4],
    position: [0, -0.3, 0],
    rotBase: [0, 0, 0],
    rotY: (t) => Math.sin(t * 0.2) * 0.45,
    camera: { position: [0, 0.8, 5.0], fov: 50 },
  },
  toycar: {
    key: 'ch2ToyCar',
    scale: [7.0, 7.0, 7.0],
    position: [0, -0.3, 0],
    rotBase: [0.05, 0, 0],
    rotY: (t) => t * 0.3,
    camera: { position: [0, 0.8, 4.5], fov: 50 },
  },
  sunglasses: {
    key: 'ch2Sunglasses',
    scale: [8.0, 8.0, 8.0],
    position: [0, 0, 0],
    rotBase: [0.1, 0, 0],
    rotY: (t) => Math.sin(t * 0.3) * 0.5,
    camera: { position: [0, 0.2, 4.0], fov: 46 },
  },
  tokyo: {
    key: 'ch2Tokyo',
    scale: [0.018, 0.018, 0.018],
    position: [0, -0.5, 0],
    rotBase: [0.2, 0, 0],
    rotY: (t) => t * 0.12,
    camera: { position: [0, 1.0, 4.5], fov: 52 },
  },
  concept: {
    key: 'ch2CarConcept',
    scale: [1.2, 1.2, 1.2],
    position: [0, -0.3, 0],
    rotBase: [0.05, 0, 0],
    rotY: (t) => t * 0.2,
    camera: { position: [0, 0.8, 5.0], fov: 50 },
  },
};

const LuxuryModel: React.FC<{ variant: LuxuryVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cfg = CONFIGS[variant];
  const { scene } = useGLTF(modelPath(cfg.key));

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 4]} intensity={3.0} color="#ffffff" />
      <pointLight position={[-4, 2, 3]} intensity={1.5} color="#00ff88" />
      <pointLight position={[3, -1, 3]} intensity={1.0} color="#00f0ff" />
      <spotLight position={[0, 8, 2]} angle={0.5} penumbra={0.4} intensity={2.0} color="#ffffff" />
      <group
        rotation={[cfg.rotBase[0], cfg.rotBase[1] + cfg.rotY(t), cfg.rotBase[2]]}
        scale={cfg.scale}
        position={cfg.position}
      >
        <primitive object={scene} />
      </group>
    </>
  );
};

export const LuxuryObject3D: React.FC<{ variant?: LuxuryVariant }> = ({
  variant = 'watch',
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
      <LuxuryModel variant={variant} />
    </ThreeCanvas>
  );
};

useGLTF.preload(modelPath('ch2Watch'));
useGLTF.preload(modelPath('ch2Rolex'));
useGLTF.preload(modelPath('ch2Shoe'));
useGLTF.preload(modelPath('ch2VirtualCity'));
useGLTF.preload(modelPath('ch2Gears'));
useGLTF.preload(modelPath('ch2CarbonBike'));
useGLTF.preload(modelPath('ch2ToyCar'));
useGLTF.preload(modelPath('ch2Sunglasses'));
useGLTF.preload(modelPath('ch2Tokyo'));
useGLTF.preload(modelPath('ch2CarConcept'));
