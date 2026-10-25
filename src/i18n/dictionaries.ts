import { cache } from "react";
import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, localeHref, type Locale } from "./config";
import { translate, withFallback, type Vars } from "./translate";

export { translate };

// UI strings live in src/messages/{locale}/{namespace}.json.
// Each feature owns one namespace file; add new namespaces to the loader below.
const loaders = {
  en: async () => ({
    common: (await import("@/messages/en/common.json")).default,
    booking: (await import("@/messages/en/booking.json")).default,
    home: (await import("@/messages/en/home.json")).default,
    fleet: (await import("@/messages/en/fleet.json")).default,
    account: (await import("@/messages/en/account.json")).default,
    agreement: (await import("@/messages/en/agreement.json")).default,
  }),
  ar: async () => ({
    common: (await import("@/messages/ar/common.json")).default,
    booking: (await import("@/messages/ar/booking.json")).default,
    home: (await import("@/messages/ar/home.json")).default,
    fleet: (await import("@/messages/ar/fleet.json")).default,
    account: (await import("@/messages/ar/account.json")).default,
    agreement: (await import("@/messages/ar/agreement.json")).default,
  }),
} satisfies Record<Locale, () => Promise<Record<string, unknown>>>;

export type Messages = Awaited<ReturnType<(typeof loaders)["en"]>>;

/** Current locale from the root `[lang]` segment. Server Components only. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

/** A locale's messages, with English filling any key not translated yet. Once per request. */
const load = cache(async (locale: Locale): Promise<Messages> => {
  const en = await loaders.en();
  if (locale === "en") return en;
  return withFallback(en, await loaders[locale]());
});

export async function getMessages(): Promise<Messages> {
  return load(await getLocale());
}

/** Server-side translator for one namespace: `const t = await getT("common"); t("nav.fleet")`. */
export async function getT<N extends keyof Messages>(namespace: N) {
  const messages = await getMessages();
  return (key: string, vars?: Vars) => translate(messages[namespace] as Record<string, unknown>, key, vars);
}

/** Server-side path builder: `const href = await getHref(); href("/cars")`. */
export async function getHref() {
  const locale = await getLocale();
  return (path: string) => localeHref(locale, path);
}
