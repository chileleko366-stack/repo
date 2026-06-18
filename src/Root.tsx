import './index.css';
import React from 'react';
import { Composition } from 'remotion';
import { FPS, VIDEO_FRAMES } from './pipeline/types';
import type { VideoManifest } from './pipeline/types';
import { Ch1Composition } from './remotion/channels/ch1/Ch1Composition';

// Placeholder manifest passed as defaultProps so the Studio can open without
// a real JSON file. Pass --props '{"manifest":{...}}' when rendering.
const EMPTY_MANIFEST = {} as VideoManifest;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ch1"
        component={Ch1Composition}
        durationInFrames={VIDEO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ manifest: EMPTY_MANIFEST }}
      />
    </>
  );
};
