import React from 'react';
import { AbsoluteFill, Img } from 'remotion';

interface Props {
  svgPath: string;
  accentColor?: string;
  size?: number;
}

export const BrandLogo: React.FC<Props> = ({ svgPath, accentColor = '#ffffff', size = 280 }) => (
  <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Img
      src={svgPath}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: `drop-shadow(0 0 40px ${accentColor}66)`,
      }}
    />
  </AbsoluteFill>
);
