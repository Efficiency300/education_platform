import { LOCALES, LOCALE_META, Locale } from "../i18n";
import { useLocale } from "../state/LocaleContext";

const LABEL: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};

const SHORT: Record<Locale, string> = {
  uz: "UZ",
  ru: "RU",
  en: "EN",
};

/** Sidebar / settings — full pill group with brand-filled active state. */
export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="lang-wrap" role="group" aria-label={t("lang.label")}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l as Locale)}
          className={`lang-btn ${l === locale ? "lang-btn-active" : ""}`}
          aria-pressed={l === locale}
          title={LOCALE_META[l as Locale].label}
        >
          {LABEL[l as Locale]}
        </button>
      ))}
    </div>
  );
}

/** Compact short-form pill group (auth screens, topbar). */
export function LanguageInline() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="lang-wrap">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l as Locale)}
          className={`lang-btn ${l === locale ? "lang-btn-active" : ""}`}
          title={LOCALE_META[l as Locale].label}
        >
          {SHORT[l as Locale]}
        </button>
      ))}
    </div>
  );
}
