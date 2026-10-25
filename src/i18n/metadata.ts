import { locales, localeHref, ogLocales, defaultLocale, isLocale } from "./config";

// Language alternates for page metadata: the canonical URL in this locale, hreflang links to
// every locale and x-default (English). Paths are resolved against metadataBase.

export function alternatesFor(locale: string, path: string) {
  const languages: Record<string, string> = Object.fromEntries(locales.map((l) => [l, localeHref(l, path)]));
  languages["x-default"] = localeHref(defaultLocale, path);
  return { canonical: localeHref(locale, path), languages };
}

/** Open Graph `locale` and `alternateLocale` for a page in this locale. */
export function ogLocaleFor(locale: string) {
  const current = isLocale(locale) ? locale : defaultLocale;
  return { locale: ogLocales[current], alternateLocale: locales.filter((l) => l !== current).map((l) => ogLocales[l]) };
}
