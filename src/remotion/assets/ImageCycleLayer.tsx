/**
 * ImageCycleLayer — crossfades between multiple images spread evenly across
 * a beat's duration. Used by PersonCard/PlacePhoto when an asset resolves
 * more than one image (asset.paths) instead of a single asset.path.
 *
 * Genuine two-way crossfade: at each boundary between images, the outgoing
 * image fades 1→0 while the incoming image fades 0→1 over the SAME shared
 * window (they sum to ~1 combined opacity), not a fade-in stacked on top of
 * a still-fully-opaque previous image — the exact bug fixed for beat-to-beat
 * transitions in BeatCompositor.tsx (see getTransitionPresentation's
 * shouldFadeOutExitingScene comment). Same principle, reused here.
 *
 * Motion (Ken Burns pan/zoom, entrance spring) and the monochrome-with-a-pop
 * filter stay in the caller (PersonCard/PlacePhoto) and are passed down via
 * imgStyle so every image in the stack gets identical treatment — this
 * component's only job is the crossfade.
 */

import React from 'react';
import { Img, staticFile, useCurrentFrame } from 'remotion';

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function imageOpacityAt(
  frame: number,
  index: number,
  segmentFrames: number,
  fadeFrames: number,
  count: number,
): number {
  const boundaryStart = index * segmentFrames;
  const boundaryEnd = (index + 1) * segmentFrames;
  const half = fadeFrames / 2;

  const isFirst = index === 0;
  const isLast = index === count - 1;

  const fadeInStart = isFirst ? -Infinity : boundaryStart - half;
  const fadeInEnd = boundaryStart + half;
  const fadeOutStart = boundaryEnd - half;
  const fadeOutEnd = isLast ? Infinity : boundaryEnd + half;

  if (frame < fadeInStart || frame > fadeOutEnd) return 0;

  const fadeIn = isFirst ? 1 : clamp01((frame - fadeInStart) / (fadeInEnd - fadeInStart));
  const fadeOut = isLast ? 1 : clamp01((fadeOutEnd - frame) / (fadeOutEnd - fadeOutStart));
  return Math.min(fadeIn, fadeOut);
}

export const ImageCycleLayer: React.FC<{
  paths: string[];
  durationFrames: number;
  imgStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}> = ({ paths, durationFrames, imgStyle, containerStyle }) => {
  const frame = useCurrentFrame();
  const count = paths.length;
  const segmentFrames = durationFrames / count;
  const fadeFrames = Math.min(20, segmentFrames / 2);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...containerStyle }}>
      {paths.map((path, i) => (
        <Img
          key={path}
          src={staticFile(path.replace(/^public\//, ''))}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: imageOpacityAt(frame, i, segmentFrames, fadeFrames, count),
            ...imgStyle,
          }}
        />
      ))}
    </div>
  );
};
