#!/usr/bin/env python3
"""Stage 1: Research — fetch real facts from public APIs."""
from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Any

import aiohttp

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"
PUBMED_API = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
NASA_API = "https://images-api.nasa.gov/search"
LOC_API = "https://www.loc.gov/search/"


@dataclass
class ResearchBrief:
    topic: str
    facts: list[str] = field(default_factory=list)
    entities: list[str] = field(default_factory=list)


async def _fetch_wikipedia(session: aiohttp.ClientSession, topic: str) -> tuple[list[str], list[str]]:
    params = {
        "action": "query",
        "format": "json",
        "titles": topic,
        "prop": "extracts|links",
        "exintro": True,
        "explaintext": True,
        "pllimit": 20,
        "redirects": 1,
    }
    try:
        async with session.get(WIKIPEDIA_API, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json()
            pages = data.get("query", {}).get("pages", {})
            page = next(iter(pages.values()), {})
            extract: str = page.get("extract", "")
            links_raw = page.get("links", [])
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", extract) if len(s.strip()) > 30]
            facts = sentences[:8]
            entities = [l["title"] for l in links_raw[:20] if l.get("title")]
            return facts, entities
    except Exception:
        return [], []


async def _fetch_pubmed(session: aiohttp.ClientSession, topic: str) -> list[str]:
    try:
        params = {
            "db": "pubmed",
            "term": topic,
            "retmode": "json",
            "retmax": 3,
        }
        async with session.get(PUBMED_API, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json()
            ids = data.get("esearchresult", {}).get("idlist", [])
            if ids:
                return [f"PubMed study ID: {i}" for i in ids[:3]]
    except Exception:
        pass
    return []


async def _fetch_nasa(session: aiohttp.ClientSession, topic: str) -> list[str]:
    try:
        params = {"q": topic, "media_type": "image", "page_size": 3}
        async with session.get(NASA_API, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            data = await resp.json()
            items = data.get("collection", {}).get("items", [])
            facts = []
            for item in items[:3]:
                desc = item.get("data", [{}])[0].get("description", "")
                if desc:
                    facts.append(desc[:200])
            return facts
    except Exception:
        return []


async def run_research(context: dict) -> dict:
    channel_id: str = context["channel_id"]
    topic: str = context["topic"]

    async with aiohttp.ClientSession() as session:
        facts, entities = await _fetch_wikipedia(session, topic)

        extra_facts: list[str] = []
        if channel_id == "ch4":
            extra_facts = await _fetch_pubmed(session, topic)
        elif channel_id == "ch6":
            extra_facts = await _fetch_nasa(session, topic)

        facts = (facts + extra_facts)[:8]

    brief = ResearchBrief(topic=topic, facts=facts, entities=entities[:15])
    context["research_brief"] = asdict(brief)
    return context
