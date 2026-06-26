import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface Props { accentColor: string; backgroundColor: string; }

const CONTINENTS = `M 180,280 C 160,260 140,270 135,290 C 130,310 150,330 170,325 C 185,320 200,300 180,280 Z
M 220,260 C 215,240 230,220 250,225 C 270,230 275,250 265,265 C 255,280 225,280 220,260 Z
M 310,310 C 305,290 325,275 345,280 C 365,285 370,305 360,320 C 350,335 315,330 310,310 Z
M 420,250 C 410,225 435,205 460,215 C 485,225 490,255 475,270 C 460,285 430,275 420,250 Z
M 500,340 C 490,315 515,295 545,305 C 575,315 580,345 560,360 C 540,375 510,365 500,340 Z
M 160,400 C 150,375 170,355 195,360 C 220,365 225,395 210,410 C 195,425 170,425 160,400 Z`;

export const GlobeSpinner: React.FC<Props> = ({ accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const rotY = frame * 0.4;
  const rotX = Math.sin(frame * 0.008) * 15;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity,
    }}>
      <div style={{ perspective: 800 }}>
        <div style={{
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle at 38% 33%, rgba(255,255,255,0.14), ${accentColor}44 25%, ${backgroundColor} 75%)`,
          boxShadow: `0 0 120px ${accentColor}44, inset 0 0 60px rgba(0,0,0,0.6)`,
          transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)`,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <svg
            viewBox="0 0 700 700"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              opacity: 0.6,
            }}
          >
            <g stroke={accentColor} strokeWidth="1.5" fill="none" opacity="0.8">
              <path d={CONTINENTS} />
              {/* Latitude lines */}
              {[175, 245, 315, 385, 455, 525].map((y) => (
                <ellipse key={y} cx={350} cy={y} rx={280} ry={20} strokeDasharray="6 4" opacity={0.3} />
              ))}
            </g>
          </svg>
        </div>
        {/* Atmosphere ring */}
        <div style={{
          position: 'absolute',
          top: -30, left: -30, right: -30, bottom: -30,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, transparent 48%, ${accentColor}22 60%, transparent 70%)`,
          filter: 'blur(20px)',
          mixBlendMode: 'screen',
        }} />
      </div>
    </div>
  );
};
