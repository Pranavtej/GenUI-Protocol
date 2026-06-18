import numpy as np
from typing import List
from src.knowledge.loader import load_and_chunk_all
from src.config import settings


class VectorStore:
    def __init__(self):
        self._chunks: list[dict] = []
        self._embeddings: np.ndarray | None = None
        self._initialized = False

    @property
    def is_initialized(self) -> bool:
        return self._initialized

    def initialize(self, chunks: list[dict] | None = None):
        if chunks is None:
            chunks = load_and_chunk_all()
        if not chunks:
            raise ValueError("No chunks to embed")

        self._chunks = chunks
        texts = [c["content"] for c in chunks]
        self._embeddings = self._embed(texts)
        self._initialized = True

    def _embed(self, texts: list[str]) -> np.ndarray:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.resolved_openai_key)
            batch: list[str] = []
            all_embeddings: list[list[float]] = []
            for t in texts:
                batch.append(t)
                if len(batch) >= 20:
                    resp = client.embeddings.create(model="text-embedding-3-small", input=batch)
                    all_embeddings.extend([d.embedding for d in resp.data])
                    batch = []
            if batch:
                resp = client.embeddings.create(model="text-embedding-3-small", input=batch)
                all_embeddings.extend([d.embedding for d in resp.data])
            return np.array(all_embeddings, dtype=np.float32)
        except Exception:
            from langchain_openai import OpenAIEmbeddings
            embedder = OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=settings.resolved_openai_key,
            )
            raw = embedder.embed_documents(texts)
            return np.array(raw, dtype=np.float32)

    def similarity_search(self, query: str, k: int = 5) -> list[dict]:
        if not self._initialized:
            raise RuntimeError("VectorStore not initialized")
        q_emb = self._embed([query])[0]
        scores = np.dot(self._embeddings, q_emb) / (
            np.linalg.norm(self._embeddings, axis=1) * np.linalg.norm(q_emb) + 1e-10
        )
        top_indices = np.argsort(scores)[-k:][::-1]
        results = []
        for idx in top_indices:
            results.append({**self._chunks[idx], "score": float(scores[idx])})
        return results

    def format_context(self, query: str, k: int = 5) -> str:
        docs = self.similarity_search(query, k=k)
        if not docs:
            return ""
        parts = []
        for d in docs:
            parts.append(f"[Source: {d['source']} - {d['section']}]\n{d['content']}")
        return "\n\n---\n\n".join(parts)


vector_store = VectorStore()
