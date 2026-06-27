export type ChannelId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6';

export type BeatKind =
  | 'person' | 'brand' | 'place' | 'distance' | 'map'
  | 'anatomy' | 'celestial' | 'stat' | 'chart' | 'typography' | 'none';

export type SectionKey =
  | 'hook' | 'context' | 'beat_0' | 'beat_1' | 'beat_2'
  | 'beat_3' | 'beat_4' | 'twist' | 'outro';

export type PauseAfter = 'breath' | 'beat' | 'cut';

export type EntranceMotion =
  | 'spring_up' | 'spring_down' | 'spring_left' | 'spring_right'
  | 'fade' | 'scale' | 'none';

export type IdleMotion = 'float' | 'pulse' | 'rotate' | 'none';
export type ExitMotion = 'fade' | 'scale_out' | 'slide_up' | 'none';

export interface VisualTag {
  kind: BeatKind;
  value?: string;
  from?: string;
  to?: string;
  unit?: string;
  place?: string;
  zoom?: number;
  stat_value?: number;
  prefix?: string;
  suffix?: string;
}

export interface WordBoundary {
  word: string;
  startMs: number;
  durationMs: number;
  endMs: number;
}

export interface ResolvedAsset {
  type: BeatKind;
  url: string;
  localPath: string;
  width?: number;
  height?: number;
  attribution?: string;
}

export interface ShotDepth {
  zIndex: number;
  dropShadows: Array<{
    offsetX: number;
    offsetY: number;
    blurPx: number;
    color: string;
    opacity: number;
  }>;
}

export interface ShotGlow {
  color: string;
  radius: number;
  opacity: number;
}

export interface ShotMotion {
  entrance: EntranceMotion;
  idle: IdleMotion;
  exit: ExitMotion;
}

export interface ShotBrief {
  primitive: string;
  position: {
    x: number;
    y: number;
    anchorX: 'left' | 'center' | 'right';
    anchorY: 'top' | 'center' | 'bottom';
  };
  scale: number;
  depth: ShotDepth;
  glow?: ShotGlow;
  motion: ShotMotion;
  props?: Record<string, unknown>;
}

export interface SfxEvent {
  sfxKey: string;
  frame: number;
  volume: number;
}

export interface Beat {
  beatId: string;
  sectionKey: SectionKey;
  narration: string;
  visual: VisualTag;
  emphasis_keyword: string;
  pause_after: PauseAfter;
  bg_color: string;
  startFrame: number;
  durationFrames: number;
  audioPath?: string;
  wordBoundariesPath?: string;
  wordBoundaries?: WordBoundary[];
  durationMs?: number;
  resolvedAsset?: ResolvedAsset | null;
  shotBrief?: ShotBrief;
  sfxEvents?: SfxEvent[];
}

export interface VideoManifest {
  channelId: ChannelId;
  topic: string;
  fps: 60;
  totalFrames: 2100;
  durationSec: 35.0;
  beats: Beat[];
  generatedAt: string;
}

export interface ChannelColors {
  bgPrimary: string;
  accent1: string;
  accent2: string;
  text: string;
  textMuted: string;
}

export interface ChannelConfig {
  id: ChannelId;
  name: string;
  genre: string;
  accentColor: string;
  bgColor: string;
  fontHeading: string;
  fontBody: string;
  voice: string;
  voiceRate: string;
  voicePitch: string;
  scriptTone: string;
  musicMood: string;
  sfxProfile: string;
  colors: ChannelColors;
}
