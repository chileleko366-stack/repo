import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const LayoutSplitContrast: React.FC<{
  leftText: string;
  rightText: string;
  leftColor?: string;
  rightColor?: string;
  fontFamily?: string;
}> = ({
  leftText,
  rightText,
  leftColor = '#000000',
  rightColor = '#d400ff',
  fontFamily = "'Anton', sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 28, stiffness: 280 }, durationInFrames: 45 });
  const splitPct = interpolate(progress, [0, 1], [100, 52]);
  const opacity = Math.min(frame / 15, 1);

  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize: 80,
    fontWeight: 700,
    textAlign: 'center',
    padding: '0 40px',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
  };

  return (
    <AbsoluteFill style={{ opacity }}>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${splitPct}%`, background: leftColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ ...textStyle, color: rightColor }}>{leftText}</div>
      </div>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: `${100 - splitPct}%`, background: rightColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ ...textStyle, color: leftColor }}>{rightText}</div>
      </div>
    </AbsoluteFill>
  );
};
