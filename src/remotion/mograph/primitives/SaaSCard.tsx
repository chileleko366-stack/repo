import React from 'react';
import { useCurrentFrame, useVideoConfig, spring } from 'remotion';

interface SaaSCardProps {
  primary?: string;
  label?: string;
  body?: string;
  accentColor?: string;
}

export const SaaSCard: React.FC<SaaSCardProps> = ({
  primary = '',
  label,
  body,
  accentColor = '#4f46e5',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 120, mass: 0.8 }, from: 0.85, to: 1 });
  const opacity = spring({ frame, fps, config: { damping: 20, stiffness: 180 }, from: 0, to: 1 });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        padding: '48px 52px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        transform: `scale(${scale})`,
        opacity,
        maxWidth: '85%',
        width: '100%',
        position: 'relative',
      }}>
        {label && (
          <div style={{
            fontSize: 28,
            fontWeight: 600,
            color: accentColor,
            marginBottom: 12,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {label}
          </div>
        )}
        <div style={{
          fontSize: 72,
          fontWeight: 700,
          color: '#111827',
          lineHeight: 1.1,
          marginBottom: body ? 20 : 0,
        }}>
          {primary}
        </div>
        {body && (
          <div style={{
            fontSize: 36,
            color: '#6b7280',
            lineHeight: 1.4,
            fontWeight: 400,
          }}>
            {body}
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          borderRadius: '0 0 24px 24px',
        }} />
      </div>
    </div>
  );
};
