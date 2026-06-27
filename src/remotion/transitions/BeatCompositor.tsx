import React from 'react';
import { AbsoluteFill, Audio } from 'remotion';
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from '@remotion/transitions';
import { iris } from '@remotion/transitions/iris';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';
import { linearBlur } from '@remotion/transitions/linear-blur';
import { dreamyZoom } from '@remotion/transitions/dreamy-zoom';
import { Beat, VideoManifest } from '../../pipeline/types';
import { ShotBriefLayer } from '../mograph/ShotBriefLayer';
import { KineticTextLayer } from '../mograph/KineticTextLayer';
import { AssetLayer } from '../assets/AssetLayer';
import { CaptionTrack } from '../captions/CaptionTrack';
import { useWordBoundaries } from '../captions/useWordBoundaries';
import { SfxLayer } from '../sound/SfxLayer';
import { DEFAULT_SHOT_BRIEF } from '../../pipeline/shotBrief';

interface Props {
  manifest: VideoManifest;
  accentColor: string;
  bgColor: string;
  fontHeading: string;
  fontBody: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPresentation = any;

interface TransitionConfig {
  presentation: AnyPresentation;
  timing: ReturnType<typeof linearTiming> | ReturnType<typeof springTiming>;
}

function getTransition(beat: Beat, index: number): TransitionConfig {
  const sk = beat.sectionKey;
  const pause = beat.pause_after;
  const SHORT = 8;
  const MED = 14;

  if (sk === 'hook') {
    return { presentation: iris({ width: 1080, height: 1920 }), timing: springTiming({ durationInFrames: MED }) };
  }
  if (sk === 'outro') {
    return { presentation: dreamyZoom({}), timing: linearTiming({ durationInFrames: MED * 2 }) };
  }
  if (pause === 'breath') {
    return { presentation: linearBlur({}), timing: linearTiming({ durationInFrames: SHORT }) };
  }
  if (pause === 'beat') {
    return {
      presentation: index % 2 === 0 ? wipe({ direction: 'from-left' }) : slide({ direction: 'from-right' }),
      timing: linearTiming({ durationInFrames: SHORT }),
    };
  }
  // cut
  return { presentation: fade(), timing: linearTiming({ durationInFrames: 3 }) };
}

interface BeatSceneProps {
  beat: Beat;
  accentColor: string;
  bgColor: string;
  fontBody: string;
  localSfxEvents: Beat['sfxEvents'];
}

const BeatScene: React.FC<BeatSceneProps> = ({ beat, accentColor, bgColor, fontBody, localSfxEvents }) => {
  const brief = beat.shotBrief ?? DEFAULT_SHOT_BRIEF;

  return (
    <AbsoluteFill style={{ backgroundColor: beat.bg_color || bgColor }}>
      <ShotBriefLayer
        brief={brief}
        beat={beat as unknown as Record<string, unknown>}
        accentColor={accentColor}
      />

      {beat.resolvedAsset && (
        <AssetLayer asset={beat.resolvedAsset} accentColor={accentColor} />
      )}

      {beat.audioPath && (
        <Audio src={`/${beat.audioPath}`} />
      )}

      {localSfxEvents && localSfxEvents.length > 0 && (
        <SfxLayer events={localSfxEvents} />
      )}

      <KineticTextLayer
        narration={beat.narration}
        accentColor={accentColor}
        emphasisKeyword={beat.emphasis_keyword}
        fontFamily={fontBody}
      />
    </AbsoluteFill>
  );
};

export const BeatCompositor: React.FC<Props> = ({
  manifest,
  accentColor,
  bgColor,
  fontHeading,
  fontBody,
}) => {
  const wordBoundaries = useWordBoundaries(manifest.beats);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <TransitionSeries>
        {manifest.beats.map((beat, i) => {
          const localSfx = (beat.sfxEvents ?? []).map((ev) => ({
            ...ev,
            frame: ev.frame - beat.startFrame,
          }));

          return (
            <React.Fragment key={beat.beatId}>
              <TransitionSeries.Sequence durationInFrames={beat.durationFrames}>
                <BeatScene
                  beat={beat}
                  accentColor={accentColor}
                  bgColor={bgColor}
                  fontBody={fontBody}
                  localSfxEvents={localSfx}
                />
              </TransitionSeries.Sequence>
              {i < manifest.beats.length - 1 && (() => {
                const t = getTransition(beat, i);
                return (
                  <TransitionSeries.Transition
                    presentation={t.presentation}
                    timing={t.timing}
                  />
                );
              })()}
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      <CaptionTrack words={wordBoundaries} accentColor={accentColor} fontFamily={fontBody} />
    </AbsoluteFill>
  );
};
