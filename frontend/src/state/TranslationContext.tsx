import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Locale } from "../i18n";
import { useLocale } from "./LocaleContext";

/**
 * Run-time translation of free-form content (course titles, lesson bodies, etc.)
 * stored in a single source language. Results are cached in localStorage so
 * subsequent renders are free; in-flight translations are de-duped per session
 * so the same string isn't requested twice in parallel.
 */

const STORAGE_KEY = "kompas_translation_cache_v1";
const SOURCE_LOCALE: Locale = "ru";

type Cache = Record<string, Record<string, string>>; // locale → text → translation

interface Ctx {
  /** Synchronous read: returns the cached translation or the original text. */
  translated: (text: string) => string;
  /** Kicks off a background translation when locale ≠ source and we don't have it cached. */
  ensure: (text: string) => void;
  /** Bulk variant for a list of strings (e.g. course catalog on first render). */
  ensureMany: (texts: string[]) => void;
  /** Whether a translation is currently in flight for the given text. */
  pending: (text: string) => boolean;
}

const TranslationCtx = createContext<Ctx | null>(null);

function loadCache(): Cache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* quota exceeded — silently skip */
  }
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [cache] = useState<Cache>(() => loadCache());

  // IMPORTANT: ``ensure`` / ``ensureMany`` are intentionally no-ops now.
  //
  // Previously each open of a page (dashboard / courses / simulator) fanned out
  // dozens of /api/translate calls so RU source strings would re-render in UZ
  // or EN. That hammered the Gemini quota — every navigation burned tokens
  // even though the user hadn't asked for anything. We now ship inline UZ/EN
  // translations for the catalog + simulator content from the backend, and
  // anything we don't have a translation for falls back to the source string.
  //
  // Gemini is hit only when the user actively talks to the mascot (/api/chat)
  // or HR explicitly clicks "Translate" on a chat reply.
  const ensure = useCallback((_text: string) => {
    /* no-op: see comment above */
  }, []);

  const ensureMany = useCallback((_texts: string[]) => {
    /* no-op: see comment above */
  }, []);

  const translated = useCallback(
    (text: string) => {
      if (!text || locale === SOURCE_LOCALE) return text;
      // Honour the cache if something already lives there from a prior session
      // — we don't WRITE new entries, but old entries are still valid lookups.
      return cache[locale]?.[text] ?? text;
    },
    [cache, locale],
  );

  const pending = useCallback((_text: string) => false, []);

  const value = useMemo<Ctx>(
    () => ({ translated, ensure, ensureMany, pending }),
    [translated, ensure, ensureMany, pending],
  );

  return <TranslationCtx.Provider value={value}>{children}</TranslationCtx.Provider>;
}

export function useTranslation(): Ctx {
  const v = useContext(TranslationCtx);
  if (!v) throw new Error("useTranslation must be used inside <TranslationProvider>");
  return v;
}

/**
 * Convenience hook for a single value: returns the translated text (or the
 * original while a background fetch is in flight) and schedules the fetch on
 * first use.
 */
export function useTranslated(text: string): string {
  const { translated, ensure } = useTranslation();
  useEffect(() => {
    if (text) ensure(text);
  }, [text, ensure]);
  return translated(text);
}
