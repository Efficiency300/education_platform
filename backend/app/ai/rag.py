"""Лёгкая RAG-индексация на BM25 поверх Markdown-регламентов.

Для MVP не использует векторных БД — индекс строится в памяти при старте.
В проде можно заменить на pgvector / Qdrant без изменения интерфейса.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from rank_bm25 import BM25Okapi


@dataclass
class Chunk:
    doc_title: str
    text: str
    source_path: str


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[\w\-]+", text.lower(), flags=re.UNICODE)


def _split_into_chunks(text: str, chunk_size: int = 400, overlap: int = 60) -> list[str]:
    words = text.split()
    if not words:
        return []
    chunks: list[str] = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i : i + chunk_size]))
        i += chunk_size - overlap
    return chunks


class RagIndex:
    def __init__(self) -> None:
        self.chunks: list[Chunk] = []
        self._bm25: BM25Okapi | None = None
        self._tokenized: list[list[str]] = []

    def load_dir(self, directory: Path) -> int:
        self.chunks.clear()
        self._tokenized.clear()
        if not directory.exists():
            self._bm25 = None
            return 0

        for path in sorted(directory.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            title = text.splitlines()[0].lstrip("# ").strip() if text else path.stem
            for chunk_text in _split_into_chunks(text):
                self.chunks.append(
                    Chunk(doc_title=title, text=chunk_text, source_path=str(path.name))
                )
                self._tokenized.append(_tokenize(chunk_text))

        if self._tokenized:
            self._bm25 = BM25Okapi(self._tokenized)
        else:
            self._bm25 = None
        return len(self.chunks)

    def search(self, query: str, top_k: int = 4) -> list[tuple[Chunk, float]]:
        if not self._bm25 or not self.chunks:
            return []
        tokens = _tokenize(query)
        if not tokens:
            return []
        scores = self._bm25.get_scores(tokens)
        ranked = sorted(
            zip(self.chunks, scores), key=lambda x: x[1], reverse=True
        )
        # отбрасываем нулевые скоры
        return [(c, float(s)) for c, s in ranked[:top_k] if s > 0]


rag_index = RagIndex()
