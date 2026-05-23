"""Qdrant-backed vector knowledge base.

Single collection (``settings.qdrant_collection``) holds chunks from every
knowledge file. Each point carries metadata:

    {
        "file_id":   int    — FK to KnowledgeFile.id
        "filename":  str
        "direction": str    — e.g. "Backend" / "HR"; "" for unclassified
        "title":     str    — first line of the markdown / display name
        "text":      str    — the raw chunk text we return on hit
    }

Search filters by ``direction`` when the caller passes one, so the AI
assistant can scope retrieval to the user's department/job_title.

Everything degrades gracefully:
  * No ``QDRANT_URL`` configured → the module exposes an inert stub and the
    RAG layer keeps using BM25 on local markdown files.
  * Gemini key missing → embeddings come back as zero vectors and we refuse
    to upsert; the vector store never gets polluted.
"""
from __future__ import annotations

import logging
import re
import uuid
from dataclasses import dataclass
from typing import Optional

from app.ai.embeddings import embed_query, embed_text, embeddings_available
from app.core.config import settings


log = logging.getLogger("app.vector_store")


@dataclass
class VectorHit:
    """One search result. Mirrors the shape of ``rag.Chunk`` so callers can
    blend hits from both indexers without branching everywhere."""

    file_id: int | None
    filename: str
    title: str
    text: str
    direction: str
    score: float


def _split_into_chunks(text: str, chunk_size: int = 500, overlap: int = 80) -> list[str]:
    """Roughly word-aware splitter. Keeps chunks small enough for the 768-dim
    embedding to stay focused, but with overlap so we don't slice a sentence
    in half between two points."""
    text = (text or "").strip()
    if not text:
        return []
    words = text.split()
    chunks: list[str] = []
    step = max(1, chunk_size - overlap)
    for start in range(0, len(words), step):
        piece = " ".join(words[start : start + chunk_size]).strip()
        if piece:
            chunks.append(piece)
        if start + chunk_size >= len(words):
            break
    return chunks


def _doc_title(text: str, fallback: str) -> str:
    line = next((ln for ln in (text or "").splitlines() if ln.strip()), "")
    return line.lstrip("# ").strip()[:200] or fallback


def _strip_markdown(text: str) -> str:
    cleaned = re.sub(r"```.*?```", " ", text or "", flags=re.S)
    cleaned = re.sub(r"[*_`>#-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


class QdrantStore:
    """Thin wrapper. Lazy connection so import order doesn't matter."""

    def __init__(self) -> None:
        self._client = None
        self._ready: bool = False

    # ---- lifecycle -------------------------------------------------------

    def is_enabled(self) -> bool:
        return bool(settings.qdrant_url)

    async def init(self) -> None:
        """Ensure the collection exists. Called once on app startup. Silent
        no-op when Qdrant isn't configured so dev still works."""
        if not self.is_enabled():
            log.info("qdrant: disabled (QDRANT_URL not set)")
            return
        try:
            from qdrant_client import AsyncQdrantClient
            from qdrant_client.http import models as qm
        except Exception:
            log.exception("qdrant-client not installed; vector search disabled")
            return

        client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        try:
            exists = await client.collection_exists(settings.qdrant_collection)
            if not exists:
                await client.create_collection(
                    collection_name=settings.qdrant_collection,
                    vectors_config=qm.VectorParams(
                        size=settings.embedding_dim,
                        distance=qm.Distance.COSINE,
                    ),
                )
                # Index direction so we can filter by it cheaply.
                await client.create_payload_index(
                    collection_name=settings.qdrant_collection,
                    field_name="direction",
                    field_schema=qm.PayloadSchemaType.KEYWORD,
                )
                await client.create_payload_index(
                    collection_name=settings.qdrant_collection,
                    field_name="file_id",
                    field_schema=qm.PayloadSchemaType.INTEGER,
                )
            self._client = client
            self._ready = True
            log.info("qdrant: ready on %s", settings.qdrant_url)
        except Exception:
            log.exception("qdrant: init failed; vector search will be skipped")
            self._client = None
            self._ready = False

    # ---- writes ----------------------------------------------------------

    async def index_file(
        self,
        *,
        file_id: int,
        filename: str,
        text: str,
        direction: str = "",
    ) -> int:
        """Embed every chunk of ``text`` and upsert into Qdrant. Returns the
        number of chunks indexed. No-op when Qdrant or embeddings aren't
        available — caller can still rely on the on-disk markdown."""
        if not self._ready or self._client is None:
            return 0
        if not embeddings_available():
            log.info("qdrant: skipping index (GEMINI_API_KEY missing)")
            return 0

        # Delete any stale chunks from a previous version of this file first
        # so re-uploads don't leak old content into search results.
        await self.forget_file(file_id)

        title = _doc_title(text, filename)
        chunks = _split_into_chunks(_strip_markdown(text))
        if not chunks:
            return 0

        try:
            from qdrant_client.http import models as qm
        except Exception:
            return 0

        points: list = []
        for chunk in chunks:
            vec = await embed_text(chunk)
            if all(v == 0.0 for v in vec):
                # Embedding genuinely failed (rate limit / network). Skip the
                # chunk rather than poison the collection with zeros.
                continue
            points.append(
                qm.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vec,
                    payload={
                        "file_id": file_id,
                        "filename": filename,
                        "direction": direction or "",
                        "title": title,
                        "text": chunk,
                    },
                )
            )
        if not points:
            return 0
        try:
            await self._client.upsert(
                collection_name=settings.qdrant_collection,
                points=points,
            )
        except Exception:
            log.exception("qdrant: upsert failed")
            return 0
        return len(points)

    async def forget_file(self, file_id: int) -> int:
        """Delete every point belonging to a given file. Used on re-upload or
        deletion."""
        if not self._ready or self._client is None:
            return 0
        try:
            from qdrant_client.http import models as qm
        except Exception:
            return 0
        try:
            await self._client.delete(
                collection_name=settings.qdrant_collection,
                points_selector=qm.FilterSelector(
                    filter=qm.Filter(
                        must=[
                            qm.FieldCondition(
                                key="file_id",
                                match=qm.MatchValue(value=int(file_id)),
                            )
                        ]
                    )
                ),
            )
        except Exception:
            log.exception("qdrant: delete by file_id failed")
            return 0
        return 1

    # ---- reads -----------------------------------------------------------

    async def search(
        self,
        query: str,
        *,
        top_k: int = 5,
        direction: Optional[str] = None,
    ) -> list[VectorHit]:
        if not self._ready or self._client is None:
            return []
        if not embeddings_available():
            return []
        vec = await embed_query(query)
        if all(v == 0.0 for v in vec):
            return []

        try:
            from qdrant_client.http import models as qm
        except Exception:
            return []

        flt = None
        if direction:
            flt = qm.Filter(
                must=[
                    qm.FieldCondition(
                        key="direction",
                        match=qm.MatchValue(value=direction.strip()),
                    )
                ]
            )

        try:
            results = await self._client.search(
                collection_name=settings.qdrant_collection,
                query_vector=vec,
                query_filter=flt,
                limit=max(1, min(20, top_k)),
                with_payload=True,
            )
        except Exception:
            log.exception("qdrant: search failed")
            return []

        hits: list[VectorHit] = []
        for r in results:
            payload = r.payload or {}
            hits.append(
                VectorHit(
                    file_id=payload.get("file_id"),
                    filename=str(payload.get("filename") or ""),
                    title=str(payload.get("title") or payload.get("filename") or ""),
                    text=str(payload.get("text") or ""),
                    direction=str(payload.get("direction") or ""),
                    score=float(r.score or 0.0),
                )
            )
        return hits

    async def distinct_directions(self) -> list[str]:
        """Walk a small slice of the collection to return the directions
        we've ever indexed. Used to power the admin-panel autocomplete."""
        if not self._ready or self._client is None:
            return []
        try:
            from qdrant_client.http import models as qm
        except Exception:
            return []
        directions: set[str] = set()
        try:
            offset = None
            for _ in range(20):  # ≤ 2000 points scanned, plenty for autocomplete
                resp, offset = await self._client.scroll(
                    collection_name=settings.qdrant_collection,
                    limit=100,
                    with_payload=True,
                    offset=offset,
                )
                for p in resp:
                    d = str((p.payload or {}).get("direction") or "").strip()
                    if d:
                        directions.add(d)
                if offset is None:
                    break
        except Exception:
            log.exception("qdrant: scroll for directions failed")
        return sorted(directions)


# Module-level singleton — call ``init()`` from app startup.
vector_store = QdrantStore()
