import { ShotBrief } from './types';

export type { ShotBrief };

export const DEFAULT_SHOT_BRIEF: ShotBrief = {
  primitive: 'TextKinetic',
  position: { x: 0, y: 0, anchorX: 'center', anchorY: 'center' },
  scale: 1.0,
  depth: {
    zIndex: 0,
    dropShadows: [
      { offsetX: 0, offsetY: 8, blurPx: 32, color: '#000000', opacity: 0.4 },
    ],
  },
  motion: { entrance: 'spring_up', idle: 'float', exit: 'fade' },
};
