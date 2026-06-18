export type ChannelId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6';

export type BeatKind =
  | 'person'
  | 'brand'
  | 'product'
  | 'place'
  | 'distance'
  | 'map'
  | 'anatomy'
  | 'celestial'
  | 'stat'
  | 'stock_video'
  | 'none';

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

export interface VideoManifest {
  channelId: ChannelId;
  topic: string;
  script: Script;
  beats: ManifestBeat[];
  totalFrames: number;
  fps: number;
  soundDesign: SoundEvent[];
  usedStockIds: string[];
}

export interface ManifestBeat {
  beatIndex: number;
  beatId: string;
  startFrame: number;
  durationFrames: number;
  narration: string;
  visual: VisualTag;
  emphasis_keyword: string;
  morph_from: string | null;
  bg_color: string;
  audio: BeatAudio;
  resolvedAsset?: PersonAsset | BrandAsset | PlaceAsset | DistanceAsset | StockAsset | null;
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
