/**
 * ModelErrorBoundary — catches useGLTF 404 errors and renders a fallback sphere.
 *
 * Every 3D component that calls useGLTF() must be wrapped in this.
 * When a GLB is missing (404 in CI, not yet downloaded), useGLTF throws.
 * Without this boundary the entire composition crashes and render exits non-zero.
 *
 * Usage:
 *   <ModelErrorBoundary accentColor={accentColor}>
 *     <ThreeBrain />
 *   </ModelErrorBoundary>
 */

import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useCurrentFrame, useVideoConfig } from 'remotion';

// ── Fallback sphere rendered when a GLB fails to load ─────────────────────────

const FallbackSphere: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rotY = t * 0.4;

  return (
    <ThreeCanvas
      width={1080}
      height={1920}
      style={{ position: 'absolute', inset: 0 }}
      gl={{ failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: true }}
      camera={{ position: [0, 0, 3], fov: 50 }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[2, 4, 3]} intensity={1.8} />
      <pointLight position={[-2, 2, 2]} intensity={1.0} color={accentColor} />
      <mesh rotation={[0.3, rotY, 0]}>
        <sphereGeometry args={[1.1, 48, 48]} />
        <meshStandardMaterial
          color={accentColor}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>
    </ThreeCanvas>
  );
};

// ── Error boundary class ───────────────────────────────────────────────────────

interface ModelErrorBoundaryProps {
  children: React.ReactNode;
  accentColor?: string;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ModelErrorBoundary extends React.Component<
  ModelErrorBoundaryProps,
  ModelErrorBoundaryState
> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn('[ModelErrorBoundary] 3D model failed to load:', error.message);
    console.warn('[ModelErrorBoundary] Component stack:', info.componentStack?.slice(0, 200));
  }

  render() {
    const fallback = <FallbackSphere accentColor={this.props.accentColor ?? '#888888'} />;
    if (this.state.hasError) {
      return fallback;
    }
    return (
      <React.Suspense fallback={fallback}>
        {this.props.children}
      </React.Suspense>
    );
  }
}
