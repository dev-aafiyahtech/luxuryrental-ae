import { cars } from "@/content/cars";
import { brands } from "@/content/brands";
import { rules } from "@/content/rules";
import type { Car, Tier } from "@/content/types";
import { formatAED, formatNumber } from "@/lib/format";
import { monthName } from "@/lib/dates";
import { seasonName, tierName as localTierName } from "@/content/localize";
import { arabicCount, arabicUnits, type CountUnit } from "@/content/ar/data";

// Shared helpers for the content pages (chauffeur, delivery, pricing, requirements, about,
// FAQ, contact, legal). Numbers are always read from the data modules so a rate change
// in cars.ts / rules.ts / zones.ts updates every page, FAQ and legal summary at once.
//
// Every text helper takes an optional last `locale` argument. Without it (or with "en") the
// output is exactly the English it has always been; with "ar" it returns Arabic for UAE readers
// (Western digits, Gregorian month names, CLDR plural forms for counted nouns).

const isAr = (locale?: string) => locale === "ar";

export { arabicCount, arabicUnits, type ArabicCountForms, type CountUnit } from "@/content/ar/data";

const UNITS_EN: Record<CountUnit, [string, string]> = {
  day: ["day", "days"], hour: ["hour", "hours"], minute: ["minute", "minutes"], month: ["month", "months"], year: ["year", "years"],
  week: ["week", "weeks"], passenger: ["passenger", "passengers"], seat: ["seat", "seats"], hp: ["hp", "hp"], ps: ["PS", "PS"], second: ["second", "seconds"],
  car: ["car", "cars"], brand: ["brand", "brands"], question: ["question", "questions"], answer: ["answer", "answers"], age: ["year", "years"],
};

/**
 * A number with its noun: "3 days", "1 day", "1,001 hp". Arabic follows CLDR plural agreement:
 * "3 أيام", "يوم واحد", "21 يوماً", "يومين" ("يومان" with `nominative`, for a subject or a standalone value).
 */
export function countText(n: number, unit: CountUnit, locale?: string, nominative = false): string {
  if (isAr(locale)) return arabicCount(n, arabicUnits[unit], nominative);
  const [one, many] = UNITS_EN[unit];
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}

/** "2 seats", "4–5 seats", "2+2 seats"; Arabic "مقعدان", "5 مقاعد", "4–5 مقاعد", "مقاعد 2+2". For a car's `specs.seats`. */
export function seatsText(seats: string, locale?: string): string {
  if (!isAr(locale)) return `${seats} seats`;
  if (/^\d+$/.test(seats)) return countText(Number(seats), "seat", locale, true);
  return seats.includes("+") ? `مقاعد ${seats}` : `${seats} مقاعد`;
}

/** Left-to-right isolate (LRI … PDI) for a Latin run inside Arabic text: phone numbers, time ranges, legal names. No-op in English. */
export const ltr = (text: string, locale?: string) => (isAr(locale) ? `\u2066${text}\u2069` : text);

/** Date the fact pages (pricing, requirements) were last changed. Bump only when content changes. */
export const factsUpdated = "2026-10-24";
/** Date the legal drafts were last changed. */
export const legalUpdated = "2026-10-24";

/** "23 Oct 2026"; Arabic "23 أكتوبر 2026" */
export function shortDate(iso: string, locale?: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${monthName(m, false, locale)} ${y}`;
}

/** "23 October 2026"; Arabic "23 أكتوبر 2026" */
export function longDate(iso: string, locale?: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${monthName(m, true, locale)} ${y}`;
}

/** "Oct 2026" for title stamps; Arabic "أكتوبر 2026" */
export function monthStamp(iso: string, locale?: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${monthName(m, false, locale)} ${y}`;
}

/** "AED 4 to AED 6 per Salik crossing (free 01:00–06:00)": the Salik tariff as text.
 *  Arabic: "من 4 إلى 6 درهم لكل عبور من بوابات سالك (مجاناً من 01:00 إلى 06:00)". */
export function salikTariff(locale?: string): string {
  const t = rules.tolls;
  if (isAr(locale)) {
    const [free1, free2] = t.salikFreeHours.split("–");
    return `من ${formatNumber(t.salikOffPeak)} إلى ${formatAED(t.salikPeak, locale)} لكل عبور من بوابات سالك (مجاناً من ${free1} إلى ${free2})`;
  }
  return `${formatAED(t.salikOffPeak)} to ${formatAED(t.salikPeak)} per Salik crossing (free ${t.salikFreeHours})`;
}

/** Arabic "و" or "أو" before an item: joined to an Arabic word ("ودبي"), spaced before Latin text or digits ("و Bentley"). */
const arJoin = (word: string, item: string) => (/^[\u0600-\u06FF]/.test(item) ? `${word}${word === "و" ? "" : " "}${item}` : `${word} ${item}`);

/** "a, b and c". `last` is "and" (default) or "or". Arabic: "أ، ب وج" / "أ، ب أو ج". */
export function listJoin(items: string[], last = "and", locale?: string): string {
  if (isAr(locale)) {
    if (items.length <= 1) return items.join("");
    const word = last === "or" ? "أو" : last === "and" ? "و" : last;
    return `${items.slice(0, -1).join("، ")} ${arJoin(word, items[items.length - 1])}`;
  }
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

export const tierOrder: Tier[] = ["L", "S", "H"];
export const carsInTier = (tier: Tier) => cars.filter((c) => c.tier === tier);
/** "Luxury", "Supercar", "Hypercar"; Arabic from content/ar/data.ts. */
export const tierName = (tier: Tier, locale?: string) => localTierName(tier, locale);

/** Self-drive cars (everything except chauffeur-first cars). */
export const selfDriveCars = () => cars.filter((c) => !c.chauffeurFirst);
export const hypercars = () => cars.filter((c) => c.tier === "H");
export const fleetCount = cars.length;
export const brandCount = brands.length;

/** Lowest and highest deposit in a list of cars, e.g. "AED 5,000 to AED 10,000"; Arabic "من 5,000 إلى 10,000 درهم". */
export function depositRange(list: Car[], locale?: string): string {
  const values = list.map((c) => c.rates.deposit);
  const min = Math.min(...values), max = Math.max(...values);
  if (isAr(locale)) return min === max ? formatAED(min, locale) : `من ${formatNumber(min)} إلى ${formatAED(max, locale)}`;
  return min === max ? formatAED(min) : `${formatAED(min)} to ${formatAED(max)}`;
}

/** Most common daily km allowance in the self-drive fleet (the "default"). */
export function commonKmPerDay(list: Car[] = cars): number {
  const counts = new Map<number, number>();
  for (const c of list) counts.set(c.rates.kmPerDay, (counts.get(c.rates.kmPerDay) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Hours as words for notice periods: 4 → "4 hours", 72 → "72 hours (3 days)". Arabic "4 ساعات", "72 ساعة (3 أيام)". */
export function noticeText(hours: number, locale?: string): string {
  if (isAr(locale)) {
    const h = countText(hours, "hour", locale);
    return hours >= 24 && hours % 24 === 0 ? `${h} (${countText(hours / 24, "day", locale)})` : h;
  }
  return hours >= 24 && hours % 24 === 0 ? `${hours} hours (${hours / 24} days)` : `${hours} hours`;
}

/** Plain text from the mini-markup used in copy (`**bold**`, `[label](/path)`). For JSON-LD and meta. */
export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

// ---------------------------------------------------------------------------------------
// Seasons: date ranges are read back from seasonFor() so the pages can never disagree
// with the pricing module.
// ---------------------------------------------------------------------------------------
import { seasonFor, seasons } from "@/content/rules";
import { addDays, dayOfWeek } from "@/lib/dates";
import type { Season } from "@/content/types";

export interface SeasonRange { id: Season["id"]; from: string; to: string }

/** Contiguous runs of each season over one (non-leap) year, the New Year run merged. */
export function seasonRanges(): SeasonRange[] {
  const runs: SeasonRange[] = [];
  let day = "2027-01-01";
  for (let i = 0; i < 365; i++, day = addDays(day, 1)) {
    const id = seasonFor(day).id;
    const last = runs[runs.length - 1];
    if (last && last.id === id) last.to = day;
    else runs.push({ id, from: day, to: day });
  }
  const first = runs[0], last = runs[runs.length - 1];
  if (runs.length > 1 && first.id === last.id) {
    runs.shift();
    last.to = first.to;
  }
  return runs;
}

/** "1 Nov – 19 Dec" (day and short month, no year); Arabic "1 نوفمبر". */
export function dayMonth(iso: string, locale?: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${monthName(m, false, locale)}`;
}

/** Each season with its date ranges as text, in calendar order from summer. */
export function seasonTable(locale?: string) {
  const runs = seasonRanges();
  const order: Season["id"][] = ["summer", "standard", "peak", "super-peak"];
  return order.map((id) => ({
    season: seasons[id],
    ranges: runs.filter((r) => r.id === id).sort((a, b) => a.from.slice(5).localeCompare(b.from.slice(5))).map((r) => `${dayMonth(r.from, locale)} – ${dayMonth(r.to, locale)}`),
  }));
}

/** Festive peak dates as text, e.g. "20 Dec – 5 Jan"; Arabic "20 ديسمبر – 5 يناير". */
export const festiveDates = (locale?: string) => {
  const ranges = seasonTable(locale).find((s) => s.season.id === "super-peak")!.ranges;
  return isAr(locale) ? listJoin(ranges, "and", locale) : ranges.join(" and ");
};

/** % difference of a season multiplier against standard: 0.8 → -20. */
export const seasonPct = (s: Season) => Math.round((s.multiplier - 1) * 100);

// ---------------------------------------------------------------------------------------
// Chauffeur and fleet helpers.
// ---------------------------------------------------------------------------------------
import { chauffeurCars } from "@/content/cars";

/** Chauffeur cars, most expensive first. */
export const chauffeurFleet = () => [...chauffeurCars()].sort((a, b) => b.chauffeur!.hourly - a.chauffeur!.hourly);
export const chauffeurFromHourly = () => Math.min(...chauffeurCars().map((c) => c.chauffeur!.hourly));
export const chauffeurFromAirport = () => Math.min(...chauffeurCars().map((c) => c.chauffeur!.airport));
/** "Rolls-Royce Phantom, Rolls-Royce Cullinan and Bentley Bentayga" style list of chauffeur car names (Latin names; Arabic joins with "و"). */
export const chauffeurNames = (locale?: string) => listJoin(chauffeurFleet().map((c) => c.name), "and", locale);

/** Flagship cars (price tier A): 2-day minimum for Fri–Sun pickups in peak season. */
export const flagshipCars = () => cars.filter((c) => c.priceTier === "A");

/** Cars whose daily km allowance differs from the fleet default. */
export const kmExceptions = () => {
  const common = commonKmPerDay();
  return cars.filter((c) => c.rates.kmPerDay !== common);
};

/** Short model name for tables: "Revuelto", "Cullinan Series II". */
export const brandName = (slug: string) => brands.find((b) => b.slug === slug)?.name ?? slug;

/** Minimum rentals read back from pricing.minDaysFor(), for the fact pages. */
import { minDaysFor } from "@/lib/pricing";
const oneDayCar = () => cars.find((c) => c.minDays === 1 && c.priceTier !== "A") ?? cars[0];
/** Minimum days for any car picking up in the festive peak (3 at launch). */
export const festiveMinDays = () => minDaysFor(oneDayCar(), seasonRanges().find((r) => r.id === "super-peak")!.from);
/** Minimum days for a flagship car picked up on a peak-season Friday (2 at launch). */
export const peakWeekendMinDays = () => {
  const peak = seasonRanges().find((r) => r.id === "peak")!;
  let d = peak.from;
  while (dayOfWeek(d) !== 5) d = addDays(d, 1);
  return minDaysFor(flagshipCars()[0], d);
};

/** "standard season", "peak season", "festive peak season" (lower case, for sentences); Arabic "موسم الذروة". */
export const seasonLabel = (s: Season, locale?: string) => {
  if (isAr(locale)) return seasonName(s, locale);
  const name = s.name.toLowerCase();
  return name.endsWith("season") ? name : `${name} season`;
};

/** 30-day km allowance when a car sets none (mirrors the fallback in lib/pricing.ts quote()). */
export const DEFAULT_MONTH_KM = 4500;
export const monthKmFor = (car: Car) => car.rates.kmPerMonth ?? DEFAULT_MONTH_KM;
