#!/usr/bin/env python3
"""Download GLB models to public/models/. Called by CI when cache misses."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).parent.parent
MODELS_DIR = ROOT / "public" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# CC0/NASA licensed GLB sources
MODELS = [
    # ch6 — celestial bodies (NASA Solar System Exploration 3D models, CC BY 4.0)
    {
        "name": "mars.glb",
        "url": "https://raw.githubusercontent.com/nicktacular/nasa-3d-resources/master/Models/Mars/mars_1k_color.jpg",
        "note": "placeholder — replace with real GLB",
    },
]


def download(name: str, url: str) -> bool:
    dest = MODELS_DIR / name
    if dest.exists():
        print(f"  ✓ {name} (cached)")
        return True
    try:
        resp = requests.get(url, timeout=30, stream=True)
        resp.raise_for_status()
        dest.write_bytes(resp.content)
        print(f"  ✓ {name} downloaded ({dest.stat().st_size / 1024:.0f} KB)")
        return True
    except Exception as exc:
        print(f"  ⚠ {name} failed: {exc} — ModelErrorBoundary will handle fallback")
        return False


if __name__ == "__main__":
    print("Downloading 3D models...")
    for m in MODELS:
        download(m["name"], m["url"])
    print("Done.")
