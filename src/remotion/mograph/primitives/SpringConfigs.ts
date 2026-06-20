// Spring configuration constants ported from:
// /tmp/refs/saas-engine/src/skills/spring-physics.md — "Common Spring Presets" section

export const SPRING_CONFIGS = {
  /** UI elements — minimal bounce */
  snappy: { damping: 20, stiffness: 200 },
  /** Playful entrances */
  bouncy: { damping: 8, stiffness: 100 },
  /** Subtle reveals — no bounce */
  smooth: { damping: 200, stiffness: 100 },
  /** Large objects with inertia */
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  /** Word-level text stagger */
  text: { damping: 18, stiffness: 140, mass: 0.9 },
  /** Card pop-in */
  card: { damping: 18, stiffness: 200 },
  /** Tight snap (badges, pills) */
  snap: { damping: 14, stiffness: 280, mass: 0.8 },
} as const;
