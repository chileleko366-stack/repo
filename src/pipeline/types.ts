export type ChannelId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6';

export type BeatKind =
  | 'person'
  | 'brand'
  | 'product'
  | 'app'
  | 'place'
  | 'distance'
  | 'map'
  | 'anatomy'
  | 'celestial'
  | 'stat'
  | 'chart'
  | 'morph'
  | 'typography'
  | 'stock_video'   // kept in type for backwards compat; rejected at script validation time
  | 'none';

export type NumberType = 'year' | 'currency' | 'count' | 'distance';

export interface VisualTag {
  kind: BeatKind;
  value?: string;
  // distance
  from?: string;
  to?: string;
  unit?: string;
  // map
  place?: string;
  zoom?: number;
  label?: string;
  // stat
  prefix?: string;
  suffix?: string;
  stat_value?: number;
  numberType?: NumberType;
  // stock_video
  query?: string;
}

export interface Beat {
  narration: string;
  visual: VisualTag;
  emphasis_keyword: string;
  morph_from?: string | null;
  bg_color: string;
}

export interface OutroVisual extends VisualTag {}

export interface Outro {
  narration: string;
  visual: OutroVisual;
  cta: string;
}

export interface Script {
  topic: string;
  channel_id: ChannelId;
  hook: string;
  context: string;
  beats: Beat[];
  twist: string;
  outro: Outro;
}

export interface WordBoundary {
  word: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

export interface BeatAudio {
  beatId: string;
  audioPath: string;
  wordBoundariesPath: string;
  wordBoundaries: WordBoundary[];
  durationMs: number;
}

export interface StockAsset {
  id: string;
  path: string;
  kind: 'video' | 'photo';
  query: string;
  source: 'pexels' | 'pixabay';
}

export interface PersonAsset {
  path: string | null;
  fallback?: string;
  credit: string | null;
}

export interface BrandAsset {
  svgString: string;
  hex: string;
  title: string;
  type: 'svg';
}

export interface PlaceAsset {
  path: string;
  credit: string;
}

export interface DistanceAsset {
  map_image: string;
  from_place: string;
  from_lat: number;
  from_lon: number;
  from_px: [number, number];
  to_place: string;
  to_lat: number;
  to_lon: number;
  to_px: [number, number];
  distance_km: number;
  distance_label: string;
}

export interface SoundEvent {
  id: string;
  name: string;
  startFrame: number;
  durationFrames: number;
  volume?: number;
}

export type SectionKey =
  | 'hook' | 'context'
  | 'beat_0' | 'beat_1' | 'beat_2' | 'beat_3' | 'beat_4'
  | 'twist' | 'outro';

export const FPS = 60;
export const VIDEO_FRAMES = 2100; // 35s @ 60fps
export const SECTION_FRAMES: Record<SectionKey, [number, number]> = {
  hook:    [0,    180],
  context: [180,  180],
  beat_0:  [360,  240],
  beat_1:  [600,  240],
  beat_2:  [840,  240],
  beat_3:  [1080, 240],
  beat_4:  [1320, 240],
  twist:   [1560, 180],
  outro:   [1740, 360],
};

/** Convert milliseconds to frames at a given fps. */
export function msToFrames(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

export interface VideoManifest {
  channelId: ChannelId;
  topic: string;
  fps: typeof FPS;
  totalFrames: typeof VIDEO_FRAMES;
  totalSeconds: 35;
  script: Script;
  beats: ManifestBeat[];
  soundDesign: SoundEvent[];
  usedStockIds: string[];
  resolvedAssets: Record<string, PersonAsset | BrandAsset | PlaceAsset | DistanceAsset | StockAsset>;
  ctaText: string;
}

export interface ManifestBeat {
  beatIndex: number;
  beatId: string;
  sectionKey: SectionKey;
  startFrame: number;
  durationFrames: number;
  narration: string;
  visual: VisualTag;
  emphasis_keyword: string;
  morph_from: string | null;
  bg_color: string;
  captionsVisible: boolean;
  audioPath: string;
  wordBoundariesPath: string;
  // Populated after TTS stage:
  audio?: BeatAudio;
  // Populated after asset resolver stage:
  resolvedAsset?: PersonAsset | BrandAsset | PlaceAsset | DistanceAsset | StockAsset | null;
  // Populated after shot brief compilation stage:
  shotBrief?: import('./shotBrief').ShotBrief | null;
}

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  genre: string;
  voice: string;
  voiceRate: string;
  voicePitch: string;
  bodyFont: string;
  accentFont: string;
  colors: {
    bgPrimary: string;
    accent1: string;
    accent2: string;
    text: string;
    textMuted: string;
  };
  scriptTone: string;
  beatTypes: string[];
  musicMood: string;
  sfxProfile: string;
  uploadSchedule: string;
}
