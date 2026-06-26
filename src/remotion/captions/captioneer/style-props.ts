/**
 * Shared layout props for caption style components.
 */

import type { CaptionSegment, Word } from './types';
import { getSegmentDisplayLines } from './utils';

export interface CaptionStyleLayoutProps {
  maxWidth?: number;
  wordsPerLine?: number;
  useSmartWrap?: boolean;
}

export function captionBoxMaxWidth(maxWidth?: number): string {
  return maxWidth ? `${maxWidth}px` : '80%';
}

export function resolveDisplayLines(
  segment: CaptionSegment,
  layout?: CaptionStyleLayoutProps,
): Word[][] {
  return getSegmentDisplayLines(segment, {
    wordsPerLine: layout?.wordsPerLine,
    useSmartWrap: layout?.useSmartWrap,
  });
}

export function flatWordIndex(
  lines: Word[][],
  lineIndex: number,
  wordIndexInLine: number,
): number {
  let idx = 0;
  for (let l = 0; l < lineIndex; l++) idx += lines[l]!.length;
  return idx + wordIndexInLine;
}
