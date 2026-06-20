/**
 * AnimatedIcon — renders a Lottie JSON animation from public/lottie/.
 *
 * Icons are sourced from useanimations.com / LottieFiles (MIT/Feather-based).
 * Files live in public/lottie/ as committed JSON assets — no network fetch at
 * render time. Use staticFile() so Remotion bundles them correctly.
 *
 * Available icon names (must match filenames in public/lottie/):
 *   chart-up | chart-down | brain-idea | lock-security | globe-world |
 *   alert-warning | checkmark-success | clock-time
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export type IconName =
  | 'chart-up'
  | 'chart-down'
  | 'brain-idea'
  | 'lock-security'
  | 'globe-world'
  | 'alert-warning'
  | 'checkmark-success'
  | 'clock-time';

interface AnimatedIconProps {
  icon: IconName;
  size?: number;
  color?: string;
  /** Frame offset within the parent Sequence before the icon appears */
  delayFrames?: number;
  /** Whether to loop the Lottie animation */
  loop?: boolean;
  backgroundColor?: string;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  size = 200,
  delayFrames = 0,
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { stiffness: 520, damping: 32 },
    durationInFrames: 36,
  });

  const scale   = interpolate(enter, [0, 1], [0.72, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = interpolate(enter, [0, 0.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Load @remotion/lottie lazily to avoid hard build failures before install.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let LottieEl: React.ReactElement | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Lottie } = require('@remotion/lottie') as { Lottie: React.FC<{ animationData: unknown; loop?: boolean; style?: React.CSSProperties }> };
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const animationData = require(`../../../../public/lottie/${icon}.json`) as unknown;
    LottieEl = <Lottie animationData={animationData} loop={false} style={{ width: size, height: size }} />;
  } catch {
    // Package or file unavailable — placeholder rendered below
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {LottieEl ?? (
          // Placeholder when @remotion/lottie or file is unavailable
          <div
            style={{
              width: size,
              height: size,
              border: '3px dashed rgba(255,255,255,0.3)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
