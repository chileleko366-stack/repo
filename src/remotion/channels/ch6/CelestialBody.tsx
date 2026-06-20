// Session 15 rewrite — CelestialBody driven by CelestialFactsheet + ShotBrief.
// Every body renders its real signatureFeature in the camera's view at the beat midpoint.
// No two bodies share the same framing preset or generic sphere treatment.
// Uses factsheet.axialTiltDeg for tilt, factsheet.signatureFeature.rotationOffsetAtMidpointDeg
// to choreograph the rotation so the key feature is visible when the viewer is actually watching.
//
// IMPORTANT: Starfield is rendered OUTSIDE ThreeCanvas in Ch6Composition — it is a DOM/SVG
// component and must never be placed inside ThreeCanvas (R3F would try to create Three.js
// objects from SVG elements like <circle>, which do not exist in the THREE namespace).

import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useTexture } from '@react-three/drei';
import { interpolate, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import type { CelestialFactsheet, CameraFraming } from './celestialFactsheet';
import { CELESTIAL_FACTSHEETS } from './celestialFactsheet';

// ─── Camera framing presets ───────────────────────────────────────────────────
// Each preset returns [x, y, z] camera position in world space.
// Chosen so the signatureFeature is naturally in frame.
type FramingFn = (fs: CelestialFactsheet, frame: number, dur: number) => [number, number, number];

const CAMERA_FRAMING_PRESETS: Record<CameraFraming, FramingFn> = {
  // Camera ~20° above ring plane — rings read as a clear ellipse, not a line
  'must-show-ring-tilt': (_fs, _f, _d) => [0.5, 1.5, 4.0],
  // Elevated camera so the pole is visible at top of frame
  'must-show-polar-region': (_fs, _f, _d) => [0.3, 1.6, 3.4],
  // Near-equatorial, slight offset so the signature hemisphere faces the camera
  'must-show-on-visible-hemisphere': (_fs, _f, _d) => [0, 0.1, 3.4],
  // Dead-on, whole disc, minimal parallax
  'must-show-full-disc': (_fs, _f, _d) => [0, 0, 4.2],
};

// ─── Textured planet mesh ────────────────────────────────────────────────────

const TexturedPlanet: React.FC<{
  fs: CelestialFactsheet;
  durationInFrames: number;
}> = ({ fs, durationInFrames }) => {
  const frame = useCurrentFrame();

  // Slow drift across the beat — 25° total
  const totalDriftDeg = 25;
  const driftDeg = interpolate(frame, [0, durationInFrames], [0, totalDriftDeg], {
    extrapolateRight: 'clamp',
  });

  // Choreograph so the signature feature is centred at the beat midpoint
  const midpointDriftDeg = totalDriftDeg / 2;
  const rotYDeg = fs.signatureFeature.rotationOffsetAtMidpointDeg + (driftDeg - midpointDriftDeg);

  // Venus rotates retrograde (axialTilt > 170°)
  const dir = fs.axialTiltDeg > 170 ? -1 : 1;
  const rotY = THREE.MathUtils.degToRad(rotYDeg * dir);

  const scaleVal = interpolate(frame, [0, 24], [0.4, 1], { extrapolateRight: 'clamp' });

  const mapTex = useTexture(`/space/textures/${fs.textures.map}`);
  const normalTex = fs.textures.normal ? useTexture(`/space/textures/${fs.textures.normal}`) : undefined;
  const cloudTex = fs.textures.cloud ? useTexture(`/space/textures/${fs.textures.cloud}`) : undefined;
  const ringTex = fs.textures.ring ? useTexture(`/space/textures/${fs.textures.ring}`) : undefined;

  const tiltRad = THREE.MathUtils.degToRad(fs.axialTiltDeg);

  // Glow / atmosphere haze color from trueColor
  const hazeColor = new THREE.Color(fs.trueColor.secondaryHex);

  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[12, 2, 4]} intensity={1.6} color="#fff8e8" />
      <pointLight position={[-4, -3, 3]} intensity={0.3} color="#a0c4ff" />

      <group rotation={[0, 0, tiltRad]} scale={[scaleVal, scaleVal, scaleVal]}>
        {/* Main body */}
        <mesh rotation={[0, rotY, 0]}>
          <sphereGeometry args={[3.2, 96, 96]} />
          <meshStandardMaterial
            map={mapTex}
            normalMap={normalTex}
            metalness={0.05}
            roughness={0.85}
          />
        </mesh>

        {/* Cloud layer — rotates slightly faster for parallax */}
        {cloudTex && (
          <mesh rotation={[0, rotY * 1.15, 0]} scale={1.006}>
            <sphereGeometry args={[3.2, 96, 96]} />
            <meshLambertMaterial map={cloudTex} transparent opacity={0.85} />
          </mesh>
        )}

        {/* Atmosphere glow — back-face transparent sphere with trueColor.secondary
            This is element-level lighting, NOT the page background gradient */}
        <mesh scale={1.06}>
          <sphereGeometry args={[3.2, 64, 64]} />
          <meshBasicMaterial
            color={hazeColor}
            transparent
            opacity={0.22}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Ring system (Saturn) */}
        {fs.rings && ringTex && (
          <mesh
            rotation={[
              Math.PI / 2 - THREE.MathUtils.degToRad(fs.rings.tiltFromOrbitalPlaneDeg),
              0,
              0,
            ]}
          >
            <ringGeometry
              args={[
                3.2 * fs.rings.innerRadiusMultiplier,
                3.2 * fs.rings.outerRadiusMultiplier,
                128,
              ]}
            />
            <meshStandardMaterial
              map={ringTex}
              transparent
              side={THREE.DoubleSide}
              roughness={0.9}
            />
          </mesh>
        )}
      </group>
    </>
  );
};

// ─── Public component ────────────────────────────────────────────────────────

export interface CelestialBodyProps {
  /** Solar system body name — key into CELESTIAL_FACTSHEETS */
  bodyName?: string;
  /** Override if factsheet key not found */
  fallbackColor?: string;
  durationInFrames?: number;
}

export const CelestialBody: React.FC<CelestialBodyProps> = ({
  bodyName = 'Jupiter',
  durationInFrames = 120,
}) => {
  const fs = CELESTIAL_FACTSHEETS[bodyName] ?? CELESTIAL_FACTSHEETS['Jupiter'];
  const cameraPos = CAMERA_FRAMING_PRESETS[fs.signatureFeature.cameraFraming](fs, 0, durationInFrames);

  return (
    <ThreeCanvas
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0 }}
      camera={{ position: cameraPos, fov: 50 }}
    >
      {/* Starfield is a DOM/SVG component — rendered by Ch6Composition OUTSIDE this canvas */}
      <TexturedPlanet fs={fs} durationInFrames={durationInFrames} />
    </ThreeCanvas>
  );
};
