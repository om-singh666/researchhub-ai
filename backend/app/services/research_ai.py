from __future__ import annotations

from typing import Sequence

try:
    import numpy as np
except Exception:
    np = None

try:
    from groq import Groq
except Exception:
    Groq = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    SentenceTransformer = None

from app.core.config import settings

embedding_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer | None:
    if SentenceTransformer is None:
        return None
    global embedding_model
    if embedding_model is None:
        try:
            embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            embedding_model = None
    return embedding_model


def rank_papers(question: str, papers: Sequence[object]) -> list[object]:
    model = get_embedding_model()
    if not papers:
        return []
    if model is None:
        return list(papers)[:4]

    corpus = [f"{paper.title}\n{paper.abstract}" for paper in papers]
    question_embedding = model.encode([question])[0]
    corpus_embeddings = model.encode(corpus)
    scored = []
    for paper, embedding in zip(papers, corpus_embeddings):
        similarity = cosine_similarity(question_embedding, embedding)
        scored.append((similarity, paper))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [paper for _, paper in scored[:4]]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if np is None:
        return 0.0
    denominator = np.linalg.norm(a) * np.linalg.norm(b)
    if denominator == 0:
        return 0.0
    return float(np.dot(a, b) / denominator)


def generate_answer(question: str, papers: Sequence[object]) -> tuple[str, list[str]]:
    top_papers = rank_papers(question, papers)
    citations = [paper.title for paper in top_papers]
    context = "\n\n".join(
        f"Title: {paper.title}\nAuthors: {paper.authors}\nAbstract: {paper.abstract}"
        for paper in top_papers
    )

    if settings.groq_api_key and Groq is not None:
        try:
            client = Groq(api_key=settings.groq_api_key)
            completion = client.chat.completions.create(
                model=settings.groq_model,
                temperature=0.3,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are ResearchHub AI, a precise academic assistant. "
                            "Use only the provided paper context and mention gaps when evidence is limited."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Question: {question}\n\nPaper context:\n{context}",
                    },
                ],
            )
            answer = completion.choices[0].message.content or "No response generated."
            return answer, citations
        except Exception:
            pass

    if not top_papers:
        return (
            "No papers are available in this workspace yet. Import some papers first and then ask a question.",
            [],
        )

    summary_lines = [
        f"Based on {len(top_papers)} paper(s), the strongest signals for '{question}' are:"
    ]
    for paper in top_papers:
        snippet = paper.abstract[:220].strip()
        if len(paper.abstract) > 220:
            snippet += "..."
        summary_lines.append(f"- {paper.title}: {snippet}")
    summary_lines.append(
        "This is a fallback local answer. Add a valid GROQ_API_KEY for model-generated synthesis."
    )
    return "\n".join(summary_lines), citations
