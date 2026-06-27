import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

interface Props {
  startXPct?: number;
  startYPct?: number;
  endXPct?: number;
  endYPct?: number;
  clickFrame?: number;
  color?: string;
}

export const CursorClick: React.FC<Props> = ({
  startXPct = 20,
  startYPct = 30,
  endXPct = 65,
  endYPct = 60,
  clickFrame = 40,
  color = '#ffffff',
}) => {
  const frame = useCurrentFrame();
  const W = 1080, H = 1920;

  const x0 = (startXPct / 100) * W;
  const y0 = (startYPct / 100) * H;
  const x1 = (endXPct / 100) * W;
  const y1 = (endYPct / 100) * H;
  const cpX = (x0 + x1) / 2 + 120;
  const cpY = (y0 + y1) / 2 - 80;

  const t = Math.min(frame / clickFrame, 1);
  const cx = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cpX + t ** 2 * x1;
  const cy = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cpY + t ** 2 * y1;

  const afterClick = frame - clickFrame;
  const clickPulse = afterClick >= 0 && afterClick < 20
    ? interpolate(afterClick, [0, 8, 20], [0, 50, 0])
    : 0;
  const clickOpacity = afterClick >= 0 && afterClick < 20
    ? interpolate(afterClick, [0, 8, 20], [0.8, 0.6, 0])
    : 0;
  const cursorScale = afterClick >= 0 && afterClick < 10
    ? interpolate(afterClick, [0, 5, 10], [1, 0.85, 1])
    : 1;

  const cursorPath = 'M0 0 L0 44 L12 33 L20 50 L26 47 L18 30 L33 30 Z';

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {clickPulse > 0 && (
          <circle cx={cx} cy={cy} r={clickPulse} fill="none" stroke={color} strokeWidth="3" opacity={clickOpacity} />
        )}
        <g transform={`translate(${cx}, ${cy}) scale(${cursorScale})`}>
          <path d={cursorPath} fill={color} stroke="#000" strokeWidth="2" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
