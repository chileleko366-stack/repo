"""
Stock media selector — Pexels + Pixabay with no-repeat enforcement.

For each beat where visual.kind == 'stock_video':
  1. Use beat.visual.query if present; else extract keywords from narration
  2. Search Pexels Videos API (portrait-preferred), fall back to Pixabay Videos
  3. Download best match → public/stock/{beat_id}.mp4
  4. For photo fallback: Pexels Photos → Pixabay Images → JPEG

No-repeat rule: each (source:id) pair is tracked in manifest['usedStockIds'].
The same asset is never used twice within one video.

Env vars required:
  PEXELS_API_KEY   — https://www.pexels.com/api/
  PIXABAY_API_KEY  — https://pixabay.com/api/docs/
"""

import asyncio
import os
import re
from pathlib import Path

import aiohttp

STOCK_DIR = Path("public/stock")
UA = {"User-Agent": "DopamineStudios/1.0 (contact@dopaminestudios.com)"}

STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "this", "that", "these", "those",
    "it", "its", "with", "for", "on", "in", "at", "to", "of", "and",
    "or", "but", "not", "so", "yet", "how", "why", "when", "where",
    "which", "who", "than", "then", "just", "also", "only", "even",
}


# ── Query building ────────────────────────────────────────────────────────────

def _build_query(beat: dict) -> str:
    query = beat.get("visual", {}).get("query", "").strip()
    if query:
        return query
    narration = beat.get("narration", "")
    tokens = re.findall(r"\b[a-z]{4,}\b", narration.lower())
    keywords = [w for w in tokens if w not in STOP_WORDS]
    # Deduplicate preserving order
    seen: set[str] = set()
    unique = [w for w in keywords if not (w in seen or seen.add(w))]  # type: ignore[func-returns-value]
    return " ".join(unique[:3]) or "nature"


# ── Pexels ────────────────────────────────────────────────────────────────────

def _best_pexels_video_file(video_files: list[dict]) -> str | None:
    """Choose best portrait video file from Pexels hit."""
    portrait = [f for f in video_files
                if f.get("height", 0) > f.get("width", 0)
                and f.get("file_type") == "video/mp4"]
    if not portrait:
        portrait = [f for f in video_files if f.get("file_type") == "video/mp4"]
    if not portrait:
        return None
    # Prefer hd, then sd, then anything
    order = {"hd": 0, "sd": 1}
    portrait.sort(key=lambda f: order.get(f.get("quality", ""), 2))
    return portrait[0].get("link")


async def _pexels_video(
    session: aiohttp.ClientSession,
    query: str,
    used_ids: set[str],
    api_key: str,
) -> tuple[str, str] | None:
    """Returns (download_url, uid) where uid = 'pexels:{id}'."""
    params = {"query": query, "per_page": 15, "orientation": "portrait", "size": "medium"}
    headers = {**UA, "Authorization": api_key}
    try:
        async with session.get(
            "https://api.pexels.com/videos/search",
            params=params, headers=headers,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if not resp.ok:
                print(f"[stock] Pexels video error {resp.status}")
                return None
            data = await resp.json()
        for hit in data.get("videos", []):
            uid = f"pexels:{hit['id']}"
            if uid in used_ids:
                continue
            url = _best_pexels_video_file(hit.get("video_files", []))
            if url:
                return url, uid
    except Exception as e:
        print(f"[stock] Pexels video search error: {e}")
    return None


async def _pexels_photo(
    session: aiohttp.ClientSession,
    query: str,
    used_ids: set[str],
    api_key: str,
) -> tuple[str, str] | None:
    params = {"query": query, "per_page": 15, "orientation": "portrait"}
    headers = {**UA, "Authorization": api_key}
    try:
        async with session.get(
            "https://api.pexels.com/v1/search",
            params=params, headers=headers,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if not resp.ok:
                return None
            data = await resp.json()
        for hit in data.get("photos", []):
            uid = f"pexels:{hit['id']}"
            if uid in used_ids:
                continue
            url = hit.get("src", {}).get("large2x") or hit.get("src", {}).get("large")
            if url:
                return url, uid
    except Exception as e:
        print(f"[stock] Pexels photo search error: {e}")
    return None


# ── Pixabay ───────────────────────────────────────────────────────────────────

async def _pixabay_video(
    session: aiohttp.ClientSession,
    query: str,
    used_ids: set[str],
    api_key: str,
) -> tuple[str, str] | None:
    params = {
        "key": api_key, "q": query,
        "per_page": 15, "video_type": "film", "safesearch": "true",
    }
    try:
        async with session.get(
            "https://pixabay.com/api/videos/",
            params=params, headers=UA,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if not resp.ok:
                return None
            data = await resp.json()
        for hit in data.get("hits", []):
            uid = f"pixabay:{hit['id']}"
            if uid in used_ids:
                continue
            videos = hit.get("videos", {})
            url = (videos.get("medium", {}).get("url")
                   or videos.get("small", {}).get("url")
                   or videos.get("large", {}).get("url"))
            if url:
                return url, uid
    except Exception as e:
        print(f"[stock] Pixabay video search error: {e}")
    return None


async def _pixabay_photo(
    session: aiohttp.ClientSession,
    query: str,
    used_ids: set[str],
    api_key: str,
) -> tuple[str, str] | None:
    params = {
        "key": api_key, "q": query, "per_page": 15,
        "image_type": "photo", "orientation": "vertical", "safesearch": "true",
    }
    try:
        async with session.get(
            "https://pixabay.com/api/",
            params=params, headers=UA,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if not resp.ok:
                return None
            data = await resp.json()
        for hit in data.get("hits", []):
            uid = f"pixabay:{hit['id']}"
            if uid in used_ids:
                continue
            url = hit.get("largeImageURL") or hit.get("webformatURL")
            if url:
                return url, uid
    except Exception as e:
        print(f"[stock] Pixabay photo search error: {e}")
    return None


# ── Downloader ────────────────────────────────────────────────────────────────

async def _download_stock(
    session: aiohttp.ClientSession,
    url: str,
    out_path: Path,
) -> bool:
    try:
        async with session.get(url, headers=UA, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            if not resp.ok:
                return False
            data = await resp.read()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(data)
        return True
    except Exception as e:
        print(f"[stock] download error: {e}")
        return False


# ── Beat selector ─────────────────────────────────────────────────────────────

async def select_beat_stock(
    beat: dict,
    used_ids: set[str],
    out_dir: Path,
) -> dict | None:
    """
    Selects and downloads one stock asset for a beat.
    Mutates used_ids in place on success.
    Returns a StockAsset dict or None.
    """
    pexels_key  = os.getenv("PEXELS_API_KEY", "")
    pixabay_key = os.getenv("PIXABAY_API_KEY", "")

    if not pexels_key and not pixabay_key:
        print("[stock] No API keys set — skipping (set PEXELS_API_KEY / PIXABAY_API_KEY)")
        return None

    beat_id = beat["beatId"]
    query   = _build_query(beat)
    print(f"[stock] {beat_id}: searching for {query!r}")

    async with aiohttp.ClientSession() as session:
        # 1. Pexels video (preferred — portrait native)
        if pexels_key:
            result = await _pexels_video(session, query, used_ids, pexels_key)
            if result:
                url, uid = result
                ext      = ".mp4"
                out_path = out_dir / f"{beat_id}{ext}"
                ok = await _download_stock(session, url, out_path)
                if ok:
                    used_ids.add(uid)
                    print(f"[stock] {beat_id}: Pexels video → {out_path.name}")
                    return {
                        "id":     uid,
                        "path":   str(out_path),
                        "kind":   "video",
                        "query":  query,
                        "source": "pexels",
                    }

        # 2. Pixabay video fallback
        if pixabay_key:
            result = await _pixabay_video(session, query, used_ids, pixabay_key)
            if result:
                url, uid = result
                out_path = out_dir / f"{beat_id}.mp4"
                ok = await _download_stock(session, url, out_path)
                if ok:
                    used_ids.add(uid)
                    print(f"[stock] {beat_id}: Pixabay video → {out_path.name}")
                    return {
                        "id":     uid,
                        "path":   str(out_path),
                        "kind":   "video",
                        "query":  query,
                        "source": "pixabay",
                    }

        # 3. Pexels photo fallback
        if pexels_key:
            result = await _pexels_photo(session, query, used_ids, pexels_key)
            if result:
                url, uid = result
                out_path = out_dir / f"{beat_id}.jpg"
                ok = await _download_stock(session, url, out_path)
                if ok:
                    used_ids.add(uid)
                    print(f"[stock] {beat_id}: Pexels photo → {out_path.name}")
                    return {
                        "id":     uid,
                        "path":   str(out_path),
                        "kind":   "photo",
                        "query":  query,
                        "source": "pexels",
                    }

        # 4. Pixabay photo last resort
        if pixabay_key:
            result = await _pixabay_photo(session, query, used_ids, pixabay_key)
            if result:
                url, uid = result
                out_path = out_dir / f"{beat_id}.jpg"
                ok = await _download_stock(session, url, out_path)
                if ok:
                    used_ids.add(uid)
                    print(f"[stock] {beat_id}: Pixabay photo → {out_path.name}")
                    return {
                        "id":     uid,
                        "path":   str(out_path),
                        "kind":   "photo",
                        "query":  query,
                        "source": "pixabay",
                    }

    print(f"[stock] {beat_id}: no result found for {query!r}")
    return None


# ── Manifest-level selector ───────────────────────────────────────────────────

async def select_all_stock(manifest: dict) -> dict:
    """
    Processes all stock_video beats sequentially (avoids API rate limits).
    Fills manifest['usedStockIds'] and beat['resolvedAsset'].
    """
    out_dir  = STOCK_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    # Load existing used IDs to prevent cross-run repeats
    used_ids: set[str] = set(manifest.get("usedStockIds", []))

    stock_beats = [b for b in manifest.get("beats", [])
                   if b.get("visual", {}).get("kind") == "stock_video"]

    for beat in stock_beats:
        asset = await select_beat_stock(beat, used_ids, out_dir)
        if asset:
            beat["resolvedAsset"] = asset
            if beat_id := asset.get("id"):
                used_ids.add(beat_id)

    manifest["usedStockIds"] = sorted(used_ids)
    print(f"[stock] total used IDs: {len(used_ids)}")
    return manifest


# ── CLI ───────────────────────────────────────────────────────────────────────

async def _main() -> None:
    import json
    import sys
    if len(sys.argv) < 2:
        print("Usage: stock_selector.py <manifest.json>")
        sys.exit(1)
    with open(sys.argv[1]) as f:
        manifest = json.load(f)
    manifest = await select_all_stock(manifest)
    with open(sys.argv[1], "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[stock] manifest updated: {sys.argv[1]}")


if __name__ == "__main__":
    asyncio.run(_main())
