#!/usr/bin/env python3
"""Stage 5: Resolve visual assets for each beat."""
from __future__ import annotations

import asyncio
import re
import unicodedata
from pathlib import Path

import aiohttp

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
SIMPLE_ICONS_CDN = "https://cdn.simpleicons.org"
OSM_STATIC = "https://staticmap.openstreetmap.de/staticmap.php"

_ASTRONOMICAL_DISTANCES_KM: dict[str, float] = {
    "moon": 384_400, "the moon": 384_400,
    "sun": 149_600_000, "the sun": 149_600_000,
    "mercury": 91_700_000, "venus": 41_400_000,
    "mars": 78_300_000, "jupiter": 628_700_000,
    "saturn": 1_277_000_000, "uranus": 2_721_000_000,
    "neptune": 4_351_000_000, "pluto": 5_906_000_000,
}

_CELESTIAL_SUBSTRINGS = (
    'mars', 'venus', 'jupiter', 'saturn', 'moon', 'sun',
    'atmosphere', 'surface of', 'orbit', 'space', 'asteroid',
    'comet', 'stellar', 'interstellar', 'galaxy', 'nebula',
)


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "_", text).strip("_")


def _is_celestial(s: str) -> bool:
    s_lower = s.lower()
    return any(sub in s_lower for sub in _CELESTIAL_SUBSTRINGS)


async def _fetch_wikipedia_image(session: aiohttp.ClientSession, entity: str) -> str | None:
    params = {
        "action": "query",
        "format": "json",
        "titles": entity,
        "prop": "pageimages",
        "pithumbsize": 800,
        "redirects": 1,
    }
    try:
        async with session.get(WIKIPEDIA_API, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json()
            pages = data.get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})
            thumb = page.get("thumbnail", {})
            return thumb.get("source")
    except Exception:
        return None


async def _download(session: aiohttp.ClientSession, url: str, dest: Path) -> bool:
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            if resp.status == 200:
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(await resp.read())
                return True
    except Exception:
        pass
    return False


async def _resolve_person(session: aiohttp.ClientSession, value: str, assets_dir: Path) -> dict | None:
    slug = _slugify(value)
    dest = assets_dir / f"person_{slug}.png"
    if dest.exists():
        return {"type": "person", "localPath": str(dest), "url": ""}

    url = await _fetch_wikipedia_image(session, value)
    if not url:
        return None

    # Download raw image
    raw = assets_dir / f"person_{slug}_raw.jpg"
    if not await _download(session, url, raw):
        return None

    # rembg background removal
    try:
        from rembg import remove
        from PIL import Image
        img = Image.open(raw)
        result = remove(img)
        result.save(str(dest))
        raw.unlink(missing_ok=True)
    except Exception:
        raw.rename(dest)

    return {"type": "person", "localPath": str(dest), "url": url}


async def _resolve_brand(session: aiohttp.ClientSession, value: str, assets_dir: Path) -> dict | None:
    slug = _slugify(value)
    dest = assets_dir / f"brand_{slug}.svg"
    if dest.exists():
        return {"type": "brand", "localPath": str(dest), "url": ""}

    # Try simple-icons
    icon_name = value.lower().replace(" ", "")
    url = f"{SIMPLE_ICONS_CDN}/{icon_name}"
    if await _download(session, url, dest):
        return {"type": "brand", "localPath": str(dest), "url": url}
    return None


async def _resolve_place(session: aiohttp.ClientSession, value: str, assets_dir: Path) -> dict | None:
    slug = _slugify(value)
    dest = assets_dir / f"place_{slug}.jpg"
    if dest.exists():
        return {"type": "place", "localPath": str(dest), "url": ""}

    url = await _fetch_wikipedia_image(session, value)
    if url and await _download(session, url, dest):
        return {"type": "place", "localPath": str(dest), "url": url}
    return None


async def _resolve_map(session: aiohttp.ClientSession, visual: dict, assets_dir: Path) -> dict | None:
    place = visual.get("place") or visual.get("value", "")
    if not place or _is_celestial(place):
        return None

    slug = _slugify(place)
    zoom = visual.get("zoom", 5)
    dest = assets_dir / f"map_{slug}.png"
    if dest.exists():
        return {"type": "map", "localPath": str(dest), "url": ""}

    # Geocode via Nominatim
    try:
        nom_url = "https://nominatim.openstreetmap.org/search"
        params = {"q": place, "format": "json", "limit": 1}
        headers = {"User-Agent": "DopamineStudios/1.0"}
        async with session.get(nom_url, params=params, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as r:
            results = await r.json()
            if not results:
                return None
            lat = results[0]["lat"]
            lon = results[0]["lon"]
    except Exception:
        return None

    map_url = f"{OSM_STATIC}?center={lat},{lon}&zoom={zoom}&size=1080x1920&maptype=osmarenderer"
    if await _download(session, map_url, dest):
        return {"type": "map", "localPath": str(dest), "url": map_url}
    return None


async def _resolve_distance(visual: dict, assets_dir: Path) -> dict | None:
    from_place = (visual.get("from") or "").lower()
    to_place = (visual.get("to") or "").lower()
    if _is_celestial(from_place) or _is_celestial(to_place):
        return None
    return None


async def run_asset_resolver(context: dict) -> dict:
    manifest: dict = context["manifest"]
    root = Path(context["root"])
    assets_dir = root / "public" / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    async with aiohttp.ClientSession() as session:
        for beat in manifest["beats"]:
            visual: dict = beat.get("visual", {})
            kind: str = visual.get("kind", "none")
            value: str = visual.get("value", "")

            resolved = None
            if kind == "person" and value:
                resolved = await _resolve_person(session, value, assets_dir)
            elif kind == "brand" and value:
                resolved = await _resolve_brand(session, value, assets_dir)
            elif kind == "place" and value:
                resolved = await _resolve_place(session, value, assets_dir)
            elif kind == "map":
                resolved = await _resolve_map(session, visual, assets_dir)
            elif kind == "distance":
                resolved = await _resolve_distance(visual, assets_dir)

            beat["resolvedAsset"] = resolved

    context["manifest"] = manifest
    return context
