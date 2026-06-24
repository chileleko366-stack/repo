import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

interface CursorClickProps {
  accentColor?: string;
  backgroundColor?: string;
  label?: string;
}

export const CursorClick: React.FC<CursorClickProps> = ({
  accentColor = '#4f46e5',
  backgroundColor = '#ffffff',
  label,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const totalDuration = 1.8;
  const progress = Math.min(t / totalDuration, 1);
  const p = progress;

  // Quadratic bezier path
  const x0 = 200, y0 = 400;
  const x1 = 600, y1 = 200;
  const x2 = 680, y2 = 880;

  const cx = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * x1 + p * p * x2;
  const cy = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * y1 + p * p * y2;

  const clickFrame = Math.max(0, frame - Math.round(totalDuration * fps));
  const clickScale = spring({
    frame: clickFrame, fps,
    config: { damping: 10, stiffness: 200, mass: 0.5 },
    from: 1, to: 1.4,
  });
  const clickOpacity = clickFrame > 0
    ? interpolate(clickFrame, [0, Math.round(fps * 0.5)], [1, 0], { extrapolateRight: 'clamp' })
    : 0;

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor, position: 'relative', overflow: 'hidden' }}>
      {label && (
        <div style={{
          position: 'absolute',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 52,
          fontWeight: 700,
          color: '#111827',
          textAlign: 'center',
          width: '80%',
        }}>
          {label}
        </div>
      )}
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0 }}>
        <path
          d={`M ${x0} ${y0} Q ${x1} ${y1} ${x2} ${y2}`}
          fill="none" stroke={accentColor} strokeWidth={3}
          strokeOpacity={0.2} strokeDasharray="10 8"
        />
        {clickOpacity > 0 && (
          <circle
            cx={cx} cy={cy} r={40 * clickScale}
            fill="none" stroke={accentColor}
            strokeWidth={3} opacity={clickOpacity}
          />
        )}
        <g transform={`translate(${cx}, ${cy})`}>
          <polygon
            points="0,0 0,40 10,30 18,48 24,45 16,27 30,27"
            fill="#111827" stroke="#ffffff" strokeWidth={2}
          />
        </g>
      </svg>
    </div>
  );
};
