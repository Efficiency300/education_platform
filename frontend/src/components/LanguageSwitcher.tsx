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

/** Sidebar — short pill group to keep the 220px column tidy. */
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
          title={LABEL[l as Locale]}
        >
          {SHORT[l as Locale]}
        </button>
      ))}
    </div>
  );
}

/** Long-form pill group for auth screens where space allows full labels. */
export function LanguageInline() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="lang-wrap lang-wrap-inline">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l as Locale)}
          className={`lang-btn ${l === locale ? "lang-btn-active" : ""}`}
          title={LOCALE_META[l as Locale].label}
          style={{ flex: "0 0 auto" }}
        >
          {LABEL[l as Locale]}
        </button>
      ))}
    </div>
  );
}
