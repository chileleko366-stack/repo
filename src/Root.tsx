import './index.css';
import React from 'react';
import { Composition } from 'remotion';
import type { VideoManifest } from './pipeline/types';
import { FPS, VIDEO_FRAMES } from './pipeline/types';
import { Ch1Composition } from './remotion/channels/ch1/Ch1Composition';
import { Ch2Composition } from './remotion/channels/ch2/Ch2Composition';
import { Ch3Composition } from './remotion/channels/ch3/Ch3Composition';
import { Ch4Composition } from './remotion/channels/ch4/Ch4Composition';
import { Ch5Composition } from './remotion/channels/ch5/Ch5Composition';
import { Ch6Composition } from './remotion/channels/ch6/Ch6Composition';

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
      <Composition
        id="Ch2"
        component={Ch2Composition}
        durationInFrames={VIDEO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ manifest: EMPTY_MANIFEST }}
      />
      <Composition
        id="Ch3"
        component={Ch3Composition}
        durationInFrames={VIDEO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ manifest: EMPTY_MANIFEST }}
      />
      <Composition
        id="Ch4"
        component={Ch4Composition}
        durationInFrames={VIDEO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ manifest: EMPTY_MANIFEST }}
      />
      <Composition
        id="Ch5"
        component={Ch5Composition}
        durationInFrames={VIDEO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ manifest: EMPTY_MANIFEST }}
      />
      <Composition
        id="Ch6"
        component={Ch6Composition}
        durationInFrames={VIDEO_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ manifest: EMPTY_MANIFEST }}
      />
    </>
  );
};
