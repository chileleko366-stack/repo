// SaaS design tokens sourced from the skill files in remotion-dev/template-prompt-to-motion-graphics-saas.
// spring configs: src/skills/spring-physics.md (Common Spring Presets section)
// glass treatment: src/skills/social-media.md + observed template aesthetic defaults
// pill + spacing: src/skills/social-media.md safe-zone + mobile-first sizing patterns

export const SAAS_BASE = {
  glass: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px) saturate(1.6)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
  springs: {
    // damping/stiffness/mass values from spring-physics.md "Common Spring Presets"
    snappy: { damping: 20, stiffness: 200, mass: 0.8 },
    smooth: { damping: 200, stiffness: 100, mass: 1.0 },
    bouncy: { damping: 8,  stiffness: 150, mass: 0.6 },
    heavy:  { damping: 15, stiffness: 80,  mass: 2.0 },
  },
  pill: {
    height: 30,
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.07)',
  },
  safeZone: {
    // from social-media.md: 12% top, 15% bottom, 5% sides (in 1080×1920)
    topPx: 230,    // 1920 * 0.12
    bottomPx: 288, // 1920 * 0.15
    sidePx: 54,    // 1080 * 0.05
  },
  typography: {
    // from social-media.md: minimum 48px headline, 28px body on mobile
    titleSize: 80,
    subtitleSize: 56,
    bodySize: 40,
    captionSize: 28,
    minHeadline: 48,
  },
} as const;
