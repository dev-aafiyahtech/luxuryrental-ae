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

/** Each language's name in that language, for the language switcher. Never translated. */
export const localeNames: Record<Locale, string> = { en: "English", ar: "العربية" };

/** Open Graph locale for each site locale (UAE audience). */
export const ogLocales: Record<Locale, string> = { en: "en_AE", ar: "ar_AE" };

/** The other language on this two-language site (the switcher's target). */
export const otherLocale = (locale: string): Locale => (locale === "ar" ? "en" : "ar");

/** Drop a locale prefix from a pathname: "/ar/cars" → "/cars", "/en" → "/", "/cars" → "/cars". */
export function stripLocale(pathname: string): string {
  const [, first = "", ...rest] = pathname.split("/");
  if (!isLocale(first)) return pathname || "/";
  return rest.length ? `/${rest.join("/")}` : "/";
}

/**
 * Keep a left-to-right run (phone number, booking reference, licence or plate code) in order
 * inside Arabic text when it is interpolated into a plain string, such as a translated message
 * or an aria-label. Wraps it in Unicode isolates (LRI … PDI). In JSX prefer `<span dir="ltr">`.
 * Not for metadata or structured data, where the invisible marks would leak into search results.
 */
export const ltr = (value: string | number) => `⁦${value}⁩`;

/**
 * `ltr()` for Arabic pages, a no-op for English: for Latin names inside Arabic text, so a model
 * such as "296 GTS" or "750S Spider" isn't reordered to "GTS 296" by the bidi algorithm.
 */
export const isolateFor = (locale: string) => (value: string) => (dirOf(locale) === "rtl" ? ltr(value) : value);
