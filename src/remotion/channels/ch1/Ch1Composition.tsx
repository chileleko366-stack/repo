import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BeatCompositor } from '../../transitions/BeatCompositor';
import { VideoManifest } from '../../../pipeline/types';
import { CHANNEL_CONFIGS } from '../../../pipeline/channelConfigs';

interface Props {
  manifest: VideoManifest;
}

const cfg = CHANNEL_CONFIGS['ch1'];

export const Ch1Composition: React.FC<Props> = ({ manifest }) => (
  <AbsoluteFill style={{ backgroundColor: cfg.bgColor }}>
    <BeatCompositor
      manifest={manifest}
      accentColor={cfg.accentColor}
      bgColor={cfg.bgColor}
      fontHeading={cfg.fontHeading}
      fontBody={cfg.fontBody}
    />
  </AbsoluteFill>
);
