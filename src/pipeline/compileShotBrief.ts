// Session 2.5 — Shot Brief compiler
// Turns a script beat into a complete ShotBrief via a constrained Groq call.
// This step makes STAGING decisions only — it never invents facts.

import type { ManifestBeat, ChannelConfig } from './types';
import type { ShotBrief, CompositionGrid } from './shotBrief';
import { validateShotBrief } from './shotBrief';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface CompileOptions {
  beat: ManifestBeat;
  channel: ChannelConfig;
  recentGrids?: CompositionGrid[];
  assetMetadata?: {
    width?: number;
    height?: number;
    focalPointXPct?: number;
    focalPointYPct?: number;
  } | null;
}

const SYSTEM_PROMPT = `You are a motion graphics cinematographer producing Shot Briefs for a Remotion render pipeline.
Given a script beat, produce a complete ShotBrief JSON following the schema exactly.
You are making STAGING decisions only — composition, depth, motion, gradient placement for glow/sheen effects.
You are not inventing factual content; narration and entity values are fixed inputs.

HARD RULES:
1. background.type is ALWAYS "solid" — gradients are NEVER used for the full-frame background.
2. Gradients ARE required somewhere in depth.glowEffects — every ShotBrief needs visual depth. Use radial gradients for glow/atmosphere, linear for surface sheen. Always explicit color stops and opacity values.
3. Every element that appears must have a motion entry (even a simple opacity 0→1). Nothing is static at mount.
4. composition.primaryAnchor must have explicit xPct/yPct/widthPct/heightPct numbers — convert conceptual positions to percentages.
5. Vary composition.grid based on the previous grids provided — never the same grid 3 times in a row.
6. At least 1 dropShadow entry is required in depth.dropShadows.
7. motion entries: if kind==="spring", springConfig is required. If kind==="interpolate", easing is required.
8. Return ONLY valid JSON — no markdown fences, no explanations.`;

function buildUserPrompt(opts: CompileOptions): string {
  const { beat, channel, recentGrids, assetMetadata } = opts;

  return `Beat JSON:
${JSON.stringify({
  beatId: beat.beatId,
  narration: beat.narration,
  visual: beat.visual,
  emphasis_keyword: beat.emphasis_keyword,
  sectionKey: beat.sectionKey,
}, null, 2)}

Channel design tokens:
${JSON.stringify({
  colors: channel.colors,
  bodyFont: channel.bodyFont,
  accentFont: channel.accentFont,
  id: channel.id,
}, null, 2)}

Previous 3 beats' composition.grid choices: ${JSON.stringify(recentGrids ?? [])}

Resolved asset metadata (null if none): ${JSON.stringify(assetMetadata ?? null)}

Available composition.grid values: "center" | "thirds-upper" | "thirds-lower" | "left-weighted" | "right-weighted" | "full-bleed"
Available motion.property values: "translateX" | "translateY" | "scale" | "rotateDeg" | "opacity" | "clipPathInsetPct" | "strokeDashoffset"
Available easing values: "easeOutCubic" | "easeInOutCubic" | "easeOutExpo" | "linear"

ShotBrief schema:
{
  "beatId": string,
  "channelId": string,
  "composition": {
    "grid": CompositionGrid,
    "primaryAnchor": { "xPct": number, "yPct": number, "widthPct": number, "heightPct": number },
    "secondaryElements": [{ "role": string, "anchor": { "xPct": number, "yPct": number, "widthPct"?: number, "heightPct"?: number }, "zIndex": number }],
    "safeZones": { "topReservedPx": number, "bottomReservedPx": number }
  },
  "background": { "type": "solid", "color": string, "changesAtThisBeat": boolean },
  "depth": {
    "dropShadows": [{ "onElementRole": string, "offsetX": number, "offsetY": number, "blurPx": number, "color": string, "opacity": number }],
    "glowEffects": [{ "onElementRole": string, "gradient": { "kind": "radial"|"linear", "angleDeg"?: number, "stops": [{ "offsetPct": number, "color": string, "opacity": number }] } }]
  },
  "typography": [{ "role": string, "text": string, "font": "body"|"accent", "sizePx": number, "weight": number, "letterSpacingEm": number, "lineHeight": number, "color": string }],
  "motion": [{ "elementRole": string, "kind": "spring"|"interpolate", "property": string, "from": number, "to": number, "startFrame": number, "durationFrames": number, "springConfig"?: {...}, "easing"?: string }],
  "primitive": string,
  "fallbackPrimitive": "TypographicCard"
}

Return ONLY the ShotBrief JSON object.`;
}

export async function compileShotBrief(opts: CompileOptions): Promise<ShotBrief> {
  const apiKey = process.env['GROQ_API_KEY'];
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(opts) },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq compileShotBrief failed ${response.status}: ${body}`);
  }

  const json = await response.json() as { choices: Array<{ message: { content: string } }> };
  const raw = json.choices[0]?.message?.content ?? '';
  const brief: ShotBrief = JSON.parse(raw);

  validateShotBrief(brief, opts.recentGrids ?? []);
  return brief;
}
