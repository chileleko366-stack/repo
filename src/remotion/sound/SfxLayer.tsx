/**
 * SfxLayer — renders one <Audio> per SoundEvent in manifest.soundDesign.
 *
 * Each event fires at its startFrame, plays for durationFrames, then stops.
 * Volume is driven by interpolate so it fades cleanly at boundaries rather
 * than popping. All timing is a pure function of the frame, no side-effects.
 *
 * SFX files live in public/sfx/{name}.mp3 (Kenney SFX pack, CC0).
 */

import React from 'react';
import { Audio, Sequence, interpolate, staticFile } from 'remotion';
import type { SoundEvent } from '../../pipeline/types';

const FADE_FRAMES = 3;

const SfxEvent: React.FC<{ event: SoundEvent }> = ({ event }) => {
  const { name, durationFrames, volume = 1 } = event;

  // Tiny linear fade-in/out to avoid click artifacts
  const vol = interpolate(
    0,  // useCurrentFrame() is 0 inside this Sequence
    [0, FADE_FRAMES, durationFrames - FADE_FRAMES, durationFrames],
    [0, volume, volume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <Audio
      src={staticFile(`sfx/${name}.mp3`)}
      volume={vol}
      startFrom={0}
    />
  );
};

export const SfxLayer: React.FC<{
  soundDesign: SoundEvent[];
}> = ({ soundDesign }) => {
  return (
    <>
      {soundDesign.map((event) => (
        <Sequence
          key={event.id}
          from={event.startFrame}
          durationInFrames={event.durationFrames}
          layout="none"
        >
          <SfxEvent event={event} />
        </Sequence>
      ))}
    </>
  );
};
