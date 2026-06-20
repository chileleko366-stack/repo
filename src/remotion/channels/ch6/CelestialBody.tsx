// Session 15 rewrite — CelestialBody driven by CelestialFactsheet + ShotBrief.
// Every body renders its real signatureFeature in the camera's view at the beat midpoint.
// No two bodies share the same framing preset or generic sphere treatment.
// Uses factsheet.axialTiltDeg for tilt, factsheet.signatureFeature.rotationOffsetAtMidpointDeg
// to choreograph the rotation so the key feature is visible when the viewer is actually watching.
//
// Procedural materials only — no network texture loading. Bodies are distinguished by
// trueColor.primaryHex (surface), trueColor.secondaryHex (atmosphere glow), unique
// camera framing presets, and ring geometry for Saturn.
//
// IMPORTANT: Starfield is rendered OUTSIDE ThreeCanvas in Ch6Composition — it is a DOM/SVG
// component and must never be placed inside ThreeCanvas (R3F would try to create Three.js
// objects from SVG elements like <circle>, which do not exist in the THREE namespace).

import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import type { CelestialFactsheet, CameraFraming } from './celestialFactsheet';
import { CELESTIAL_FACTSHEETS } from './celestialFactsheet';

// ─── Camera framing presets ───────────────────────────────────────────────────
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

// ─── Band stripe helper (Jupiter / Saturn) ───────────────────────────────────
// Creates a canvas texture with horizontal bands matching the body's color palette.
function makeBandTexture(primaryHex: string, secondaryHex: string, bandCount: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const primary = new THREE.Color(primaryHex);
  const secondary = new THREE.Color(secondaryHex);

  const bandHeight = size / bandCount;
  for (let i = 0; i < bandCount; i++) {
    // Alternate primary / secondary with slight brightness variation
    const t = (i % 2 === 0) ? 1.0 : 0.0;
    const r = Math.round((primary.r * t + secondary.r * (1 - t)) * 255);
    const g = Math.round((primary.g * t + secondary.g * (1 - t)) * 255);
    const b = Math.round((primary.b * t + secondary.b * (1 - t)) * 255);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, Math.round(i * bandHeight), size, Math.ceil(bandHeight) + 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// ─── Procedural planet mesh ──────────────────────────────────────────────────

const ProceduralPlanet: React.FC<{
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

  const scaleVal = interpolate(frame, [0, 48], [0.4, 1], { extrapolateRight: 'clamp' });

  const tiltRad = THREE.MathUtils.degToRad(fs.axialTiltDeg);

  const primaryColor = new THREE.Color(fs.trueColor.primaryHex);
  const hazeColor = new THREE.Color(fs.trueColor.secondaryHex);

  // Bodies with banded structure get a canvas band texture; others use flat color.
  const bandTexture = React.useMemo(() => {
    if (!fs.atmosphere.bandedStructure) return null;
    const count = fs.body === 'Jupiter' ? 14 : 8;
    return makeBandTexture(fs.trueColor.primaryHex, fs.trueColor.secondaryHex, count);
  }, [fs]);

  // Sun emits light rather than reflecting it
  const isSun = fs.body === 'Sun';

  // Ring color — slightly darker than primary with some translucency
  const ringColor = new THREE.Color(fs.trueColor.primaryHex).multiplyScalar(0.85);

  return (
    <>
      <ambientLight intensity={isSun ? 1.2 : 0.08} />
      {/* Main key light — off-axis to show terminator on sphere */}
      <pointLight position={[12, 2, 4]} intensity={isSun ? 0 : 1.6} color="#fff8e8" />
      <pointLight position={[-4, -3, 3]} intensity={isSun ? 0 : 0.3} color="#a0c4ff" />
      {/* Sun self-illumination */}
      {isSun && <pointLight position={[0, 0, 0]} intensity={2.0} color="#fff4d6" />}

      <group rotation={[0, 0, tiltRad]} scale={[scaleVal, scaleVal, scaleVal]}>
        {/* Main body */}
        <mesh rotation={[0, rotY, 0]}>
          <sphereGeometry args={[3.2, 96, 96]} />
          {isSun ? (
            <meshBasicMaterial color={primaryColor} />
          ) : (
            <meshStandardMaterial
              map={bandTexture ?? undefined}
              color={bandTexture ? undefined : primaryColor}
              metalness={0.05}
              roughness={0.85}
            />
          )}
        </mesh>

        {/* Cloud / atmosphere layer for Venus, Earth, Jupiter, Saturn, Uranus, Neptune */}
        {fs.atmosphere.hasClouds && !isSun && (
          <mesh rotation={[0, rotY * 1.12, 0]} scale={1.006}>
            <sphereGeometry args={[3.2, 64, 64]} />
            <meshLambertMaterial
              color={hazeColor}
              transparent
              opacity={fs.atmosphere.bandedStructure ? 0.15 : 0.35}
            />
          </mesh>
        )}

        {/* Atmosphere glow — back-face transparent sphere.
            This is element-level lighting only, NOT the page background gradient. */}
        <mesh scale={1.06}>
          <sphereGeometry args={[3.2, 64, 64]} />
          <meshBasicMaterial
            color={hazeColor}
            transparent
            opacity={isSun ? 0.45 : 0.22}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Ring system (Saturn) — procedural, no texture */}
        {fs.rings && (
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
            <meshBasicMaterial
              color={ringColor}
              transparent
              opacity={0.72}
              side={THREE.DoubleSide}
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
      <ProceduralPlanet fs={fs} durationInFrames={durationInFrames} />
    </ThreeCanvas>
  );
};
