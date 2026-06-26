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
  ch1: 'WordHighlight', // Dopamine Loop — word-by-word pop, accent purple
  ch2: 'Scale',         // FinanceFiction — punchy scale-in, accent green
  ch3: 'Flicker',       // Redacted — neon flicker like broken sign, red
  ch4: 'Glow',          // Grey Matter — scientific neon glow, red-pink
  ch5: 'Wave',          // Quiet Record — measured wave, warm gold
  ch6: 'Karaoke',       // Red Space Facts — fill left-to-right, orange-red
};

export const CHANNEL_CAPTION_PROPS: Record<string, Record<string, unknown>> = {
  ch1: { highlightColor: '#d400ff', fontColor: 'rgba(255,255,255,0.4)' },
  ch2: { scaleColor: '#00ff88', maxScale: 1.25, fontColor: 'rgba(255,255,255,0.4)' },
  ch3: { flickerColor: '#cc0000', fontColor: 'rgba(255,255,255,0.4)' },
  ch4: { glowColor: '#e94560', glowIntensity: 22, fontColor: 'rgba(255,255,255,0.4)' },
  ch5: { waveColor: '#c8a96e', waveHeight: 18, fontColor: 'rgba(255,255,255,0.4)' },
  ch6: { fillColor: '#ff4500', fontColor: 'rgba(255,255,255,0.4)' },
};
