import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const CinematicDocumentary: React.FC<{
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  accentColor?: string;
  backgroundColor?: string;
}> = ({
  imageUrl,
  title = '',
  subtitle = '',
  accentColor = '#c8a96e',
  backgroundColor = '#100d08',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxProgress = spring({ frame, fps, config: { damping: 40, stiffness: 300 }, durationInFrames: 30 });
  const ltProgress = spring({ frame: frame - 40, fps, config: { damping: 30, stiffness: 240 }, durationInFrames: 35 });

  const letterboxH = interpolate(boxProgress, [0, 1], [0, 96]);
  const ltTx = interpolate(ltProgress, [0, 1], [-300, 0]);
  const ltOpacity = interpolate(ltProgress, [0, 0.4, 1], [0, 1, 1]);
  const kbScale = interpolate(frame, [0, 150], [1.0, 1.06], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {imageUrl && (
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <Img src={imageUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kbScale})`, filter: 'saturate(0.7) contrast(1.1)' }} />
        </AbsoluteFill>
      )}

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: letterboxH, background: '#000000' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: letterboxH, background: '#000000' }} />

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />

      <div style={{ position: 'absolute', bottom: letterboxH + 80, left: 0, right: 0, padding: '0 80px', transform: `translateX(${ltTx}px)`, opacity: ltOpacity }}>
        <div style={{ borderLeft: `5px solid ${accentColor}`, paddingLeft: 28 }}>
          {title && (
            <div style={{ fontFamily: "'Anton', sans-serif", fontSize: 60, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 40, color: accentColor, marginTop: 8, letterSpacing: '0.04em', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
