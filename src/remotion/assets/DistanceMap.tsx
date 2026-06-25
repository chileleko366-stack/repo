/**
 * DistanceMap — OSM map image with an animated SVG line and frame-driven counter.
 *
 * Layout (1080×1920 canvas):
 *   0–960px   — OSM map image (1080×960 rendered by staticmap)
 *   960–1640px — distance counter + place labels
 *   1640–1920px — reserved for captions
 *
 * Animation timeline (relative to Sequence frame 0):
 *   0  – 60% of durationFrames : SVG line draws from → to via strokeDashoffset
 *   45% – 90% of durationFrames : counter counts up from 0 to distance value
 *   90% – 100%                  : to-marker pulses (driven by frame % 30)
 *
 * All values are pure functions of useCurrentFrame(). No CSS transitions.
 */

import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import type { DistanceAsset } from '../../pipeline/types';

const MAP_H = 960; // must match the height used in asset_resolver.py

export const DistanceMap: React.FC<{
  asset: DistanceAsset;
  durationFrames: number;
}> = ({ asset, durationFrames }) => {
  const frame = useCurrentFrame();

  // ── Line draw ────────────────────────────────────────────────────────
  const lineEnd   = Math.round(durationFrames * 0.6);
  const lineProgress = interpolate(frame, [0, lineEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const [fx, fy] = asset.from_px as [number, number];
  const [tx, ty] = asset.to_px as [number, number];
  const lineLen  = Math.hypot(tx - fx, ty - fy);
  const dashOffset = lineLen > 0 ? lineLen * (1 - lineProgress) : 0;

  // ── Counter ────────────────────────────────────────────────────────────
  const countStart = Math.round(durationFrames * 0.45);
  const countEnd   = Math.round(durationFrames * 0.9);

  // Parse numeric target and unit from distance_label ("4,572 km" / "2,840 miles")
  const labelClean = asset.distance_label.replace(/,/g, '');
  const labelParts = labelClean.split(' ');
  const numericTarget = parseFloat(labelParts[0]) || asset.distance_km;
  const unit = labelParts.slice(1).join(' ') || 'km';

  const countValue = interpolate(frame, [countStart, countEnd], [0, numericTarget], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ── To-marker pulse (only after line arrives) ────────────────────────────
  const pulseProgress = lineProgress > 0.98
    ? interpolate((frame % 30), [0, 15, 30], [1, 1.35, 1], { extrapolateRight: 'clamp' })
    : 0;

  const showMarkers = lineLen > 4; // suppress when from === to (plain map beat)
  const showCounter = asset.distance_km > 0;

  // Astronomical distances have no map image — render a full-frame counter only
  if (!asset.map_image) {
    return (
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
              marginBottom: 16,
            }}
          >
            {asset.from_place} → {asset.to_place}
          </div>
          <div
            style={{
              fontSize: 140,
              fontWeight: 900,
              color: '#ff4500',
              lineHeight: 1,
              fontFamily: 'monospace',
            }}
          >
            {Math.round(countValue).toLocaleString()}
          </div>
          <div style={{ fontSize: 44, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
            {unit}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* ── Map image ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1080,
          height: MAP_H,
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(asset.map_image.replace(/^public\//, ''))}
          style={{ width: 1080, height: MAP_H, objectFit: 'fill' }}
        />

        {/* SVG line + markers overlay */}
        {showMarkers && (
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: MAP_H }}
            viewBox={`0 0 1080 ${MAP_H}`}
          >
            {/* Glow stroke (wider, semi-transparent) */}
            <line
              x1={fx} y1={fy} x2={tx} y2={ty}
              stroke="rgba(255,23,68,0.35)"
              strokeWidth={10}
              strokeDasharray={lineLen}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
            {/* Main line */}
            <line
              x1={fx} y1={fy} x2={tx} y2={ty}
              stroke="#ff1744"
              strokeWidth={4}
              strokeDasharray={lineLen}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
            {/* From marker */}
            {lineProgress > 0.02 && (
              <circle cx={fx} cy={fy} r={9} fill="#ff1744" />
            )}
            {/* To marker with pulse */}
            {lineProgress > 0.95 && (
              <>
                <circle cx={tx} cy={ty} r={9 * pulseProgress} fill="rgba(255,23,68,0.35)" />
                <circle cx={tx} cy={ty} r={9} fill="#ff1744" />
              </>
            )}
          </svg>
        )}
      </div>

      {/* ── Distance info area ──────────────────────────────────────────────────── */}
      {showCounter && (
        <div
          style={{
            position: 'absolute',
            top: MAP_H + 40,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Place labels */}
          <div
            style={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 38,
              fontWeight: 600,
              textAlign: 'center',
              opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
            }}
          >
            {asset.from_place}
            {asset.to_place !== asset.from_place && ` → ${asset.to_place}`}
          </div>

          {/* Numeric counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <span
              style={{
                color: '#ff1744',
                fontSize: 96,
                fontWeight: 900,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {Math.round(countValue).toLocaleString()}
            </span>
            <span
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: 44,
                fontWeight: 600,
              }}
            >
              {unit}
            </span>
          </div>
        </div>
      )}

      {/* Plain map label (no distance) */}
      {!showCounter && asset.distance_label && (
        <div
          style={{
            position: 'absolute',
            top: MAP_H + 40,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.8)',
            fontSize: 52,
            fontWeight: 700,
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }}
        >
          {asset.distance_label}
        </div>
      )}
    </AbsoluteFill>
  );
};
