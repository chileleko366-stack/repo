/**
 * CosmicObject3D — space/cosmic objects for ch6 Red Space Facts beats.
 * variant='ship_hallway' → ch6_ship_hallway.glb  (spacecraft corridor)
 * variant='spheres'      → ch6_metal_spheres.glb (PBR material science)
 * variant='ion_drive'    → ch6_ion_drive.glb     (sci-fi propulsion)
 * variant='crystal'      → ch6_crystal.glb        (glass dragon — wonder)
 * variant='dispersion'   → ch6_dispersion.glb    (prismatic dispersion)
 * variant='shatter'      → ch6_glass_shatter.glb (explosive reveal)
 * variant='shader_ball'  → ch6_shader_ball.glb   (PBR reference sphere)
 */

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';
import { ModelErrorBoundary } from '../../assets/ModelErrorBoundary';

export type CosmicVariant =
  | 'ship_hallway' | 'spheres' | 'ion_drive' | 'crystal' | 'dispersion' | 'shatter' | 'shader_ball';

const CONFIGS: Record<CosmicVariant, {
  key: Parameters<typeof modelPath>[0];
  scale: [number, number, number];
  position: [number, number, number];
  rotX: number;
  rotY: (t: number) => number;
  camera: { position: [number, number, number]; fov: number };
}> = {
  ship_hallway: {
    key: 'ch6ShipHallway',
    scale: [1.0, 1.0, 1.0],
    position: [0, 0, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.15) * 0.2,
    camera: { position: [0, 0, 4.5], fov: 52 },
  },
  spheres: {
    key: 'ch6MetalSpheres',
    scale: [0.28, 0.28, 0.28],
    position: [0, 0, 0],
    rotX: 0.1,
    rotY: (t) => t * 0.25,
    camera: { position: [0, 0, 4.5], fov: 50 },
  },
  ion_drive: {
    key: 'ch6IonDrive',
    scale: [1.2, 1.2, 1.2],
    position: [0, 0, 0],
    rotX: 0.1,
    rotY: (t) => t * 0.3,
    camera: { position: [0, 0.5, 4.5], fov: 48 },
  },
  crystal: {
    key: 'ch6Crystal',
    scale: [1.4, 1.4, 1.4],
    position: [0, -0.3, 0],
    rotX: 0.1,
    rotY: (t) => t * 0.28,
    camera: { position: [0, 0.5, 4.5], fov: 48 },
  },
  dispersion: {
    key: 'ch6Dispersion',
    scale: [1.4, 1.4, 1.4],
    position: [0, -0.3, 0],
    rotX: 0.1,
    rotY: (t) => Math.sin(t * 0.25) * 0.5,
    camera: { position: [0, 0.5, 4.5], fov: 48 },
  },
  shatter: {
    key: 'ch6GlassShatter',
    scale: [2.0, 2.0, 2.0],
    position: [0, 0, 0],
    rotX: 0,
    rotY: (t) => Math.sin(t * 0.2) * 0.3,
    camera: { position: [0, 0, 4.5], fov: 50 },
  },
  shader_ball: {
    key: 'ch6ShaderBall',
    scale: [2.2, 2.2, 2.2],
    position: [0, 0, 0],
    rotX: 0.2,
    rotY: (t) => t * 0.22,
    camera: { position: [0, 0, 4.0], fov: 46 },
  },
};

const CosmicModel: React.FC<{ variant: CosmicVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cfg = CONFIGS[variant];
  const { scene } = useGLTF(modelPath(cfg.key));

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[2, 5, 4]} intensity={1.8} color="#c0d0ff" />
      <pointLight position={[-3, 2, 2]} intensity={1.5} color="#ff4400" />
      <pointLight position={[3, -1, 3]} intensity={1.0} color="#0044ff" />
      <pointLight position={[0, 4, 1]} intensity={0.8} color="#00ffcc" />
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

export const CosmicObject3D: React.FC<{ variant?: CosmicVariant }> = ({
  variant = 'spheres',
}) => {
  const cfg = CONFIGS[variant];
  return (
    <ModelErrorBoundary accentColor="#ff4500">
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
        <CosmicModel variant={variant} />
      </ThreeCanvas>
    </ModelErrorBoundary>
  );
};

useGLTF.preload(modelPath('ch6ShipHallway'));
useGLTF.preload(modelPath('ch6MetalSpheres'));
useGLTF.preload(modelPath('ch6IonDrive'));
useGLTF.preload(modelPath('ch6Crystal'));
useGLTF.preload(modelPath('ch6Dispersion'));
useGLTF.preload(modelPath('ch6GlassShatter'));
useGLTF.preload(modelPath('ch6ShaderBall'));
