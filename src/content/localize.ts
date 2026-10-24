import type { Car, Category, DeliveryZone, Offer, Season, Tier } from "./types";
import { rules, cancellation } from "./rules";
import { site } from "./site";
import { brandCountriesAr, carsAr, categoriesAr, offersAr, rulesAr, seasonsAr, siteAr, tiersAr, zonesAr } from "./ar/data";

// Locale views of the data modules. English returns the data as it is; Arabic swaps in the text
// from content/ar/data.ts, field by field, falling back to English for anything not translated.
// Numbers, slugs, prices and rules never change between locales.

const ar = (locale?: string) => locale === "ar";

export function localizeCar(car: Car, locale?: string): Car {
  const t = ar(locale) ? carsAr[car.slug] : undefined;
  if (!t) return car;
  return {
    ...car,
    tagline: t.tagline,
    paint: { ...car.paint, name: t.paint ?? car.paint.name },
    specs: { ...car.specs, body: t.body, engine: t.engine },
    details: { interior: t.interior, wheels: t.wheels, equipment: t.equipment },
  };
}

export const localizeCars = (list: Car[], locale?: string) => (ar(locale) ? list.map((c) => localizeCar(c, locale)) : list);

export function localizeCategory<C extends Category | undefined>(c: C, locale?: string): C {
  const t = c && ar(locale) ? categoriesAr[c.slug] : undefined;
  return (t ? { ...c, ...t } : c) as C;
}

export const brandCountry = (slug: string, country: string, locale?: string) => (ar(locale) ? brandCountriesAr[slug] ?? country : country);

export function localizeZone<Z extends DeliveryZone | undefined>(z: Z, locale?: string): Z {
  const t = z && ar(locale) ? zonesAr[z.slug] : undefined;
  return (t ? { ...z, name: t.name, areas: t.areas, note: t.note ?? z?.note } : z) as Z;
}

export const localizeZones = (list: DeliveryZone[], locale?: string) => (ar(locale) ? list.map((z) => localizeZone(z, locale)) : list);

export function localizeOffer(o: Offer, locale?: string): Offer {
  const t = ar(locale) ? offersAr[o.id] : undefined;
  return t ? { ...o, ...t } : o;
}

export const seasonName = (s: Season, locale?: string) => (ar(locale) ? seasonsAr[s.id] ?? s.name : s.name);

export const tierName = (tier: Tier, locale?: string) => (ar(locale) ? tiersAr[tier] ?? rules.tiers[tier].name : rules.tiers[tier].name);

export const chauffeurIncluded = (locale?: string) => (ar(locale) ? rulesAr.chauffeurIncluded ?? rules.chauffeur.included : rules.chauffeur.included);

export const cancellationSummary = (locale?: string) => (ar(locale) ? rulesAr.cancellationSummary ?? cancellation.summary : cancellation.summary);

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : T[K] extends readonly unknown[] ? T[K] : T[K] extends object ? Widen<T[K]> : T[K] };

/** Site settings with the display text in the visitor's language (contact details are unchanged). */
export function siteFor(locale?: string): Widen<typeof site> {
  if (!ar(locale)) return site;
  return {
    ...site,
    hours: siteAr.hours ?? site.hours,
    replyPromise: siteAr.replyPromise ?? site.replyPromise,
    address: { ...site.address, ...Object.fromEntries(Object.entries(siteAr.address ?? {}).filter(([, v]) => !!v)) },
    consumerProtection: { ...site.consumerProtection, name: siteAr.consumerProtectionName ?? site.consumerProtection.name },
  };
}
