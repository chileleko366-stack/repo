/**
 * Hook to load word-boundary JSON files for all beats in a manifest.
 * Uses useDelayRender to hold Remotion's render until all JSON is fetched.
 *
 * Returns null until all files are loaded, then returns the populated map.
 */

import { useCallback, useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender, staticFile } from 'remotion';
import type { ManifestBeat } from '../../pipeline/types';
import type { WordBoundary } from './CaptionTrack';

export function useWordBoundaries(
  beats: ManifestBeat[],
): Record<string, WordBoundary[]> | null {
  const [handle] = useState(() => delayRender('word-boundaries'));
  const [boundaries, setBoundaries] = useState<Record<string, WordBoundary[]> | null>(null);

  const captionBeats = beats.filter((b) => b.captionsVisible);

  const load = useCallback(async () => {
    try {
      const entries = await Promise.all(
        captionBeats.map(async (beat) => {
          const path = staticFile(beat.wordBoundariesPath);
          const res = await fetch(path);
          if (!res.ok) {
            // If the file doesn't exist yet (pre-TTS), return empty array
            return [beat.beatId, []] as [string, WordBoundary[]];
          }
          const data = (await res.json()) as WordBoundary[];
          return [beat.beatId, data] as [string, WordBoundary[]];
        }),
      );
      setBoundaries(Object.fromEntries(entries));
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [handle, captionBeats.map((b) => b.beatId).join(',')]);

  useEffect(() => {
    load();
  }, [load]);

  return boundaries;
}
