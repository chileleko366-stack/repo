/**
 * StockClip — renders a stock video or photo inside a beat's Sequence.
 *
 * StockVideoClip:
 *   <Video> plays the MP4 at native frame rate, muted (voiceover handles audio).
 *   Subtle push-in zoom via interpolate keeps the frame lively.
 *   objectFit: 'cover' handles landscape → portrait cropping automatically.
 *
 * StockPhotoClip:
 *   <Img> with Ken Burns pan+zoom identical to PlacePhoto.
 *
 * Both use a 20% dark overlay so text/captions remain legible.
 * All animation is a pure function of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import {
  AbsoluteFill,
  Img,
  Video,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import type { StockAsset } from '../../pipeline/types';

// ── Video clip ────────────────────────────────────────────────────────────────

const StockVideoClip: React.FC<{
  asset: StockAsset;
  durationFrames: number;
}> = ({ asset, durationFrames }) => {
  const frame = useCurrentFrame();

  // Slow push-in over the full beat duration
  const scale = interpolate(frame, [0, durationFrames], [1.0, 1.07], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Video
        src={staticFile(asset.path.replace(/^public\//, ''))}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        volume={0}
        playbackRate={1}
        startFrom={0}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.22)',
        }}
      />
    </AbsoluteFill>
  );
};

// ── Photo clip ────────────────────────────────────────────────────────────────

const StockPhotoClip: React.FC<{
  asset: StockAsset;
  durationFrames: number;
}> = ({ asset, durationFrames }) => {
  const frame = useCurrentFrame();
  const t = frame / durationFrames;

  const scale      = interpolate(t, [0, 1], [1.06, 1.14], { extrapolateRight: 'clamp' });
  const translateX = interpolate(t, [0, 1], [0, -20],     { extrapolateRight: 'clamp' });
  const translateY = interpolate(t, [0, 1], [0, -6],      { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={staticFile(asset.path.replace(/^public\//, ''))}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: 'center center',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// ── Dispatcher ────────────────────────────────────────────────────────────────

export const StockClip: React.FC<{
  asset: StockAsset;
  durationFrames: number;
}> = ({ asset, durationFrames }) => {
  if (asset.kind === 'video') {
    return <StockVideoClip asset={asset} durationFrames={durationFrames} />;
  }
  return <StockPhotoClip asset={asset} durationFrames={durationFrames} />;
};
