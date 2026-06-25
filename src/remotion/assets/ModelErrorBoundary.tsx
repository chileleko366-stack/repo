import React from 'react';
import { AbsoluteFill } from 'remotion';

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; }

export class ModelErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[ModelErrorBoundary] caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <AbsoluteFill style={{ background: 'transparent' }} />;
    }
    return (
      <React.Suspense fallback={this.props.fallback ?? <AbsoluteFill />}>
        {this.props.children}
      </React.Suspense>
    );
  }
}
