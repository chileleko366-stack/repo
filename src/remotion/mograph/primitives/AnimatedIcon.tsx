import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_BOUNCE } from './SpringConfigs';

interface Props {
  iconSvg?: string;
  accentColor?: string;
  backgroundColor?: string;
  size?: number;
}

const DEFAULT_SVG = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;

export const AnimatedIcon: React.FC<Props> = ({
  iconSvg = DEFAULT_SVG,
  accentColor = '#d400ff',
  backgroundColor = '#16121f',
  size = 200,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_BOUNCE });
  const scale = interpolate(progress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '32px',
          backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          boxShadow: `0 0 60px ${accentColor}44`,
          border: `2px solid ${accentColor}44`,
          padding: 32,
          color: accentColor,
        }}
        dangerouslySetInnerHTML={{ __html: iconSvg }}
      />
    </AbsoluteFill>
  );
};
