// Per-channel transition configuration for BeatCompositor.
// TransitionSeries wiring lives in BeatCompositor.tsx — this module exports
// the channel→style mapping and shared timing constants used by that compositor.

import { springTiming } from "@remotion/transitions";

export const CHANNEL_TRANSITIONS: Record<string, string> = {
  ch1: "slide",
  ch2: "wipe",
  ch3: "fade",
  ch4: "slide",
  ch5: "fade",
  ch6: "wipe",
};

export const TRANSITION_DURATION = 8;

export const transitionTiming = springTiming({
  config: { damping: 200, stiffness: 400, mass: 0.5 },
  durationInFrames: TRANSITION_DURATION,
});
