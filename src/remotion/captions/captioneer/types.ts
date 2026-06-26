/**
 * Core types for remotion-captioneer
 */

export interface Word {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  words: Word[];
}

export interface CaptionData {
  segments: CaptionSegment[];
  language: string;
  durationMs: number;
}
