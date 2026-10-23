import { cars } from "@/content/cars";
import { brands } from "@/content/brands";
import { rules } from "@/content/rules";
import type { Car, Tier } from "@/content/types";
import { formatAED } from "@/lib/format";
import { monthName } from "@/lib/dates";

// Shared helpers for the content pages (chauffeur, delivery, pricing, requirements, about,
// FAQ, contact, legal). Numbers are always read from the data modules so a rate change
// in cars.ts / rules.ts / zones.ts updates every page, FAQ and legal summary at once.

/** Date the fact pages (pricing, requirements) were last changed. Bump only when content changes. */
export const factsUpdated = "2026-10-23";
/** Date the legal drafts were last changed. */
export const legalUpdated = "2026-10-23";

/** "23 Oct 2026" */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${monthName(m, false)} ${y}`;
}

/** "23 October 2026" */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${monthName(m)} ${y}`;
}

/** "Oct 2026" for title stamps. */
export function monthStamp(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${monthName(m, false)} ${y}`;
}

/** "a, b and c" */
export function listJoin(items: string[], last = "and"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${last} ${items[items.length - 1]}`;
}

export const tierOrder: Tier[] = ["L", "S", "H"];
export const carsInTier = (tier: Tier) => cars.filter((c) => c.tier === tier);
export const tierName = (tier: Tier) => rules.tiers[tier].name;

/** Self-drive cars (everything except chauffeur-first cars). */
export const selfDriveCars = () => cars.filter((c) => !c.chauffeurFirst);
export const hypercars = () => cars.filter((c) => c.tier === "H");
export const fleetCount = cars.length;
export const brandCount = brands.length;

/** Lowest and highest deposit in a list of cars, e.g. "AED 5,000 to AED 10,000". */
export function depositRange(list: Car[]): string {
  const values = list.map((c) => c.rates.deposit);
  const min = Math.min(...values), max = Math.max(...values);
  return min === max ? formatAED(min) : `${formatAED(min)} to ${formatAED(max)}`;
}

/** Most common daily km allowance in the self-drive fleet (the "default"). */
export function commonKmPerDay(list: Car[] = cars): number {
  const counts = new Map<number, number>();
  for (const c of list) counts.set(c.rates.kmPerDay, (counts.get(c.rates.kmPerDay) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Hours as words for notice periods: 4 → "4 hours", 72 → "72 hours (3 days)". */
export function noticeText(hours: number): string {
  return hours >= 24 && hours % 24 === 0 ? `${hours} hours (${hours / 24} days)` : `${hours} hours`;
}

/** Plain text from the mini-markup used in copy (`**bold**`, `[label](/path)`). For JSON-LD and meta. */
export function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

// ---------------------------------------------------------------------------------------
// Facts from the rules sheet (workstream 05) that are not yet fields in rules.ts.
// They live here, in one place, until the lead moves them into rules.ts.
// ---------------------------------------------------------------------------------------
export const extraRules = {
  airportWaitPerHour: 150, // BR-15: after the free 60 minutes, per started hour
  lateReturnHourPct: 25, // BR-02: per started hour after the grace period, up to one extra day
  slotToleranceMinutes: 30, // BR-17
  handoverMinutes: "20 to 30", // BR-17
  bankReleaseWorkingDays: "5 to 14", // BR-55
  lossOfUsePct: 50, // BR-61
  lossOfUseMaxDays: 10, // BR-61
  advanceMaxPct: 25, // 05 §2
  refundWorkingDays: 7, // 05 §2
  freeDateChangeHours: 48, // 05 §2
  flightChangeMonths: 6, // 05 §2
  complaintReplyWorkingDays: 5, // C-14
  rightsReplyDays: 30, // C-04
  chauffeurMaxPassengers: 4, // BR-75
} as const;

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

/** "1 Nov – 19 Dec" (day and short month, no year). */
export function dayMonth(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${monthName(m, false)}`;
}

/** Each season with its date ranges as text, in calendar order from summer. */
export function seasonTable() {
  const runs = seasonRanges();
  const order: Season["id"][] = ["summer", "standard", "peak", "super-peak"];
  return order.map((id) => ({
    season: seasons[id],
    ranges: runs.filter((r) => r.id === id).sort((a, b) => a.from.slice(5).localeCompare(b.from.slice(5))).map((r) => `${dayMonth(r.from)} – ${dayMonth(r.to)}`),
  }));
}

/** Festive peak dates as text, e.g. "20 Dec – 5 Jan". */
export const festiveDates = () => seasonTable().find((s) => s.season.id === "super-peak")!.ranges.join(" and ");

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
/** "Rolls-Royce Phantom, Rolls-Royce Cullinan and Bentley Bentayga" style list of chauffeur car names. */
export const chauffeurNames = () => listJoin(chauffeurFleet().map((c) => c.name));

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

/** "standard season", "peak season", "festive peak season" (lower case, for sentences). */
export const seasonLabel = (s: Season) => {
  const name = s.name.toLowerCase();
  return name.endsWith("season") ? name : `${name} season`;
};
