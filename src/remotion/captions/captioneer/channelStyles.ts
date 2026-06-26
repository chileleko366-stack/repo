export type ChannelCaptionStyle =
  | 'WordHighlight'
  | 'Karaoke'
  | 'Glow'
  | 'Bounce'
  | 'Typewriter'
  | 'Flicker'
  | 'Highlighter'
  | 'Scale'
  | 'Wave';

export const CHANNEL_CAPTION_STYLE: Record<string, ChannelCaptionStyle> = {
  ch1: 'Scale',       // Dopamine Loop — words grow in, punchy psychology feel
  ch2: 'Typewriter',  // FinanceFiction — monospace terminal, cursorColor = #00ff88
  ch3: 'Flicker',     // Redacted — neon flicker like a broken sign, flickerColor = #cc0000
  ch4: 'Glow',        // Grey Matter — scientific glow, glowColor = #e94560
  ch5: 'Wave',        // Quiet Record — measured wave, waveColor = #c8a96e
  ch6: 'Karaoke',     // Red Space Facts — fill left-to-right, fillColor = #ff4500
};

export const CHANNEL_CAPTION_PROPS: Record<string, Record<string, unknown>> = {
  ch1: { scaleColor: '#d400ff', fontColor: 'rgba(255,255,255,0.35)', maxScale: 1.35 },
  ch2: { cursorColor: '#00ff88', fontColor: '#e8e8e8', fontSize: 46 },
  ch3: { flickerColor: '#cc0000', fontColor: 'rgba(224,224,224,0.3)', fontSize: 48 },
  ch4: { glowColor: '#e94560', glowIntensity: 28, fontColor: 'rgba(240,240,240,0.3)' },
  ch5: { waveColor: '#c8a96e', fontColor: 'rgba(245,240,232,0.35)', waveHeight: 20 },
  ch6: { fillColor: '#ff4500', baseColor: 'rgba(232,240,255,0.3)', fontSize: 44 },
};
