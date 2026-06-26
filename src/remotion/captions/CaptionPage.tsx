import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { TikTokPage } from '@remotion/captions';

export interface CaptionPageProps {
  page: TikTokPage;
  enterProgress: number;
  accentColor: string;
  accentFont: string;
  bodyFont: string;
  channelId: string;
}

interface CaptionStyle {
  fontSize: number;
  fontWeight: number;
  textTransform: 'uppercase' | 'none' | 'capitalize';
  letterSpacing: string;
  lineHeight: number;
  activeColor: string;
  inactiveOpacity: number;
  textShadow: string;
  activeScale: number;
  activeTransition: string;
  paddingBottom: number;
  maxWidth: number;
  wordSpacing: string;
}

function getChannelStyle(channelId: string, accentColor: string): CaptionStyle {
  switch (channelId) {
    case 'ch1':
      return {
        fontSize: 52,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        lineHeight: 1.15,
        activeColor: accentColor,
        inactiveOpacity: 0.45,
        textShadow: `0 2px 20px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.8)`,
        activeScale: 1.12,
        activeTransition: 'transform 60ms ease-out, color 60ms ease-out',
        paddingBottom: 220,
        maxWidth: 880,
        wordSpacing: '0.08em',
      };

    case 'ch2':
      return {
        fontSize: 46,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        lineHeight: 1.2,
        activeColor: accentColor,
        inactiveOpacity: 0.35,
        textShadow: `0 0 30px ${accentColor}40, 0 2px 16px rgba(0,0,0,0.95)`,
        activeScale: 1.0,
        activeTransition: 'color 40ms linear',
        paddingBottom: 200,
        maxWidth: 920,
        wordSpacing: '0.04em',
      };

    case 'ch3':
      return {
        fontSize: 50,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 1.1,
        activeColor: '#ff2020',
        inactiveOpacity: 0.5,
        textShadow: `0 2px 24px rgba(0,0,0,0.98)`,
        activeScale: 1.08,
        activeTransition: 'transform 30ms ease-out, color 30ms ease-out, text-shadow 30ms ease-out',
        paddingBottom: 200,
        maxWidth: 860,
        wordSpacing: '0.1em',
      };

    case 'ch4':
      return {
        fontSize: 48,
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.01em',
        lineHeight: 1.3,
        activeColor: accentColor,
        inactiveOpacity: 0.4,
        textShadow: `0 2px 20px rgba(0,0,0,0.95)`,
        activeScale: 1.06,
        activeTransition: 'transform 80ms ease-out, color 80ms ease-out',
        paddingBottom: 210,
        maxWidth: 900,
        wordSpacing: '0.05em',
      };

    case 'ch5':
      return {
        fontSize: 46,
        fontWeight: 500,
        textTransform: 'none',
        letterSpacing: '0.02em',
        lineHeight: 1.35,
        activeColor: '#c8a96e',
        inactiveOpacity: 0.45,
        textShadow: `0 2px 24px rgba(0,0,0,0.9)`,
        activeScale: 1.04,
        activeTransition: 'transform 100ms ease-out, color 100ms ease-out',
        paddingBottom: 215,
        maxWidth: 880,
        wordSpacing: '0.03em',
      };

    case 'ch6':
      return {
        fontSize: 44,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        lineHeight: 1.15,
        activeColor: '#ff4500',
        inactiveOpacity: 0.35,
        textShadow: `0 0 20px ${accentColor}60, 0 2px 20px rgba(0,0,0,0.95)`,
        activeScale: 1.1,
        activeTransition: 'transform 50ms ease-out, color 50ms ease-out, text-shadow 50ms ease',
        paddingBottom: 205,
        maxWidth: 900,
        wordSpacing: '0.06em',
      };

    default:
      return {
        fontSize: 48,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        lineHeight: 1.2,
        activeColor: accentColor,
        inactiveOpacity: 0.45,
        textShadow: `0 2px 16px rgba(0,0,0,0.95)`,
        activeScale: 1.08,
        activeTransition: 'transform 60ms ease-out, color 60ms ease-out',
        paddingBottom: 200,
        maxWidth: 880,
        wordSpacing: '0.05em',
      };
  }
}

export const CaptionPage: React.FC<CaptionPageProps> = ({
  page,
  bodyFont,
  accentColor,
  channelId,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentMs = (frame / fps) * 1000 + page.startMs;
  const style = getChannelStyle(channelId, accentColor);

  const ch3ActiveShadow =
    '0 0 12px rgba(255,20,20,0.9), 0 0 30px rgba(255,0,0,0.5), 0 2px 24px rgba(0,0,0,0.98)';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: style.paddingBottom,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: style.maxWidth,
          textAlign: 'center',
          fontFamily: bodyFont,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          textTransform: style.textTransform as React.CSSProperties['textTransform'],
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
          wordSpacing: style.wordSpacing,
          color: '#ffffff',
          textShadow: style.textShadow,
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive = token.fromMs <= currentMs && token.toMs > currentMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{
                whiteSpace: 'pre',
                display: 'inline-block',
                color: isActive
                  ? style.activeColor
                  : `rgba(255,255,255,${style.inactiveOpacity})`,
                transform: isActive ? `scale(${style.activeScale})` : 'scale(1)',
                transformOrigin: 'center bottom',
                transition: style.activeTransition,
                textShadow:
                  isActive && channelId === 'ch3' ? ch3ActiveShadow : 'inherit',
                filter:
                  isActive && channelId === 'ch6'
                    ? `drop-shadow(0 0 8px ${accentColor})`
                    : 'none',
              }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
