import React from 'react';
import { Audio, useCurrentFrame, useVideoConfig } from 'remotion';
import { SfxEvent } from '../../pipeline/types';

interface Props {
  events: SfxEvent[];
  sfxBasePath?: string;
}

export const SfxLayer: React.FC<Props> = ({ events, sfxBasePath = '/sfx' }) => {
  const frame = useCurrentFrame();

  return (
    <>
      {events.map((ev, i) => {
        if (frame < ev.frame || frame > ev.frame + 60) return null;
        const startFrom = frame - ev.frame;
        return (
          <Audio
            key={`${ev.sfxKey}-${ev.frame}-${i}`}
            src={`${sfxBasePath}/${ev.sfxKey}.mp3`}
            startFrom={startFrom}
            volume={ev.volume}
          />
        );
      })}
    </>
  );
};
