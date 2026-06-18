import fs from 'fs';
import path from 'path';
import type { ChannelConfig, ChannelId } from './types.js';

const CHANNEL_IDS: ChannelId[] = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6'];

function loadChannelConfig(id: ChannelId): ChannelConfig {
  const configPath = path.resolve(process.cwd(), 'configs', 'channels', `${id}.json`);
  if (!fs.existsSync(configPath)) {
    throw new Error(`Channel config not found: ${configPath}`);
  }
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  validateConfig(raw, id);
  return raw as ChannelConfig;
}

function validateConfig(config: unknown, id: ChannelId): void {
  const c = config as Record<string, unknown>;
  const required: (keyof ChannelConfig)[] = [
    'id', 'name', 'genre', 'voice', 'voiceRate', 'voicePitch',
    'bodyFont', 'accentFont', 'colors', 'scriptTone', 'beatTypes',
    'musicMood', 'sfxProfile', 'uploadSchedule',
  ];
  for (const key of required) {
    if (c[key] === undefined || c[key] === null || c[key] === '') {
      throw new Error(`Channel config ${id} missing required field: ${key}`);
    }
  }
  if (c['id'] !== id) {
    throw new Error(`Channel config id mismatch: file says "${c['id']}" but expected "${id}"`);
  }
  const colors = c['colors'] as Record<string, unknown>;
  for (const colorKey of ['bgPrimary', 'accent1', 'accent2', 'text', 'textMuted']) {
    if (!colors?.[colorKey]) {
      throw new Error(`Channel config ${id} missing colors.${colorKey}`);
    }
  }
}

function loadAllChannelConfigs(): Map<ChannelId, ChannelConfig> {
  const map = new Map<ChannelId, ChannelConfig>();
  for (const id of CHANNEL_IDS) {
    try {
      map.set(id, loadChannelConfig(id));
    } catch (err) {
      console.warn(`[channelConfig] Could not load ${id}:`, (err as Error).message);
    }
  }
  return map;
}

export const CHANNEL_CONFIG: Map<ChannelId, ChannelConfig> = loadAllChannelConfigs();

export function getChannelConfig(id: ChannelId): ChannelConfig {
  const config = CHANNEL_CONFIG.get(id);
  if (!config) {
    throw new Error(`No loaded config for channel "${id}". Check configs/channels/${id}.json exists.`);
  }
  return config;
}

export { CHANNEL_IDS };
export type { ChannelConfig, ChannelId };
