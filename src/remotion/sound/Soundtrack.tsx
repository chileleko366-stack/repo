/**
 * Soundtrack — per-channel music bed.
 *
 * Plays a looping music track for the full 35s video (VIDEO_FRAMES = 2100 at 60fps).
 * Volume fades in over the first 30 frames and out over the last 30 frames
 * so it does not clash with the voiceover.
 *
 * Music files live in public/music/{channelId}.mp3:
 *   ch1 — FreePD upbeat electronic (CC0)
 *   ch2 — FreePD tense corporate (CC0)
 *   ch3 — FreePD dark ambient (CC0)
 *   ch4 — FreePD calm cinematic (CC0)
 *   ch5 — Incompetech documentary (CC BY 4.0)
 *   ch6 — FreePD space ambient (CC0)
 *
 * The `musicVolume` prop allows channel compositions to override the default
 * level (e.g. ch6 bumps music louder because ch6 has no voiceover gaps).
 */

import React from 'react';
import { Audio, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { ChannelId } from '../../pipeline/types';
import { VIDEO_FRAMES } from '../../pipeline/types';

const FADE_IN_FRAMES  = 30;
const FADE_OUT_FRAMES = 30;
const TOTAL_FRAMES    = VIDEO_FRAMES;

export const Soundtrack: React.FC<{
  channelId: ChannelId;
  musicVolume?: number;
}> = ({ channelId, musicVolume = 0.18 }) => {
  const frame = useCurrentFrame();

  const vol = interpolate(
    frame,
    [
      0,
      FADE_IN_FRAMES,
      TOTAL_FRAMES - FADE_OUT_FRAMES,
      TOTAL_FRAMES,
    ],
    [0, musicVolume, musicVolume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <Audio
      src={staticFile(`music/${channelId}.mp3`)}
      volume={vol}
      startFrom={0}
      loop
    />
  );
};
