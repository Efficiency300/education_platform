import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, getToken } from "../api";
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
  const [cache, setCache] = useState<Cache>(() => loadCache());
  const pendingRef = useRef<Set<string>>(new Set());
  const [pendingTick, setPendingTick] = useState(0); // forces re-render when pending set changes
  const flushTimer = useRef<number | null>(null);
  const queueRef = useRef<Set<string>>(new Set());

  // Persist any time the cache changes.
  useEffect(() => {
    saveCache(cache);
  }, [cache]);

  const ensure = useCallback(
    (text: string) => {
      if (!text || locale === SOURCE_LOCALE) return;
      if (!getToken()) return; // skip pre-auth (login/register screens)
      if (cache[locale]?.[text]) return;
      if (pendingRef.current.has(text)) return;
      queueRef.current.add(text);

      // Debounce: collect a few strings within ~80ms so the dashboard fires
      // one bulk request instead of N parallel ones.
      if (flushTimer.current !== null) return;
      flushTimer.current = window.setTimeout(async () => {
        flushTimer.current = null;
        const batch = Array.from(queueRef.current).filter((t) => {
          if (cache[locale]?.[t]) return false;
          if (pendingRef.current.has(t)) return false;
          return true;
        });
        queueRef.current.clear();
        if (batch.length === 0) return;

        batch.forEach((t) => pendingRef.current.add(t));
        setPendingTick((n) => n + 1);

        try {
          const items: Record<string, string> = {};
          batch.forEach((t, idx) => {
            // Use a unique key per request — the response maps back to it.
            items[`k${idx}`] = t;
          });
          const res = await api.translateBulk(items, locale);
          setCache((prev) => {
            const next: Cache = { ...prev, [locale]: { ...(prev[locale] ?? {}) } };
            batch.forEach((t, idx) => {
              const out = res.items[`k${idx}`];
              if (out) next[locale][t] = out;
            });
            return next;
          });
        } catch {
          /* keep original text on failure; UI will retry on the next ensure() */
        } finally {
          batch.forEach((t) => pendingRef.current.delete(t));
          setPendingTick((n) => n + 1);
        }
      }, 80);
    },
    [locale, cache],
  );

  const ensureMany = useCallback(
    (texts: string[]) => {
      for (const t of texts) ensure(t);
    },
    [ensure],
  );

  const translated = useCallback(
    (text: string) => {
      if (!text || locale === SOURCE_LOCALE) return text;
      return cache[locale]?.[text] ?? text;
    },
    [cache, locale],
  );

  const pending = useCallback(
    (text: string) => locale !== SOURCE_LOCALE && pendingRef.current.has(text),
    [locale, pendingTick],
  );

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
