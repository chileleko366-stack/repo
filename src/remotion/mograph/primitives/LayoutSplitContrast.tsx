import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { SPRING_SNAPPY } from './SpringConfigs';

interface Props {
  leftText?: string;
  rightText?: string;
  leftColor?: string;
  rightColor?: string;
  leftBg?: string;
  rightBg?: string;
}

export const LayoutSplitContrast: React.FC<Props> = ({
  leftText = 'BEFORE',
  rightText = 'AFTER',
  leftColor = '#ff4444',
  rightColor = '#00ff88',
  leftBg = '#1a0000',
  rightBg = '#001a0a',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: SPRING_SNAPPY });
  const split = interpolate(progress, [0, 1], [0, 50]);

  return (
    <AbsoluteFill style={{ flexDirection: 'row' }}>
      <div style={{ width: `${split}%`, background: leftBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', transition: 'none' }}>
        <div style={{ fontSize: 72, fontFamily: 'Anton, sans-serif', fontWeight: 900, color: leftColor, textTransform: 'uppercase', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
          {leftText}
        </div>
      </div>
      <div style={{ width: `${100 - split}%`, background: rightBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ fontSize: 72, fontFamily: 'Anton, sans-serif', fontWeight: 900, color: rightColor, textTransform: 'uppercase', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
          {rightText}
        </div>
      </div>
    </AbsoluteFill>
  );
};
