"""
Asset resolver — downloads and caches visual assets for each beat.

Resolvers by beat visual.kind:
  person   → Wikipedia page image + rembg background removal
  brand / product / app → simple-icons SVG lookup (via node subprocess)
  place    → Wikipedia page thumbnail
  map      → OSM Nominatim geocoding + staticmap tile render (single marker)
  distance → Geocode both ends, haversine distance, static map with two markers

Output: public/assets/
All resolved assets are written into manifest["resolvedAssets"][beatId]
and back-filled onto beat["resolvedAsset"].
"""

import asyncio
import io
import json
import math
import os
import re
import subprocess
import urllib.parse
from pathlib import Path

import aiohttp
from PIL import Image

ASSETS_DIR = Path("public/assets")
UA = {"User-Agent": "DopamineStudios/1.0 (contact@dopaminestudios.com)"}

# ── rembg model ─────────────────────────────────────────────────────────────
# Verified (GH Actions run, HTTP 200 / ~1-2s / checksum-matched) that
# danielgatis/rembg's own release is directly reachable from CI, so rembg's
# default pooch.retrieve() download-and-cache (to ~/.u2net, or U2NET_HOME if
# set) needs no custom mirroring or pre-population — pooch already skips the
# network on a cache hit via its own checksum check.
#
# u2net_human_seg (not general-purpose u2net): every rembg call in this file
# is resolve_person() cutting out a human subject from a Wikipedia photo, and
# this session is trained specifically for that, unlike u2net's general
# salient-object segmentation. Same host/release/reachability as u2net.
_rembg_session_cache: dict = {}


def _get_rembg_session():
    if "default" not in _rembg_session_cache:
        from rembg import new_session
        _rembg_session_cache["default"] = new_session("u2net_human_seg")
    return _rembg_session_cache["default"]


def _remove_background(raw_bytes: bytes) -> bytes | None:
    """Runs rembg cutout on raw_bytes, returns transparent-PNG bytes, or None
    on any failure (missing model, corrupt image, rembg/onnxruntime not
    installed) — caller falls back to the uncut photo, matching this
    module's existing degrade-gracefully-on-external-dependency-failure
    pattern (Wikipedia lookups, geocoding, etc. all do the same)."""
    try:
        from rembg import remove
        session = _get_rembg_session()
        return remove(raw_bytes, session=session)
    except Exception as e:
        print(f"[assets] rembg cutout failed, falling back to uncut photo: {e}")
        return None


def _is_valid_entity(text: str) -> bool:
    """Reject DOIs, citation strings, and other non-visual entity names."""
    if not text or len(text) < 3:
        return False
    if re.match(r'^\d+\.\d+/', text):  # DOI pattern like 10.1016/j.xxx
        return False
    alpha_ratio = sum(c.isalpha() for c in text) / max(len(text), 1)
    if alpha_ratio < 0.4:
        return False
    return True


# ── Wikipedia helpers ────────────────────────────────────────────────────────────────────────

_KNOWN_FULL_NAMES: dict[str, str] = {
    "trump":        "Donald Trump",
    "obama":        "Barack Obama",
    "biden":        "Joe Biden",
    "musk":         "Elon Musk",
    "elon":         "Elon Musk",
    "bezos":        "Jeff Bezos",
    "zuckerberg":   "Mark Zuckerberg",
    "gates":        "Bill Gates",
    "einstein":     "Albert Einstein",
    "newton":       "Isaac Newton",
    "darwin":       "Charles Darwin",
    "tesla":        "Nikola Tesla",
    "napoleon":     "Napoleon Bonaparte",
    "lincoln":      "Abraham Lincoln",
    "shakespeare":  "William Shakespeare",
    "freud":        "Sigmund Freud",
    "jung":         "Carl Jung",
    "hawking":      "Stephen Hawking",
    "curie":        "Marie Curie",
    "jobs":         "Steve Jobs",
}


async def _wikipedia_thumbnail(
    session: aiohttp.ClientSession,
    title: str,
    size: int = 800,
) -> tuple[str, str] | None:
    url = (
        "https://en.wikipedia.org/w/api.php"
        "?action=query"
        f"&titles={urllib.parse.quote(title)}"
        f"&prop=pageimages&format=json&pithumbsize={size}"
    )
    try:
        async with session.get(url, headers=UA, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json(content_type=None)
        for page in data.get("query", {}).get("pages", {}).values():
            if page.get("pageid", -1) == -1:
                return None  # disambiguation / missing page
            thumb = page.get("thumbnail")
            if thumb:
                return thumb["source"], f"Wikipedia — {title}"
    except Exception as e:
        print(f"[assets] Wikipedia error for {title!r}: {e}")
    return None


async def _wikipedia_thumbnail_with_fallback(
    session: aiohttp.ClientSession,
    name: str,
    size: int = 800,
) -> tuple[str, str] | None:
    # Step 1: direct title lookup
    result = await _wikipedia_thumbnail(session, name, size)
    if result:
        return result

    # Step 2: known full names for common last-name-only lookups
    key = name.lower().strip()
    for token in key.split():
        if token in _KNOWN_FULL_NAMES:
            full = _KNOWN_FULL_NAMES[token]
            if full.lower() != key:
                result = await _wikipedia_thumbnail(session, full, size)
                if result:
                    return result
            break

    # Step 3: Wikipedia OpenSearch API — returns top article title for the query
    try:
        search_url = (
            "https://en.wikipedia.org/w/api.php"
            "?action=opensearch"
            f"&search={urllib.parse.quote(name)}"
            "&limit=3&namespace=0&format=json"
        )
        async with session.get(search_url, headers=UA, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json(content_type=None)
        # OpenSearch returns [query, [titles], [descriptions], [urls]]
        titles = data[1] if len(data) > 1 else []
        for title in titles[:3]:
            result = await _wikipedia_thumbnail(session, title, size)
            if result:
                return result
    except Exception as e:
        print(f"[assets] Wikipedia OpenSearch error for {name!r}: {e}")

    return None


# Files referenced on a Wikipedia article/infobox that aren't usable subject
# photos — UI chrome, flags, coats of arms, locator maps, disambiguation
# icons, protection padlocks. Filtered by filename since imageinfo alone
# (mime type) doesn't distinguish "a real photo" from "a decorative SVG/PNG
# icon" — most decorative files are SVG, but not all, and some real photos
# are legitimately PNG, so mime type is a necessary but insufficient filter.
_NON_PHOTO_FILENAME_RE = re.compile(
    r"commons-logo|edit-icon|folder|wiki-|flag_of|coat_of_arms|locator|"
    r"_map_|map_of|symbol|\bicon\b|question_mark|disambig|padlock|"
    r"protection|crystal_|nuvola|gnome-|noimage|no_image|signature",
    re.IGNORECASE,
)


async def _wikipedia_extra_images(
    session: aiohttp.ClientSession,
    title: str,
    max_images: int = 3,
    size: int = 800,
) -> list[tuple[str, str]]:
    """
    Fetches additional photos referenced on a Wikipedia page beyond the
    single "page image" _wikipedia_thumbnail() returns — used for the
    person/place image-interchange (crossfade) path.

    prop=pageimages is deliberately single-image: the PageImages extension
    picks ONE heuristically-best "page image" per article, with no
    multi-image equivalent on that same call. Getting more requires a
    second query. Checked what's actually reachable here (Wikimedia Commons'
    own category API is a different host, and would need a separate
    category-name-discovery step first since a page's Commons category name
    doesn't always match the article title) — generator=images + imageinfo
    on this SAME en.wikipedia.org/w/api.php endpoint is a documented,
    standard MediaWiki API combination that lists the files embedded in the
    article and fetches their thumbnail URLs in one round trip, without
    adding a new host or API family beyond what this module already calls.

    Not curated for relevance beyond the filename/mime filtering below —
    infobox galleries, "in popular culture" images, etc. can all appear.
    Returns [(url, credit), ...] in API return order, already downloadable.
    """
    url = (
        "https://en.wikipedia.org/w/api.php"
        "?action=query&generator=images"
        f"&titles={urllib.parse.quote(title)}"
        "&gimlimit=25&prop=imageinfo&iiprop=url|mime"
        f"&iiurlwidth={size}&format=json"
    )
    results: list[tuple[str, str]] = []
    try:
        async with session.get(url, headers=UA, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json(content_type=None)
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            file_title = page.get("title", "")
            if _NON_PHOTO_FILENAME_RE.search(file_title):
                continue
            infos = page.get("imageinfo", [])
            if not infos:
                continue
            info = infos[0]
            mime = info.get("mime", "")
            if not mime.startswith("image/") or mime == "image/svg+xml":
                continue
            thumb_url = info.get("thumburl") or info.get("url")
            if thumb_url:
                results.append((thumb_url, f"Wikipedia — {title}"))
            if len(results) >= max_images:
                break
    except Exception as e:
        print(f"[assets] Wikipedia extra-images error for {title!r}: {e}")
    return results


async def _download_file(
    session: aiohttp.ClientSession,
    url: str,
    out_path: Path,
) -> bool:
    try:
        async with session.get(url, headers=UA, timeout=aiohttp.ClientTimeout(total=20)) as resp:
            if not resp.ok:
                return False
            data = await resp.read()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(data)
        return True
    except Exception as e:
        print(f"[assets] download error {url}: {e}")
        return False


# ── Person: Wikipedia photo + rembg ─────────────────────────────────────────────────────────────────

_PERSON_TITLE_PREFIXES = re.compile(
    r"^\s*(president|vice\s*president|senator|secretary|general|admiral|colonel|captain|"
    r"doctor|dr\.?|professor|prof\.?|sir|dame|lord|lady|mr\.?|mrs\.?|ms\.?|the\s+)[\s,]+",
    re.IGNORECASE,
)


def _clean_person_name(name: str) -> str:
    """Strip honorific/title prefixes so 'President John F' → 'John F'."""
    cleaned = _PERSON_TITLE_PREFIXES.sub("", name).strip()
    return cleaned if cleaned else name


async def resolve_person(name: str, out_dir: Path, max_images: int = 3) -> dict | None:
    clean_name = _clean_person_name(name)
    slug = re.sub(r"[^a-z0-9]", "_", clean_name.lower())
    cutout_path = out_dir / f"person_{slug}.png"

    # Cache: single-image case already resolved on a previous run.
    if cutout_path.exists():
        return {"path": str(cutout_path), "credit": f"Wikipedia — {clean_name}", "fallback": None}
    # Cache: multi-image case already resolved (numbered files from a
    # previous run — person_{slug}_0.png, _1.png, ...).
    existing_multi = sorted(out_dir.glob(f"person_{slug}_[0-9]*.png"))
    if existing_multi:
        paths = [str(p) for p in existing_multi]
        return {"path": paths[0], "paths": paths, "credit": f"Wikipedia — {clean_name}", "fallback": None}

    async with aiohttp.ClientSession() as session:
        primary = await _wikipedia_thumbnail_with_fallback(session, clean_name, size=800)
        if not primary:
            print(f"[assets] No Wikipedia image for person: {name!r}")
            return {"path": None, "credit": None, "fallback": clean_name[:1].upper()}

        img_url, credit = primary
        extra = await _wikipedia_extra_images(session, clean_name, max_images=max(0, max_images - 1))
        seen_urls = {img_url}
        candidates = [(img_url, credit)]
        for url, c in extra:
            if url not in seen_urls:
                seen_urls.add(url)
                candidates.append((url, c))

        multi = len(candidates) > 1
        resolved_paths: list[str] = []
        any_cutout = False
        for i, (url, _c) in enumerate(candidates):
            raw_path = out_dir / f"person_{slug}_{i}_raw.jpg"
            ok = await _download_file(session, url, raw_path)
            if not ok:
                continue
            final_path = (out_dir / f"person_{slug}_{i}.png") if multi else cutout_path
            cutout_bytes = _remove_background(raw_path.read_bytes())
            if cutout_bytes is not None:
                final_path.write_bytes(cutout_bytes)
                raw_path.unlink(missing_ok=True)
                any_cutout = True
            else:
                # rembg unavailable/failed for this image — fall back to the
                # uncut photo rather than dropping it entirely.
                final_path = final_path.with_suffix(".jpg")
                raw_path.rename(final_path)
            resolved_paths.append(str(final_path))

    if not resolved_paths:
        return {"path": None, "credit": None, "fallback": clean_name[:1].upper()}

    kind = "cutout" if any_cutout else "image (no cutout)"
    print(f"[assets] person {kind}: {len(resolved_paths)} image(s) for {clean_name}")
    result = {"path": resolved_paths[0], "credit": credit, "fallback": None}
    if len(resolved_paths) > 1:
        result["paths"] = resolved_paths
    return result


# ── Brand / app: simple-icons via Node.js subprocess ───────────────────────────────────────────────

def _node_get_icon(query: str) -> dict | None:
    """
    Queries the simple-icons npm package by brand name.
    Returns {slug, hex, title, svg} or None.
    """
    script = (
        "const si = require('simple-icons');"
        "const q = process.argv[1].toLowerCase().replace(/[^a-z0-9]/g,'');"
        "let found = null;"
        "for (const key of Object.keys(si)) {"
        "  const ic = si[key];"
        "  if (!ic || typeof ic !== 'object') continue;"
        "  const s = (ic.slug||'').toLowerCase().replace(/[^a-z0-9]/g,'');"
        "  const t = (ic.title||'').toLowerCase().replace(/[^a-z0-9]/g,'');"
        "  if (s===q||t===q||s.startsWith(q)||q.startsWith(s)) {"
        "    found={slug:ic.slug,hex:ic.hex,title:ic.title,svg:ic.svg};"
        "    break;"
        "  }"
        "}"
        "console.log(JSON.stringify(found));"
    )
    try:
        result = subprocess.run(
            ["node", "-e", script, query],
            capture_output=True, text=True, timeout=15,
        )
        raw = result.stdout.strip()
        if not raw or raw == "null":
            return None
        return json.loads(raw)
    except Exception as e:
        print(f"[assets] node simple-icons error for {query!r}: {e}")
        return None


async def resolve_brand(name: str, out_dir: Path) -> dict | None:
    data = _node_get_icon(name)
    if not data:
        print(f"[assets] No simple-icons entry for: {name!r}")
        return None
    print(f"[assets] brand icon: {data['title']} #{data['hex']}")
    return {
        "svgString": data["svg"],
        "hex":       data["hex"],
        "title":     data["title"],
        "type":      "svg",
    }


# ── Place: Wikipedia thumbnail ────────────────────────────────────────────────────────────────────────────

async def resolve_place(name: str, out_dir: Path, max_images: int = 3) -> dict | None:
    slug     = re.sub(r"[^a-z0-9]", "_", name.lower())
    img_path = out_dir / f"place_{slug}.jpg"

    # Cache: single-image case already resolved on a previous run.
    if img_path.exists():
        return {"path": str(img_path), "credit": f"Wikipedia — {name}"}
    # Cache: multi-image case already resolved (numbered files).
    existing_multi = sorted(out_dir.glob(f"place_{slug}_[0-9]*.jpg"))
    if existing_multi:
        paths = [str(p) for p in existing_multi]
        return {"path": paths[0], "paths": paths, "credit": f"Wikipedia — {name}"}

    async with aiohttp.ClientSession() as session:
        primary = await _wikipedia_thumbnail(session, name, size=1200)
        if not primary:
            print(f"[assets] No Wikipedia image for place: {name!r}")
            return None

        img_url, credit = primary
        extra = await _wikipedia_extra_images(session, name, max_images=max(0, max_images - 1), size=1200)
        seen_urls = {img_url}
        candidates = [(img_url, credit)]
        for url, c in extra:
            if url not in seen_urls:
                seen_urls.add(url)
                candidates.append((url, c))

        multi = len(candidates) > 1
        resolved_paths: list[str] = []
        for i, (url, _c) in enumerate(candidates):
            dest = (out_dir / f"place_{slug}_{i}.jpg") if multi else img_path
            ok = await _download_file(session, url, dest)
            if ok:
                resolved_paths.append(str(dest))

    if not resolved_paths:
        return None

    print(f"[assets] place image: {len(resolved_paths)} image(s) for {name}")
    result = {"path": resolved_paths[0], "credit": credit}
    if len(resolved_paths) > 1:
        result["paths"] = resolved_paths
    return result


# ── Map + Distance: OSM Nominatim + staticmap ──────────────────────────────────────────────────

async def _nominatim(session: aiohttp.ClientSession, place: str) -> tuple[float, float] | None:
    url = (
        "https://nominatim.openstreetmap.org/search"
        f"?q={urllib.parse.quote(place)}&format=json&limit=1"
    )
    try:
        async with session.get(url, headers=UA, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            results = await resp.json(content_type=None)
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        print(f"[assets] Nominatim error for {place!r}: {e}")
    return None


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def _auto_zoom(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Choose zoom so both markers fit with ~20% padding on a 1080×960 canvas."""
    max_diff = max(abs(lat2 - lat1), abs(lon2 - lon1), 0.01)
    for z in range(14, 1, -1):
        tile_deg = 360.0 / (2 ** z)
        # roughly 1080/256 ≈ 4.2 tiles visible
        if max_diff < tile_deg * 3.5:
            return z
    return 2


def _latlon_to_px(
    lat: float, lon: float,
    center_lat: float, center_lon: float,
    zoom: int,
    width: int, height: int,
) -> tuple[int, int]:
    """Web Mercator: convert (lat, lon) to pixel position within the rendered image."""
    def merc_y(lat_deg: float) -> float:
        lr = math.radians(lat_deg)
        return math.log(math.tan(math.pi / 4 + lr / 2))

    scale = 256 * (2 ** zoom)
    cx = (center_lon + 180) / 360 * scale
    cy = (1 - merc_y(center_lat) / math.pi) / 2 * scale
    px = (lon + 180) / 360 * scale
    py = (1 - merc_y(lat) / math.pi) / 2 * scale

    return (int(width // 2 + (px - cx)), int(height // 2 + (py - cy)))


def _render_map(
    center_lat: float, center_lon: float, zoom: int,
    markers: list[tuple[float, float]],
    out_path: Path,
    width: int = 1080,
    height: int = 960,
) -> bool:
    try:
        from staticmap import StaticMap, CircleMarker
        m = StaticMap(width, height)
        for lat, lon in markers:
            m.add_marker(CircleMarker((lon, lat), "#ff1744", 16))
        img = m.render(zoom=zoom, center=[center_lon, center_lat])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(str(out_path))
        return True
    except Exception as e:
        print(f"[assets] staticmap render failed: {e}")
        return False


async def resolve_map(place: str, zoom: int, label: str, out_dir: Path) -> dict | None:
    slug     = re.sub(r"[^a-z0-9]", "_", place.lower())
    img_path = out_dir / f"map_{slug}.png"

    async with aiohttp.ClientSession() as session:
        coords = await _nominatim(session, place)
    if not coords:
        return None

    lat, lon = coords
    z = zoom or 10
    ok = _render_map(lat, lon, z, [(lat, lon)], img_path)
    if not ok:
        return None

    px = _latlon_to_px(lat, lon, lat, lon, z, 1080, 960)
    print(f"[assets] map: {place} ({lat:.4f},{lon:.4f}) z={z}")
    return {
        "map_image":      str(img_path),
        "from_place":     place,
        "from_lat":       lat,
        "from_lon":       lon,
        "from_px":        list(px),
        "to_place":       place,
        "to_lat":         lat,
        "to_lon":         lon,
        "to_px":          list(px),
        "distance_km":    0,
        "distance_label": label or place,
    }


async def resolve_distance(
    from_place: str,
    to_place: str,
    unit: str,
    out_dir: Path,
) -> dict | None:
    slug     = re.sub(r"[^a-z0-9]", "_", f"{from_place}_{to_place}".lower())
    img_path = out_dir / f"dist_{slug}.png"

    async with aiohttp.ClientSession() as session:
        from_coords, to_coords = await asyncio.gather(
            _nominatim(session, from_place),
            _nominatim(session, to_place),
        )

    if not from_coords or not to_coords:
        print(f"[assets] geocoding failed: {from_place!r} or {to_place!r}")
        return None

    flat, flon = from_coords
    tlat, tlon = to_coords
    dist_km    = _haversine_km(flat, flon, tlat, tlon)

    center_lat = (flat + tlat) / 2
    center_lon = (flon + tlon) / 2
    zoom       = _auto_zoom(flat, flon, tlat, tlon)

    ok = _render_map(center_lat, center_lon, zoom, [(flat, flon), (tlat, tlon)], img_path)
    if not ok:
        return None

    from_px = _latlon_to_px(flat, flon, center_lat, center_lon, zoom, 1080, 960)
    to_px   = _latlon_to_px(tlat, tlon, center_lat, center_lon, zoom, 1080, 960)

    if unit == "miles":
        display_val = dist_km * 0.621371
        dist_label  = f"{display_val:,.0f} miles"
    elif unit == "ly":
        ly = dist_km / 9.461e12
        dist_label = f"{ly:.2f} light-years"
    else:
        dist_label = f"{dist_km:,.0f} km"

    print(f"[assets] distance: {from_place} → {to_place} = {dist_label}")
    return {
        "map_image":      str(img_path),
        "from_place":     from_place,
        "from_lat":       flat,
        "from_lon":       flon,
        "from_px":        list(from_px),
        "to_place":       to_place,
        "to_lat":         tlat,
        "to_lon":         tlon,
        "to_px":          list(to_px),
        "distance_km":    round(dist_km, 1),
        "distance_label": dist_label,
    }


# ── Beat dispatcher ─────────────────────────────────────────────────────────────────────────────────

async def resolve_beat_asset(beat: dict, out_dir: Path) -> dict | None:
    visual = beat.get("visual", {})
    kind   = visual.get("kind", "none")
    value  = visual.get("value", "")

    if kind in ("person", "brand", "product", "app", "place") and not _is_valid_entity(value):
        print(f"[assets] skipping invalid entity for {beat.get('beatId')}: {value!r}")
        return None

    if kind == "person":
        return await resolve_person(value, out_dir)
    elif kind in ("brand", "product", "app"):
        return await resolve_brand(value, out_dir)
    elif kind == "place":
        return await resolve_place(value, out_dir)
    elif kind == "map":
        return await resolve_map(
            visual.get("place", visual.get("value", "")),
            visual.get("zoom", 10),
            visual.get("label", ""),
            out_dir,
        )
    elif kind == "distance":
        return await resolve_distance(
            visual.get("from", ""),
            visual.get("to", ""),
            visual.get("unit", "km"),
            out_dir,
        )
    return None


async def resolve_all_beats(manifest: dict) -> dict:
    """
    Resolves all beat assets concurrently.
    Fills manifest['resolvedAssets'] and beat['resolvedAsset'] in-place.
    """
    out_dir = ASSETS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    RESOLVABLE = {"person", "brand", "product", "app", "place", "map", "distance"}

    tasks, beat_ids = [], []
    for beat in manifest.get("beats", []):
        if beat.get("visual", {}).get("kind", "none") in RESOLVABLE:
            tasks.append(resolve_beat_asset(beat, out_dir))
            beat_ids.append(beat["beatId"])

    results = await asyncio.gather(*tasks, return_exceptions=True)

    resolved: dict = {}
    for beat_id, result in zip(beat_ids, results):
        if isinstance(result, Exception):
            print(f"[assets] ERROR {beat_id}: {result}")
        elif result:
            resolved[beat_id] = result
            for beat in manifest["beats"]:
                if beat["beatId"] == beat_id:
                    beat["resolvedAsset"] = result

    manifest["resolvedAssets"] = resolved
    print(f"[assets] resolved {len(resolved)}/{len(tasks)} assets")
    return manifest


# ── CLI ──────────────────────────────────────────────────────────────────────────────────────

async def _main() -> None:
    import sys
    if len(sys.argv) < 2:
        print("Usage: asset_resolver.py <manifest.json>")
        sys.exit(1)

    with open(sys.argv[1]) as f:
        manifest = json.load(f)

    manifest = await resolve_all_beats(manifest)

    with open(sys.argv[1], "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[assets] manifest updated: {sys.argv[1]}")


if __name__ == "__main__":
    asyncio.run(_main())
