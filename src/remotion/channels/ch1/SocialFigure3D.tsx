/**
 * SocialFigure3D — animated human figures for ch1 social/psychology beats.
 * variant='xbot'     → ch1_xbot.glb     (robot humanoid, hook)
 * variant='michelle' → ch1_michelle.glb (animated female, context)
 * variant='kira'     → ch1_kira.glb     (detailed character, outro)
 * variant='flamingo' → ch1_flamingo.glb (morphing animal, accent)
 * variant='fox'      → ch1_fox.glb      (animated animal, accent)
 */

import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { modelPath } from '../../assets/ModelLibrary';
import type { Group } from 'three';

export type SocialFigureVariant = 'xbot' | 'michelle' | 'kira' | 'flamingo' | 'fox';

const CONFIGS: Record<SocialFigureVariant, {
  key: Parameters<typeof modelPath>[0];
  scale: [number, number, number];
  position: [number, number, number];
  camera: { position: [number, number, number]; fov: number };
  rotY: (t: number) => number;
}> = {
  xbot: {
    key: 'ch1Xbot',
    scale: [1.1, 1.1, 1.1],
    position: [0, -1.2, 0],
    camera: { position: [0, 1.2, 3.8], fov: 48 },
    rotY: (t) => Math.sin(t * 0.22) * 0.35,
  },
  michelle: {
    key: 'ch1Michelle',
    scale: [1.0, 1.0, 1.0],
    position: [0, -1.2, 0],
    camera: { position: [0, 1.2, 3.8], fov: 48 },
    rotY: (t) => t * 0.18,
  },
  kira: {
    key: 'ch1Kira',
    scale: [0.95, 0.95, 0.95],
    position: [0, -1.2, 0],
    camera: { position: [0, 1.2, 4.0], fov: 46 },
    rotY: (t) => Math.sin(t * 0.2) * 0.3,
  },
  flamingo: {
    key: 'ch1Flamingo',
    scale: [2.5, 2.5, 2.5],
    position: [0, -0.4, 0],
    camera: { position: [0, 0.6, 4.0], fov: 48 },
    rotY: (t) => t * 0.25,
  },
  fox: {
    key: 'ch1Fox',
    scale: [0.022, 0.022, 0.022],
    position: [0, -0.8, 0],
    camera: { position: [0, 0.8, 4.0], fov: 48 },
    rotY: (t) => Math.sin(t * 0.28) * 0.4,
  },
};

const FigureModel: React.FC<{ variant: SocialFigureVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cfg = CONFIGS[variant];
  const groupRef = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelPath(cfg.key));
  const { actions } = useAnimations(animations, groupRef);

  useEffect(() => {
    const firstAction = Object.values(actions)[0];
    if (!firstAction) return;
    firstAction.play();
    firstAction.paused = true;
  }, [actions]);

  useEffect(() => {
    const firstClip = animations[0];
    const firstAction = Object.values(actions)[0];
    if (!firstAction || !firstClip) return;
    firstAction.time = (t % firstClip.duration);
    firstAction.paused = true;
  }, [frame, actions, animations, t]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 6, 4]} intensity={2.0} color="#ffe8d6" />
      <pointLight position={[-3, 2, 2]} intensity={1.2} color="#ff88aa" />
      <pointLight position={[2, -1, 3]} intensity={0.6} color="#8844ff" />
      <group
        ref={groupRef}
        rotation={[0, cfg.rotY(t), 0]}
        scale={cfg.scale}
        position={cfg.position}
      >
        <primitive object={scene} />
      </group>
    </>
  );
};

export const SocialFigure3D: React.FC<{ variant?: SocialFigureVariant }> = ({
  variant = 'xbot',
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
      <FigureModel variant={variant} />
    </ThreeCanvas>
  );
};

useGLTF.preload(modelPath('ch1Xbot'));
useGLTF.preload(modelPath('ch1Michelle'));
useGLTF.preload(modelPath('ch1Kira'));
useGLTF.preload(modelPath('ch1Flamingo'));
useGLTF.preload(modelPath('ch1Fox'));
