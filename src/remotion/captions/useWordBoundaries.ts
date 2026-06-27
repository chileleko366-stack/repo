import { useEffect, useState } from 'react';
import { Beat, WordBoundary } from '../../pipeline/types';

export interface FlatWordBoundary extends WordBoundary {
  beatId: string;
  beatStartMs: number;
  globalStartMs: number;
  globalEndMs: number;
}

export function useWordBoundaries(beats: Beat[]): FlatWordBoundary[] {
  const [flat, setFlat] = useState<FlatWordBoundary[]>([]);

  useEffect(() => {
    const result: FlatWordBoundary[] = [];
    let cursor = 0;

    for (const beat of beats) {
      const words = beat.wordBoundaries ?? [];
      const beatStartMs = cursor;

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        // First word of each new beat gets a leading space guard
        const prefix = i === 0 && result.length > 0 ? ' ' : '';
        result.push({
          ...w,
          word: prefix + w.word,
          beatId: beat.beatId,
          beatStartMs,
          globalStartMs: beatStartMs + w.startMs,
          globalEndMs: beatStartMs + w.endMs,
        });
      }

      cursor += beat.durationMs ?? (beat.durationFrames / 60) * 1000;
    }

    setFlat(result);
  }, [beats]);

  return flat;
}

export function getActiveWords(flat: FlatWordBoundary[], currentMs: number): FlatWordBoundary[] {
  let idx = -1;
  for (let i = flat.length - 1; i >= 0; i--) {
    if (flat[i].globalStartMs <= currentMs) { idx = i; break; }
  }
  if (idx < 0) return [];
  const start = Math.max(0, idx - 2);
  return flat.slice(start, idx + 1);
}
