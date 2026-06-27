import React from 'react';
import { AbsoluteFill } from 'remotion';

interface FallbackSphereProps {
  accentColor?: string;
}

const FallbackSphere: React.FC<FallbackSphereProps> = ({ accentColor = '#ffffff' }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <div
      style={{
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${accentColor}88, ${accentColor}22, transparent)`,
        boxShadow: `0 0 80px ${accentColor}44`,
      }}
    />
  </AbsoluteFill>
);

interface State {
  hasError: boolean;
}

interface Props {
  children: React.ReactNode;
  accentColor?: string;
}

export class ModelErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[ModelErrorBoundary]', error.message);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackSphere accentColor={this.props.accentColor} />;
    }
    return this.props.children;
  }
}
