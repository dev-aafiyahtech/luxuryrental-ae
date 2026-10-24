// Locale routing: English lives at the root ("/cars"), other locales get a prefix ("/ar/cars").
// Arabic (right to left) is the demo's machine-assisted translation, to be reviewed in Phase 3.

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirOf(locale: string): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Public URL for a path in a locale. English is unprefixed. */
export function localeHref(locale: string, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
