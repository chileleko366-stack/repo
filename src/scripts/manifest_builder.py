"""
Manifest builder - converts a validated script into a VideoManifest.

35-second video timing layout (at 30fps = 1050 frames):
  hook:     frames   0 -  89  (3s)
  context:  frames  90 - 179  (3s)
  beat 0:   frames 180 - 299  (4s)
  beat 1:   frames 300 - 419  (4s)
  beat 2:   frames 420 - 539  (4s)
  beat 3:   frames 540 - 659  (4s)
  beat 4:   frames 660 - 779  (4s)
  twist:    frames 780 - 869  (3s)
  outro:    frames 870 - 1049 (6s)
  Total:    1050 frames = 35.0s
"""

import json
import re
from pathlib import Path


FPS = 30
VIDEO_FRAMES = 1050

SECTION_FRAMES = {
    "hook":    (0,    90),
    "context": (90,   90),
    "beat_0":  (180, 120),
    "beat_1":  (300, 120),
    "beat_2":  (420, 120),
    "beat_3":  (540, 120),
    "beat_4":  (660, 120),
    "twist":   (780,  90),
    "outro":   (870, 180),
}

ASSET_BEAT_KINDS = {"person", "brand", "product", "place", "distance",
                    "map", "anatomy", "celestial", "app"}


def captions_visible(beat_kind: str) -> bool:
    return beat_kind not in ASSET_BEAT_KINDS


# ── Channel config loader ─────────────────────────────────────────────────────

def _load_channel_cfg(channel_id: str) -> dict:
    cfg_path = Path("configs/channels") / f"{channel_id}.json"
    if cfg_path.exists():
        with open(cfg_path) as f:
            return json.load(f)
    return {"name": "Dopamine Studios", "genre": "interesting facts"}


# ── Title / description / tags generators ─────────────────────────────────────

def _generate_title(script: dict) -> str:
    """First sentence of hook, truncated to 90 chars."""
    hook = script.get("hook", "").strip()
    sentence = re.split(r"(?<=[.!?])\s", hook)[0].strip()
    if len(sentence) > 90:
        sentence = sentence[:87] + "..."
    return sentence or script.get("topic", "Interesting Fact")


_STOP = {"this", "that", "with", "from", "have", "they", "your", "been",
         "their", "when", "will", "what", "which", "than", "then"}


def _extract_tag_words(topic: str, genre: str) -> list:
    base = ["shorts", "youtubeshorts", "learnontiktok"]
    topic_words = [w for w in re.findall(r"\b[a-z]{4,}\b", topic.lower())
                   if w not in _STOP]
    genre_words = [w for w in re.findall(r"\b[a-z]{4,}\b", genre.lower())
                   if w not in _STOP]
    seen = set(base)
    result = list(base)
    for w in topic_words[:5] + genre_words[:3]:
        if w not in seen:
            seen.add(w)
            result.append(w)
    return result[:15]


def _generate_tags(script: dict, channel_cfg: dict) -> list:
    return _extract_tag_words(
        script.get("topic", ""),
        channel_cfg.get("genre", ""),
    )


def _generate_description(script: dict, channel_cfg: dict) -> str:
    channel_name = channel_cfg.get("name", "Dopamine Studios")
    genre        = channel_cfg.get("genre", "")
    hook         = script.get("hook", "")
    cta          = script.get("outro", {}).get("cta", "Follow for daily videos.")
    tag_words    = _extract_tag_words(script.get("topic", ""), genre)
    hashtags     = " ".join(f"#{w}" for w in tag_words)

    parts = [
        hook,
        "",
        f"{channel_name} • {genre.title()}",
        "",
        cta,
        "",
        hashtags,
    ]
    return "\n".join(parts)


# ── Core builder ────────────────────────────────────────────────────────────────

def build_manifest(script: dict, channel_id: str) -> dict:
    channel_cfg = _load_channel_cfg(channel_id)
    beats_out = []

    def add_beat(section_key, beat_id, narration, visual, emphasis_keyword, morph_from, bg_color):
        start, dur = SECTION_FRAMES[section_key]
        beats_out.append({
            "beatIndex": len(beats_out),
            "beatId": beat_id,
            "sectionKey": section_key,
            "startFrame": start,
            "durationFrames": dur,
            "narration": narration,
            "visual": visual,
            "emphasis_keyword": emphasis_keyword,
            "morph_from": morph_from,
            "bg_color": bg_color,
            "captionsVisible": captions_visible(visual.get("kind", "none")),
            "audioPath": f"public/audio/{beat_id}.mp3",
            "wordBoundariesPath": f"public/audio/{beat_id}_words.json",
        })

    add_beat("hook", f"{channel_id}_hook",
             narration=script.get("hook", ""),
             visual={"kind": "none"},
             emphasis_keyword=_first_noun(script.get("hook", "")),
             morph_from=None,
             bg_color=_channel_bg(channel_id))

    add_beat("context", f"{channel_id}_context",
             narration=script.get("context", ""),
             visual={"kind": "none"},
             emphasis_keyword=_first_noun(script.get("context", "")),
             morph_from=_first_noun(script.get("hook", "")),
             bg_color=_channel_bg(channel_id))

    prev_keyword = _first_noun(script.get("context", ""))
    for i, beat in enumerate(script.get("beats", [])[:5]):
        section_key = f"beat_{i}"
        beat_id = f"{channel_id}_beat_{i}"
        add_beat(section_key, beat_id,
                 narration=beat.get("narration", ""),
                 visual=beat.get("visual", {"kind": "none"}),
                 emphasis_keyword=beat.get("emphasis_keyword", _first_noun(beat.get("narration", ""))),
                 morph_from=beat.get("morph_from") or prev_keyword,
                 bg_color=beat.get("bg_color", _channel_bg(channel_id)))
        prev_keyword = beat.get("emphasis_keyword") or prev_keyword

    add_beat("twist", f"{channel_id}_twist",
             narration=script.get("twist", ""),
             visual={"kind": "none"},
             emphasis_keyword=_first_noun(script.get("twist", "")),
             morph_from=prev_keyword,
             bg_color=_channel_bg(channel_id))

    outro = script.get("outro", {})
    add_beat("outro", f"{channel_id}_outro",
             narration=outro.get("narration", ""),
             visual=outro.get("visual", {"kind": "stat"}),
             emphasis_keyword=_first_noun(outro.get("narration", "")),
             morph_from=_first_noun(script.get("twist", "")),
             bg_color=_channel_bg(channel_id))

    sound_design = [{
        "id": "sfx_hook_enter",
        "name": "element_entrance",
        "startFrame": 0,
        "durationFrames": 8,
        "volume": 0.5,
    }]
    for b in beats_out:
        if b["sectionKey"].startswith("beat_"):
            sound_design.append({
                "id": f"sfx_{b['beatId']}_enter",
                "name": "beat_transition",
                "startFrame": b["startFrame"],
                "durationFrames": 6,
                "volume": 0.4,
            })

    return {
        "channelId":    channel_id,
        "topic":        script.get("topic", ""),
        "title":        _generate_title(script),
        "description":  _generate_description(script, channel_cfg),
        "tags":         _generate_tags(script, channel_cfg),
        "fps":          FPS,
        "totalFrames":  VIDEO_FRAMES,
        "totalSeconds": VIDEO_FRAMES / FPS,
        "script":       script,
        "beats":        beats_out,
        "soundDesign":  sound_design,
        "usedStockIds": [],
        "resolvedAssets": {},
        "ctaText":      script.get("outro", {}).get("cta", ""),
    }


def save_manifest(manifest: dict, out_path) -> None:
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[manifest] saved to {out_path}")


_CHANNEL_BG = {
    "ch1": "#16121f",
    "ch2": "#0b0d10",
    "ch3": "#000000",
    "ch4": "#12161b",
    "ch5": "#14110d",
    "ch6": "#05060a",
}


def _channel_bg(channel_id: str) -> str:
    return _CHANNEL_BG.get(channel_id, "#0d0d0d")


def _first_noun(text: str) -> str:
    caps = re.findall(r"\b[A-Z][a-z]{2,}\b", text)
    if caps:
        return caps[0].lower()
    words = [w for w in text.split() if len(w) > 3 and w.isalpha()]
    return words[0].lower() if words else "fact"


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: manifest_builder.py <script.json> [channel_id]")
        sys.exit(1)
    with open(sys.argv[1]) as f:
        script = json.load(f)
    channel_id = sys.argv[2] if len(sys.argv) > 2 else script.get("channel_id", "ch1")
    manifest = build_manifest(script, channel_id)
    out = Path("out") / channel_id / "manifest.json"
    save_manifest(manifest, out)
    print(json.dumps(manifest, indent=2))
