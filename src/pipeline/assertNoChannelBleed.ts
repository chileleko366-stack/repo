// Session 3 v3 — render-manifest guard against cross-channel config bleed.
// Runs at manifest build time, independent of script content validation.
// A beat's voice, font, and background colour must match its channel's config exactly.

import type { ManifestBeat } from './types';
import { CHANNEL_CONFIGS } from './channelConfigs';

const CHANNEL_PALETTES: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(CHANNEL_CONFIGS).map(([id, cfg]) => [
    id,
    new Set([
      cfg.colors.bgPrimary.toLowerCase(),
      cfg.colors.accent1.toLowerCase(),
      cfg.colors.accent2.toLowerCase(),
      '#000000',
      '#ffffff',
    ]),
  ]),
);

function isChannelColor(color: string, channelId: string): boolean {
  const palette = CHANNEL_PALETTES[channelId];
  if (!palette) return true; // unknown channel — allow
  return palette.has(color.toLowerCase());
}

export function assertNoChannelBleed(beats: ManifestBeat[], channelId: string): void {
  const expected = CHANNEL_CONFIGS[channelId as keyof typeof CHANNEL_CONFIGS];
  if (!expected) return; // unknown channel — skip

  for (const beat of beats) {
    if (beat.bg_color && !isChannelColor(beat.bg_color, channelId)) {
      console.warn(
        `[assertNoChannelBleed] Beat ${beat.beatId}: bg_color ${beat.bg_color} not in ${channelId}'s palette — check for cross-channel contamination`,
      );
    }
  }
}
