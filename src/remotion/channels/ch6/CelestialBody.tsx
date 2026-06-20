// CelestialBody — loads committed textures from public/space/textures/ via staticFile().
// Falls back to ProceduralPlanet (canvas band textures) if a texture file fails to load,
// logging a console warning so the missing file can be identified and replaced.
//
// Texture files live in public/space/textures/ and are committed to the repo.
// Earth and Moon use real NASA-derived textures; other bodies use solid-colour placeholders
// that match factsheet.trueColor until real textures are procured.
//
// IMPORTANT: Starfield is rendered OUTSIDE ThreeCanvas in Ch6Composition — it is a DOM/SVG
// component and must never be placed inside ThreeCanvas (R3F would try to create Three.js
// objects from SVG elements like <circle>, which do not exist in the THREE namespace).

import React from 'react';
import { useTexture } from '@react-three/drei';
import { ThreeCanvas } from '@remotion/three';
import { interpolate, staticFile, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import type { CelestialFactsheet, CameraFraming } from './celestialFactsheet';
import { CELESTIAL_FACTSHEETS } from './celestialFactsheet';

// ─── Camera framing presets ───────────────────────────────────────────────────
type FramingFn = (fs: CelestialFactsheet, frame: number, dur: number) => [number, number, number];

const CAMERA_FRAMING_PRESETS: Record<CameraFraming, FramingFn> = {
  'must-show-ring-tilt':              (_fs, _f, _d) => [0.5, 1.5, 4.0],
  'must-show-polar-region':           (_fs, _f, _d) => [0.3, 1.6, 3.4],
  'must-show-on-visible-hemisphere':  (_fs, _f, _d) => [0, 0.1, 3.4],
  'must-show-full-disc':              (_fs, _f, _d) => [0, 0, 4.2],
};

// ─── Band stripe fallback helper ─────────────────────────────────────────────
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

// ─── Shared rotation / scale helpers ─────────────────────────────────────────
function usePlanetTransform(fs: CelestialFactsheet, durationInFrames: number) {
  const frame = useCurrentFrame();
  const totalDriftDeg = 25;
  const driftDeg = interpolate(frame, [0, durationInFrames], [0, totalDriftDeg], {
    extrapolateRight: 'clamp',
  });
  const rotYDeg = fs.signatureFeature.rotationOffsetAtMidpointDeg + (driftDeg - totalDriftDeg / 2);
  const dir = fs.axialTiltDeg > 170 ? -1 : 1;
  const rotY = THREE.MathUtils.degToRad(rotYDeg * dir);
  const scaleVal = interpolate(frame, [0, 24], [0.4, 1], { extrapolateRight: 'clamp' });
  const tiltRad = THREE.MathUtils.degToRad(fs.axialTiltDeg);
  return { rotY, scaleVal, tiltRad };
}

// ─── Scene lights ─────────────────────────────────────────────────────────────
const PlanetLights: React.FC<{ isSun: boolean }> = ({ isSun }) => (
  <>
    <ambientLight intensity={isSun ? 1.2 : 0.08} />
    <pointLight position={[12, 2, 4]}  intensity={isSun ? 0 : 1.6} color="#fff8e8" />
    <pointLight position={[-4, -3, 3]} intensity={isSun ? 0 : 0.3} color="#a0c4ff" />
    {isSun && <pointLight position={[0, 0, 0]} intensity={2.0} color="#fff4d6" />}
  </>
);

// ─── Textured planet — uses committed files from public/space/textures/ ───────
const TexturedPlanet: React.FC<{
  fs: CelestialFactsheet;
  durationInFrames: number;
}> = ({ fs, durationInFrames }) => {
  const { rotY, scaleVal, tiltRad } = usePlanetTransform(fs, durationInFrames);

  const hazeColor  = new THREE.Color(fs.trueColor.secondaryHex);
  const primaryColor = new THREE.Color(fs.trueColor.primaryHex);
  const ringColor  = new THREE.Color(fs.trueColor.primaryHex).multiplyScalar(0.85);
  const isSun      = fs.body === 'Sun';

  // Stable hook: always call useTexture twice (map + optional cloud reuses map)
  const mapUrl   = staticFile(`space/textures/${fs.textures.map}`);
  const cloudUrl = staticFile(`space/textures/${fs.textures.cloud ?? fs.textures.map}`);
  const mapTexture   = useTexture(mapUrl);
  const cloudTexture = useTexture(cloudUrl);
  const hasCloud = !!fs.textures.cloud;

  return (
    <>
      <PlanetLights isSun={isSun} />

      <group rotation={[0, 0, tiltRad]} scale={[scaleVal, scaleVal, scaleVal]}>
        {/* Main body */}
        <mesh rotation={[0, rotY, 0]}>
          <sphereGeometry args={[3.2, 96, 96]} />
          {isSun ? (
            <meshBasicMaterial color={primaryColor} />
          ) : (
            <meshStandardMaterial map={mapTexture} metalness={0.05} roughness={0.85} />
          )}
        </mesh>

        {/* Cloud layer */}
        {hasCloud && !isSun && (
          <mesh rotation={[0, rotY * 1.12, 0]} scale={1.006}>
            <sphereGeometry args={[3.2, 64, 64]} />
            <meshLambertMaterial
              map={cloudTexture}
              transparent
              opacity={fs.atmosphere.bandedStructure ? 0.15 : 0.35}
            />
          </mesh>
        )}

        {/* Atmosphere glow (back-face) */}
        <mesh scale={1.06}>
          <sphereGeometry args={[3.2, 64, 64]} />
          <meshBasicMaterial color={hazeColor} transparent opacity={isSun ? 0.45 : 0.22} side={THREE.BackSide} />
        </mesh>

        {/* Ring system (Saturn) */}
        {fs.rings && (
          <mesh rotation={[Math.PI / 2 - THREE.MathUtils.degToRad(fs.rings.tiltFromOrbitalPlaneDeg), 0, 0]}>
            <ringGeometry args={[3.2 * fs.rings.innerRadiusMultiplier, 3.2 * fs.rings.outerRadiusMultiplier, 128]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.72} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </>
  );
};

// ─── Procedural fallback — canvas band textures, no network ───────────────────
const ProceduralPlanet: React.FC<{
  fs: CelestialFactsheet;
  durationInFrames: number;
}> = ({ fs, durationInFrames }) => {
  const { rotY, scaleVal, tiltRad } = usePlanetTransform(fs, durationInFrames);

  const primaryColor = new THREE.Color(fs.trueColor.primaryHex);
  const hazeColor    = new THREE.Color(fs.trueColor.secondaryHex);
  const ringColor    = new THREE.Color(fs.trueColor.primaryHex).multiplyScalar(0.85);
  const isSun        = fs.body === 'Sun';

  const bandTexture = React.useMemo(() => {
    if (!fs.atmosphere.bandedStructure) return null;
    const count = fs.body === 'Jupiter' ? 14 : 8;
    return makeBandTexture(fs.trueColor.primaryHex, fs.trueColor.secondaryHex, count);
  }, [fs]);

  return (
    <>
      <PlanetLights isSun={isSun} />

      <group rotation={[0, 0, tiltRad]} scale={[scaleVal, scaleVal, scaleVal]}>
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

        <mesh scale={1.06}>
          <sphereGeometry args={[3.2, 64, 64]} />
          <meshBasicMaterial color={hazeColor} transparent opacity={isSun ? 0.45 : 0.22} side={THREE.BackSide} />
        </mesh>

        {fs.rings && (
          <mesh rotation={[Math.PI / 2 - THREE.MathUtils.degToRad(fs.rings.tiltFromOrbitalPlaneDeg), 0, 0]}>
            <ringGeometry args={[3.2 * fs.rings.innerRadiusMultiplier, 3.2 * fs.rings.outerRadiusMultiplier, 128]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.72} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </>
  );
};

// ─── Error boundary — catches useTexture() failures ───────────────────────────
interface BoundaryState { failed: boolean }
interface BoundaryProps { children: React.ReactNode; fallback: React.ReactNode; bodyName: string }

class TextureErrorBoundary extends React.Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError(): BoundaryState { return { failed: true }; }
  componentDidCatch(err: Error) {
    console.warn(
      `[CelestialBody] texture load failed for "${this.props.bodyName}", using procedural fallback:`,
      err.message,
    );
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface CelestialBodyProps {
  bodyName?: string;
  fallbackColor?: string;
  durationInFrames?: number;
}

export const CelestialBody: React.FC<CelestialBodyProps> = ({
  bodyName = 'Jupiter',
  durationInFrames = 120,
}) => {
  const fs = CELESTIAL_FACTSHEETS[bodyName] ?? CELESTIAL_FACTSHEETS['Jupiter'];
  const cameraPos = CAMERA_FRAMING_PRESETS[fs.signatureFeature.cameraFraming](fs, 0, durationInFrames);
  const canvasStyle: React.CSSProperties = { position: 'absolute', inset: 0 };

  const proceduralCanvas = (
    <ThreeCanvas width={1080} height={1920} style={canvasStyle} camera={{ position: cameraPos, fov: 50 }}>
      <ProceduralPlanet fs={fs} durationInFrames={durationInFrames} />
    </ThreeCanvas>
  );

  return (
    <TextureErrorBoundary bodyName={bodyName} fallback={proceduralCanvas}>
      <React.Suspense fallback={proceduralCanvas}>
        <ThreeCanvas width={1080} height={1920} style={canvasStyle} camera={{ position: cameraPos, fov: 50 }}>
          <TexturedPlanet fs={fs} durationInFrames={durationInFrames} />
        </ThreeCanvas>
      </React.Suspense>
    </TextureErrorBoundary>
  );
};
