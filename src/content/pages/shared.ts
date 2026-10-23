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
