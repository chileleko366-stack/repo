import React from 'react';
import { Composition } from 'remotion';
import { Ch1Composition } from './remotion/channels/ch1/Ch1Composition';
import { Ch2Composition } from './remotion/channels/ch2/Ch2Composition';
import { Ch3Composition } from './remotion/channels/ch3/Ch3Composition';
import { Ch4Composition } from './remotion/channels/ch4/Ch4Composition';
import { Ch5Composition } from './remotion/channels/ch5/Ch5Composition';
import { Ch6Composition } from './remotion/channels/ch6/Ch6Composition';
import { VideoManifest } from './pipeline/types';

type AnyComp = React.ComponentType<{ manifest: VideoManifest }>;

const FPS = 60;
const TOTAL_FRAMES = 2100;
const WIDTH = 1080;
const HEIGHT = 1920;

function makePlaceholderManifest(channelId: string): VideoManifest {
  const beats = [
    { id: 'hook', dur: 120 },
    { id: 'context', dur: 180 },
    { id: 'beat_0', dur: 240 },
    { id: 'beat_1', dur: 240 },
    { id: 'beat_2', dur: 240 },
    { id: 'beat_3', dur: 240 },
    { id: 'beat_4', dur: 240 },
    { id: 'twist', dur: 180 },
    { id: 'outro', dur: 420 },
  ];

  let start = 0;
  return {
    channelId: channelId as VideoManifest['channelId'],
    topic: 'Preview',
    fps: 60,
    totalFrames: 2100,
    durationSec: 35.0,
    generatedAt: new Date().toISOString(),
    beats: beats.map(b => {
      const beat = {
        beatId: `${channelId}_${b.id}`,
        sectionKey: b.id as VideoManifest['beats'][0]['sectionKey'],
        narration: `${b.id} narration for ${channelId}`,
        visual: { kind: 'typography' as const },
        emphasis_keyword: 'preview',
        pause_after: 'beat' as const,
        bg_color: '#000000',
        startFrame: start,
        durationFrames: b.dur,
        wordBoundaries: [],
      };
      start += b.dur;
      return beat;
    }),
  };
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ch1"
        component={Ch1Composition as AnyComp}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ manifest: makePlaceholderManifest('ch1') }}
      />
      <Composition
        id="Ch2"
        component={Ch2Composition as AnyComp}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ manifest: makePlaceholderManifest('ch2') }}
      />
      <Composition
        id="Ch3"
        component={Ch3Composition as AnyComp}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ manifest: makePlaceholderManifest('ch3') }}
      />
      <Composition
        id="Ch4"
        component={Ch4Composition as AnyComp}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ manifest: makePlaceholderManifest('ch4') }}
      />
      <Composition
        id="Ch5"
        component={Ch5Composition as AnyComp}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ manifest: makePlaceholderManifest('ch5') }}
      />
      <Composition
        id="Ch6"
        component={Ch6Composition as AnyComp}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ manifest: makePlaceholderManifest('ch6') }}
      />
    </>
  );
};
