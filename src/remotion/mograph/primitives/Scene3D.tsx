// Ported from:
// /tmp/refs/saas-engine/src/skills/3d.md
// Provides: ThreeCanvas wrapper with correct lighting + frame-based rotation + spring entrance.
// Used by ch4 (brain) and ch6 (space) only — no useFrame(), no real-time APIs.

import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { SPRING_CONFIGS } from './SpringConfigs';

interface Scene3DProps {
  children: React.ReactNode;
  /** Camera distance from origin */
  cameraZ?: number;
  /** Field of view in degrees */
  fov?: number;
  /** Ambient light intensity (0-1) */
  ambientIntensity?: number;
  /** Point light position */
  lightPosition?: [number, number, number];
  /** Point light intensity */
  lightIntensity?: number;
  /** Frames for spring entrance (default 24) */
  entranceDuration?: number;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  children,
  cameraZ = 5,
  fov = 75,
  ambientIntensity = 0.5,
  lightPosition = [10, 10, 10],
  lightIntensity = 0.8,
  entranceDuration = 24,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring entrance — scale 0→1 on first entranceDuration frames
  const entryProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIGS.bouncy,
    durationInFrames: entranceDuration,
  });
  const scale = interpolate(entryProgress, [0, 1], [0.4, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <ThreeCanvas
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0 }}
      camera={{ position: [0, 0, cameraZ], fov }}
    >
      {/* Every 3D scene needs ambient + directional light for depth — from 3d.md */}
      <ambientLight intensity={ambientIntensity} />
      <pointLight position={lightPosition as [number, number, number]} intensity={lightIntensity} />
      <group scale={[scale, scale, scale]}>
        {children}
      </group>
    </ThreeCanvas>
  );
};

/** Continuous Y-axis rotation purely from frame — no useFrame() */
export function frameRotation(frame: number, speed = 0.02): THREE.Euler {
  return new THREE.Euler(0, frame * speed, 0);
}

/** Floating bob on Y axis using sine wave from frame */
export function frameBob(frame: number, amplitude = 0.3, speed = 0.1): number {
  return Math.sin(frame * speed) * amplitude;
}
