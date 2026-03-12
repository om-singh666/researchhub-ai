from urllib.parse import quote_plus
from xml.etree import ElementTree

import httpx


async def search_arxiv(query: str) -> list[dict]:
    url = (
        "http://export.arxiv.org/api/query?"
        f"search_query=all:{quote_plus(query)}&start=0&max_results=8&sortBy=relevance"
    )
    results: list[dict] = []

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
        except Exception:
            return mock_search_results(query)

    root = ElementTree.fromstring(response.text)
    namespace = {"atom": "http://www.w3.org/2005/Atom"}

    for entry in root.findall("atom:entry", namespace):
        authors = [author.findtext("atom:name", default="", namespaces=namespace) for author in entry.findall("atom:author", namespace)]
        results.append(
            {
                "title": (entry.findtext("atom:title", default="", namespaces=namespace) or "").strip(),
                "authors": ", ".join(filter(None, authors)),
                "abstract": (entry.findtext("atom:summary", default="", namespaces=namespace) or "").strip(),
                "source": "arxiv",
                "url": entry.findtext("atom:id", default="", namespaces=namespace) or "",
                "published_at": entry.findtext("atom:published", default="", namespaces=namespace) or "",
            }
        )
    return results or mock_search_results(query)


def mock_search_results(query: str) -> list[dict]:
    return [
        {
            "title": f"{query.title()} Research Trends and Opportunities",
            "authors": "A. Sharma, R. Patel",
            "abstract": (
                f"This mock paper explores recent methods, benchmarks, and open challenges in {query}. "
                "It is used when live academic search APIs are unavailable."
            ),
            "source": "mock",
            "url": "https://example.org/researchhub-demo-paper-1",
            "published_at": "2025-07-14",
        },
        {
            "title": f"Context-Aware Agents for {query.title()}",
            "authors": "M. Verma, S. Khan",
            "abstract": (
                f"This study focuses on agentic systems for {query}, with emphasis on retrieval, orchestration, and evaluation."
            ),
            "source": "mock",
            "url": "https://example.org/researchhub-demo-paper-2",
            "published_at": "2024-11-20",
        },
    ]
