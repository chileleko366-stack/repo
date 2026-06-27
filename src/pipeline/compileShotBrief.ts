import { ShotBrief, Beat } from './types';
import { DEFAULT_SHOT_BRIEF } from './shotBrief';

export function compileShotBrief(beat: Beat, accentColor: string): ShotBrief {
  if (beat.shotBrief) return beat.shotBrief;
  return {
    ...DEFAULT_SHOT_BRIEF,
    glow: { color: accentColor, radius: 40, opacity: 0.6 },
  };
}
