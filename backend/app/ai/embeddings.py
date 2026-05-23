"""Gemini text embeddings via REST.

We call the Generative Language API directly with ``httpx`` instead of pulling
in the full ``google-generativeai`` SDK — it saves a heavy dependency tree
(protobuf, grpcio) and keeps the embedding code under our control.

The module is safe to import even when no API key is configured: the helpers
return zero vectors so downstream code (vector store, RAG) can still execute
without exploding. The vector store itself refuses to upsert/search until a
real provider is active, so we never pollute Qdrant with empty embeddings.
"""
from __future__ import annotations

import logging
from typing import Iterable

import httpx

from app.core.config import settings


log = logging.getLogger("app.embeddings")

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def embeddings_available() -> bool:
    """True iff we have everything we need to ask Gemini for an embedding."""
    return bool(settings.gemini_api_key)


def _zero_vector() -> list[float]:
    return [0.0] * settings.embedding_dim


async def embed_text(text: str) -> list[float]:
    """Embed a single string. Returns a zero-vector in mock mode so callers
    can keep code paths uniform — they should check ``embeddings_available()``
    before storing the result anywhere."""
    if not embeddings_available():
        return _zero_vector()
    text = (text or "").strip()
    if not text:
        return _zero_vector()
    url = f"{_GEMINI_BASE}/models/{settings.gemini_embedding_model}:embedContent"
    body = {
        "content": {"parts": [{"text": text[:8192]}]},
        "taskType": "RETRIEVAL_DOCUMENT",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                params={"key": settings.gemini_api_key},
                json=body,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        log.exception("Gemini embedding failed; returning zero vector")
        return _zero_vector()
    values = (data.get("embedding") or {}).get("values") or []
    if not values:
        return _zero_vector()
    return [float(v) for v in values]


async def embed_query(text: str) -> list[float]:
    """Same shape as ``embed_text`` but uses the ``RETRIEVAL_QUERY`` task type
    so Gemini returns embeddings tuned for asymmetric search."""
    if not embeddings_available():
        return _zero_vector()
    text = (text or "").strip()
    if not text:
        return _zero_vector()
    url = f"{_GEMINI_BASE}/models/{settings.gemini_embedding_model}:embedContent"
    body = {
        "content": {"parts": [{"text": text[:8192]}]},
        "taskType": "RETRIEVAL_QUERY",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                params={"key": settings.gemini_api_key},
                json=body,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        log.exception("Gemini query embedding failed; returning zero vector")
        return _zero_vector()
    values = (data.get("embedding") or {}).get("values") or []
    if not values:
        return _zero_vector()
    return [float(v) for v in values]


async def embed_batch(texts: Iterable[str]) -> list[list[float]]:
    """Sequential embedding for now — Gemini's REST API allows ``batchEmbedContents``
    but the convenience isn't worth the extra branching for a small (per-file)
    chunk count. If we ever start uploading book-length documents, swap this
    for a single batched call."""
    out: list[list[float]] = []
    for t in texts:
        out.append(await embed_text(t))
    return out
