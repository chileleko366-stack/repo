"""
Research stage — fetches real facts from real APIs before any script is written.
Never writes a script about a niche in general; only about a specific phenomenon.
"""

import re
import json
import time
import requests
from urllib.parse import quote
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ResearchBrief:
    topic: str
    key_facts: list[str] = field(default_factory=list)
    specific_numbers: list[str] = field(default_factory=list)
    named_entities: list[str] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)


HEADERS = {"User-Agent": "DopamineStudios/1.0 (contact@dopaminestudios.io)"}


# ── Source functions ────────────────────────────────────────────────────────────────────────────

def wikipedia_extract(topic: str) -> dict:
    """First 8 sentences of Wikipedia intro + entity extraction."""
    url = (
        "https://en.wikipedia.org/w/api.php"
        f"?action=query&prop=extracts&exintro=true&titles={quote(topic)}"
        "&format=json&exsentences=8&explaintext=true"
    )
    try:
        data = requests.get(url, headers=HEADERS, timeout=10).json()
        pages = data.get("query", {}).get("pages", {})
        page = next(iter(pages.values()), {})
        extract = page.get("extract", "")
        if not extract:
            return {"facts": [], "entities": []}

        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", extract) if len(s.strip()) > 20]
        facts = [{"text": s, "url": f"https://en.wikipedia.org/wiki/{quote(topic)}"} for s in sentences[:8]]
        entities = list(set(re.findall(r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b", extract)))[:10]
        return {"facts": facts, "entities": entities}
    except Exception as e:
        print(f"[research] wikipedia_extract failed for '{topic}': {e}")
        return {"facts": [], "entities": []}


def pubmed_abstract(topic: str) -> dict:
    """Top 3 PubMed abstracts for scientific topics."""
    try:
        search_url = (
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            f"?db=pubmed&term={quote(topic)}&retmax=3&retmode=json"
        )
        ids = requests.get(search_url, headers=HEADERS, timeout=10).json()
        id_list = ids.get("esearchresult", {}).get("idlist", [])
        if not id_list:
            return {"facts": [], "entities": []}

        fetch_url = (
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            f"?db=pubmed&id={','.join(id_list)}&rettype=abstract&retmode=text"
        )
        text = requests.get(fetch_url, headers=HEADERS, timeout=10).text
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 30][:6]
        facts = [{"text": s, "url": f"https://pubmed.ncbi.nlm.nih.gov/{id_list[0]}/"} for s in sentences]
        entities = list(set(re.findall(r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b", text)))[:8]
        return {"facts": facts, "entities": entities}
    except Exception as e:
        print(f"[research] pubmed_abstract failed for '{topic}': {e}")
        return {"facts": [], "entities": []}


def nasa_fact_sheet(topic: str) -> dict:
    """NASA planetary fact sheets (space channel)."""
    try:
        url = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/"
        text = requests.get(url, headers=HEADERS, timeout=10).text
        lines = [l.strip() for l in text.split("\n") if re.search(r"\d", l) and len(l.strip()) > 10][:6]
        facts = [{"text": l, "url": url} for l in lines]
        return {"facts": facts, "entities": [topic]}
    except Exception as e:
        print(f"[research] nasa_fact_sheet failed: {e}")
        return {"facts": [], "entities": []}


def arxiv_abstract(topic: str) -> dict:
    """ArXiv paper abstracts (space / science)."""
    try:
        url = f"https://export.arxiv.org/api/query?search_query=all:{quote(topic)}&start=0&max_results=2"
        text = requests.get(url, headers=HEADERS, timeout=10).text
        summaries = re.findall(r"<summary>(.*?)</summary>", text, re.DOTALL)
        facts = []
        entities = []
        for summary in summaries[:2]:
            clean = re.sub(r"\s+", " ", summary.strip())
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", clean) if len(s.strip()) > 20][:3]
            facts.extend([{"text": s, "url": f"https://arxiv.org/search/?query={quote(topic)}"} for s in sentences])
            entities.extend(re.findall(r"\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b", clean)[:4])
        return {"facts": facts, "entities": list(set(entities))}
    except Exception as e:
        print(f"[research] arxiv_abstract failed for '{topic}': {e}")
        return {"facts": [], "entities": []}


def loc_search(topic: str) -> dict:
    """Library of Congress search (history channel)."""
    try:
        url = f"https://www.loc.gov/search/?q={quote(topic)}&fo=json"
        data = requests.get(url, headers=HEADERS, timeout=10).json()
        results = data.get("results", [])[:4]
        facts = []
        entities = []
        for r in results:
            desc = r.get("description", [""])[0]
            if len(desc) > 20:
                facts.append({"text": desc[:200], "url": r.get("url", "")})
            title = r.get("title", "")
            if title:
                entities.append(title[:60])
        return {"facts": facts, "entities": entities[:6]}
    except Exception as e:
        print(f"[research] loc_search failed for '{topic}': {e}")
        return {"facts": [], "entities": []}


def wikimedia_commons_search(topic: str) -> dict:
    """Wikimedia Commons search for historical images (confirms real events exist)."""
    try:
        url = (
            "https://commons.wikimedia.org/w/api.php"
            f"?action=query&list=search&srsearch={quote(topic)}&srnamespace=6&format=json&srlimit=5"
        )
        data = requests.get(url, headers=HEADERS, timeout=10).json()
        results = data.get("query", {}).get("search", [])
        facts = [{"text": r.get("snippet", "").replace('<span class="searchmatch">', "").replace("</span>", ""),
                  "url": f"https://commons.wikimedia.org/wiki/{quote(r.get('title', ''))}"}
                 for r in results if r.get("snippet")]
        entities = [r.get("title", "").replace("File:", "").rsplit(".", 1)[0] for r in results]
        return {"facts": facts[:4], "entities": [e for e in entities if len(e) > 3][:5]}
    except Exception as e:
        print(f"[research] wikimedia_commons_search failed for '{topic}': {e}")
        return {"facts": [], "entities": []}


def nih_search(topic: str) -> dict:
    """NIH search — returns structured health/science facts."""
    try:
        url = f"https://search.nih.gov/search?query={quote(topic)}&utf8=true&format=json"
        data = requests.get(url, headers=HEADERS, timeout=10).json()
        results = data.get("results", {}).get("items", [])[:4]
        facts = [{"text": r.get("description", ""), "url": r.get("url", "")}
                 for r in results if r.get("description")]
        entities = [r.get("title", "")[:60] for r in results if r.get("title")]
        return {"facts": facts, "entities": entities}
    except Exception as e:
        print(f"[research] nih_search failed for '{topic}': {e}")
        return {"facts": [], "entities": []}


# ── Per-channel source map ─────────────────────────────────────────────────────────────────

RESEARCH_SOURCES: dict[str, list] = {
    "ch1": [
        lambda t: wikipedia_extract(t),
        lambda t: pubmed_abstract(t),
    ],
    "ch2": [
        lambda t: wikipedia_extract(t),
        lambda t: wikipedia_extract(f"{t} company"),
    ],
    "ch3": [
        lambda t: wikipedia_extract(t),
        lambda t: wikimedia_commons_search(t),
    ],
    "ch4": [
        lambda t: wikipedia_extract(t),
        lambda t: pubmed_abstract(t),
        lambda t: nih_search(t),
    ],
    "ch5": [
        lambda t: wikipedia_extract(t),
        lambda t: loc_search(t),
    ],
    "ch6": [
        lambda t: wikipedia_extract(t),
        lambda t: nasa_fact_sheet(t),
        lambda t: arxiv_abstract(t),
    ],
}


def research(topic: str, channel_id: str) -> ResearchBrief:
    """
    Fetch real facts about a specific topic from channel-appropriate sources.
    Returns a ResearchBrief with up to 8 key facts and all named entities found.
    """
    sources = RESEARCH_SOURCES.get(channel_id, [lambda t: wikipedia_extract(t)])
    all_facts = []
    all_entities = []
    all_urls = []

    for source_fn in sources:
        try:
            result = source_fn(topic)
            raw_facts = result.get("facts", [])
            for f in raw_facts:
                text = f.get("text", "") if isinstance(f, dict) else str(f)
                url = f.get("url", "") if isinstance(f, dict) else ""
                if text and len(text) > 15:
                    all_facts.append(text)
                    if url:
                        all_urls.append(url)
            all_entities.extend(result.get("entities", []))
            time.sleep(0.3)
        except Exception as e:
            print(f"[research] source failed: {e}")

    seen = set()
    unique_facts = []
    for f in all_facts:
        key = f[:60].lower()
        if key not in seen:
            seen.add(key)
            unique_facts.append(f)

    numbers_facts = [f for f in unique_facts if re.search(r"\d", f)]
    unique_entities = list(dict.fromkeys(all_entities))

    brief = ResearchBrief(
        topic=topic,
        key_facts=unique_facts[:8],
        specific_numbers=numbers_facts[:5],
        named_entities=unique_entities[:12],
        sources=list(dict.fromkeys(all_urls))[:6],
    )

    print(f"[research] {topic!r}: {len(brief.key_facts)} facts, {len(brief.named_entities)} entities")
    return brief


if __name__ == "__main__":
    import sys
    topic = sys.argv[1] if len(sys.argv) > 1 else "Dunning-Kruger effect"
    channel = sys.argv[2] if len(sys.argv) > 2 else "ch1"
    brief = research(topic, channel)
    print(json.dumps({
        "topic": brief.topic,
        "key_facts": brief.key_facts,
        "specific_numbers": brief.specific_numbers,
        "named_entities": brief.named_entities,
        "sources": brief.sources,
    }, indent=2))
