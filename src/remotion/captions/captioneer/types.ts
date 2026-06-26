/**
 * Core types for caption rendering
 */

/**
 * A single word with timing
 */
export interface Word {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

/**
 * A segment (group of words, typically a sentence/phrase)
 */
export interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  words: Word[];
}

/**
 * Full caption data container
 */
export interface CaptionData {
  segments: CaptionSegment[];
  language: string;
  durationMs: number;
}
