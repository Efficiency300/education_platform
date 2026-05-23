import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Locale, LOCALES, translate } from "../i18n";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const KEY = "ai_mentor_locale";
const LocaleContext = createContext<Ctx | null>(null);

export function useLocale(): Ctx {
  const v = useContext(LocaleContext);
  if (!v) throw new Error("useLocale must be used inside <LocaleProvider>");
  return v;
}

/** Удобный хук — только функция перевода. */
export function useT() {
  return useLocale().t;
}

function detectInitial(): Locale {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  } catch {}
  const nav = (typeof navigator !== "undefined" ? navigator.language : "") || "";
  const code = nav.toLowerCase().slice(0, 2);
  if (code === "uz") return "uz";
  if (code === "en") return "en";
  return "ru";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitial());

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo<Ctx>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
