/**
 * Utility functions for caption rendering
 */

import type { Caption } from '@remotion/captions';
import type { CaptionData, CaptionSegment, Word } from './types';

export function getActiveSegment(
  captions: CaptionData,
  currentTimeMs: number,
): CaptionSegment | null {
  return (
    captions.segments.find(
      (seg) => currentTimeMs >= seg.startMs && currentTimeMs <= seg.endMs,
    ) ?? null
  );
}

export function getActiveWord(
  segment: CaptionSegment,
  currentTimeMs: number,
): Word | null {
  return (
    segment.words.find(
      (w) => currentTimeMs >= w.startMs && currentTimeMs <= w.endMs,
    ) ?? null
  );
}

export function getActiveWordIndex(
  segment: CaptionSegment,
  currentTimeMs: number,
): number {
  return segment.words.findIndex(
    (w) => currentTimeMs >= w.startMs && currentTimeMs <= w.endMs,
  );
}

export function getWordProgress(word: Word, currentTimeMs: number): number {
  if (currentTimeMs < word.startMs) return 0;
  if (currentTimeMs > word.endMs) return 1;
  return (currentTimeMs - word.startMs) / (word.endMs - word.startMs);
}

export function getSegmentDisplayLines(
  segment: CaptionSegment,
  options?: { wordsPerLine?: number; useSmartWrap?: boolean },
): Word[][] {
  if (options?.useSmartWrap) {
    return smartWrap(segment.words, {
      maxWordsPerLine: options.wordsPerLine ?? 6,
    });
  }
  if (options?.wordsPerLine && options.wordsPerLine > 0) {
    return groupWordsIntoLines(segment.words, options.wordsPerLine);
  }
  return [segment.words];
}

export function groupWordsIntoLines(
  words: Word[],
  wordsPerLine: number = 5,
): Word[][] {
  const lines: Word[][] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine));
  }
  return lines;
}

export function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

export function frameToMs(frame: number, fps: number): number {
  return (frame / fps) * 1000;
}

export function smartWrap(
  words: Word[],
  options: {
    maxWordsPerLine?: number;
    maxGapMs?: number;
    breakOnPunctuation?: boolean;
  } = {},
): Word[][] {
  const {
    maxWordsPerLine = 6,
    maxGapMs = 800,
    breakOnPunctuation = true,
  } = options;

  const lines: Word[][] = [];
  let currentLine: Word[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : null;

    const gapTooBig =
      prevWord && word.startMs - prevWord.endMs > maxGapMs;
    const lineTooLong = currentLine.length >= maxWordsPerLine;
    const punctuationBreak =
      breakOnPunctuation &&
      prevWord &&
      /[.!?,;:]/.test(prevWord.word.trim().slice(-1));

    if (currentLine.length > 0 && (gapTooBig || lineTooLong || punctuationBreak)) {
      lines.push(currentLine);
      currentLine = [];
    }

    currentLine.push(word);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Adapter: Caption[] (from @remotion/captions) → CaptionData
 * Groups flat captions into segments by natural pause gaps (>600ms gap = new segment).
 */
export function captionsToData(captions: Caption[], durationMs: number): CaptionData {
  const GAP_THRESHOLD_MS = 600;
  const segments: CaptionSegment[] = [];
  let currentWords: Word[] = [];

  for (let i = 0; i < captions.length; i++) {
    const c = captions[i];
    const word = c.text.trim();
    if (!word) continue;

    const prev = captions[i - 1];
    const gap = prev ? c.startMs - prev.endMs : 0;

    if (currentWords.length > 0 && gap > GAP_THRESHOLD_MS) {
      segments.push({
        text: currentWords.map((w) => w.word).join(' '),
        startMs: currentWords[0].startMs,
        endMs: currentWords[currentWords.length - 1].endMs,
        words: currentWords,
      });
      currentWords = [];
    }

    currentWords.push({
      word,
      startMs: c.startMs,
      endMs: c.endMs,
      confidence: c.confidence ?? 1,
    });
  }

  if (currentWords.length > 0) {
    segments.push({
      text: currentWords.map((w) => w.word).join(' '),
      startMs: currentWords[0].startMs,
      endMs: currentWords[currentWords.length - 1].endMs,
      words: currentWords,
    });
  }

  return { segments, language: 'en', durationMs };
}
