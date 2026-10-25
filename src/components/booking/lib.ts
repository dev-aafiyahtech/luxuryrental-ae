import type { Car } from "@/content/types";
import { getCar } from "@/content/cars";
import { getZone, zones } from "@/content/zones";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { localizeZone, siteFor } from "@/content/localize";
import { localizeQuote, quote, type Quote, type QuoteInput, type ServiceMode } from "@/lib/pricing";
import { addDays, dayOfWeek, daysBetween, formatDay, isWithin, nowInDubai, toMinutes } from "@/lib/dates";
import { formatAED } from "@/lib/format";
import { draftMessage, waWords } from "@/lib/whatsapp";
import type { BookingEvent, BookingRecord, BookingStatus, TripDraft } from "@/lib/booking/types";

type T = (key: string, vars?: Record<string, string | number>) => string;

// Booking-flow helpers (no React). Prices always come from lib/pricing quote(); this file
// only maps the shared TripDraft onto quote inputs and derives display values.

export const STEPS = ["trip", "extras", "driver", "review"] as const;
export type StepId = (typeof STEPS)[number];

const pad = (n: number) => String(n).padStart(2, "0");

/* ---------- service, zones and quote ---------- */

/** The service the draft asks for, limited to what the car offers. */
export function serviceFor(car: Car, trip: TripDraft): ServiceMode {
  return car.chauffeur && trip.service === "chauffeur" ? "chauffeur" : "self-drive";
}

/** Default service when a visitor arrives for a car (the Phantom is chauffeur-first). */
export const defaultServiceFor = (car: Car): ServiceMode => (car.chauffeurFirst && car.chauffeur ? "chauffeur" : "self-drive");

export function zonesFor(trip: TripDraft, service: ServiceMode): { pickupZone: string; returnZone?: string } {
  if (service === "chauffeur") return { pickupZone: trip.pickup.zone };
  const pickupZone = trip.handover === "collect" ? "dso" : trip.pickup.zone;
  return { pickupZone, returnZone: trip.sameReturn ? pickupZone : trip.dropoff.zone };
}

export function quoteInputFor(car: Car, trip: TripDraft): QuoteInput {
  const service = serviceFor(car, trip);
  const { pickupZone, returnZone } = zonesFor(trip, service);
  return {
    car,
    service,
    pickupDate: trip.pickupDate,
    pickupTime: trip.pickupTime,
    returnDate: trip.returnDate,
    returnTime: trip.returnTime,
    pickupZone,
    returnZone,
    extras: service === "self-drive" ? trip.extras : undefined,
    chauffeur: service === "chauffeur" ? trip.chauffeur : undefined,
  };
}

/** quote() for the draft, with optional overrides (e.g. `{ locale }`, or to price an option before it is chosen). */
export function quoteFor(car: Car, trip: TripDraft, now?: Date, override: Partial<QuoteInput> = {}): Quote {
  return quote({ ...quoteInputFor(car, trip), now, ...override });
}

/** A stored request's quote with its line words in `locale` (amounts exactly as stored). */
export function recordQuote(b: BookingRecord, locale?: string): Quote {
  const car = getCar(b.carSlug);
  if (!car) return b.quote;
  return localizeQuote(b.quote, { ...quoteInputFor(car, b.trip), now: new Date(b.createdAt), locale });
}

/* ---------- words ---------- */

/**
 * A counted noun from the messages, by CLDR plural category (`count.days.few`…), so Arabic gets
 * its six forms. Falls back to `other`, then to `fallback()` while a translation is missing.
 */
export function countText(t: T, locale: string, key: string, n: number, fallback?: () => string): string {
  const cat = new Intl.PluralRules(locale).select(n);
  for (const k of [`${key}.${cat}`, `${key}.other`]) {
    const s = t(k, { n });
    if (s !== k) return s;
  }
  return fallback ? fallback() : String(n);
}

/** "3 days" / "3 أيام" from the booking messages. */
export const daysText = (t: T, locale: string, n: number) => countText(t, locale, "count.days", n, () => (n === 1 ? t("quote.day") : t("quote.days", { n })));
/** "5 hours" / "5 ساعات" from the booking messages. */
export const hoursText = (t: T, locale: string, n: number) => countText(t, locale, "count.hours", n, () => t("quote.hours", { n }));

/** ", " or the Arabic comma "، " between items. */
export const listSep = (locale?: string) => (locale === "ar" ? "، " : ", ");

/** A booking event's note in the viewer's language: by its code, else the stored text. */
export function eventText(e: BookingEvent, t: T): string | undefined {
  if (e.code) {
    const key = e.code.startsWith("ops.") ? `ops.notes.${e.code.slice(4)}` : `status.events.${e.code}`;
    const text = t(key, e.vars);
    if (text !== key) return text;
  }
  return e.note;
}

/* ---------- time ---------- */

export const leadHoursFor = (car: Car, service: ServiceMode) => (service === "chauffeur" ? rules.chauffeur.leadHours : car.leadHours);

function fromMinutes(mins: number): { date: string; time: string } {
  const d = new Date(mins * 60_000);
  return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` };
}

/** Earliest pickup slot (date + 30-minute slot) allowed by the car's notice period. */
export function earliestStart(car: Car, service: ServiceMode, now: Date): { date: string; time: string } {
  return earliestAfter(leadHoursFor(car, service), now);
}

/** Earliest 30-minute slot at least `hours` from now (the dock uses the standard 4 hours). */
export function earliestAfter(hours: number, now: Date): { date: string; time: string } {
  const n = nowInDubai(now);
  const mins = toMinutes(n.date, n.time) + hours * 60;
  return fromMinutes(Math.ceil(mins / 30) * 30);
}

export const maxDate = (today: string) => addDays(today, rules.maxAdvanceDays);

/** Requests are accepted 24/7; replies resume at 09:00 (workstream 06 §6.3). */
export function isReplyOutOfHours(now: Date): boolean {
  const { time } = nowInDubai(now);
  return time >= "23:00" || time < "09:00";
}

export const isOutOfHoursSlot = (time: string) => !isWithin(time, rules.handoverHours.from, rules.handoverHours.to);
export const isNightSlot = (time: string) => time < "06:00";

/** Move the pickup time to the first allowed slot when the date is the earliest day. */
export function bumpTime(date: string | undefined, time: string, earliest: { date: string; time: string }): string {
  return date && date === earliest.date && time < earliest.time ? earliest.time : time;
}

/* ---------- date presets and range picking ---------- */

export type PresetId = "tomorrow" | "weekend" | "3-days" | "7-days";
export const PRESETS: PresetId[] = ["tomorrow", "weekend", "3-days", "7-days"];

/** Chip ranges. "This weekend" is Friday to Monday (Fri/Sat: from tomorrow). Long presets start no earlier than `earliest`. */
export function presetRange(id: PresetId, today: string, earliest: string): { start: string; end: string } | null {
  const tomorrow = addDays(today, 1);
  const shift = (start: string, len: number) => {
    const s = start < earliest ? earliest : start;
    return { start: s, end: addDays(s, len) };
  };
  switch (id) {
    case "tomorrow":
      return tomorrow < earliest ? null : { start: tomorrow, end: addDays(tomorrow, 1) };
    case "3-days":
      return shift(tomorrow, 3);
    case "7-days":
      return shift(tomorrow, 7);
    case "weekend": {
      const dow = dayOfWeek(today);
      const start = dow === 5 || dow === 6 ? tomorrow : addDays(today, (5 - dow + 7) % 7);
      if (start < earliest) return null;
      const toMonday = (1 - dayOfWeek(start) + 7) % 7 || 7;
      return { start, end: addDays(start, toMonday) };
    }
  }
}

/**
 * Tap logic shared by the calendar and the date rail. The first tap moves the pickup and keeps
 * the rental length (so the draft always holds a valid range); the next later tap sets the return.
 */
export function pickDay(cur: { start?: string; end?: string }, day: string, awaitingEnd: boolean, minDays = 1, max?: string): { start: string; end: string; awaitingEnd: boolean } {
  if (awaitingEnd && cur.start && day > cur.start) return { start: cur.start, end: day, awaitingEnd: false };
  const len = Math.max(minDays, cur.start && cur.end ? daysBetween(cur.start, cur.end) : minDays, 1);
  let end = addDays(day, len);
  if (max && end > max) end = max > day ? max : addDays(day, 1);
  return { start: day, end, awaitingEnd: true };
}

/* ---------- step URLs ---------- */

export function stepPath(step: StepId | "confirmed", car?: Car, service?: ServiceMode, extra: Record<string, string> = {}): string {
  const q = new URLSearchParams();
  if (car) q.set("car", car.slug);
  if (car && service && service !== defaultServiceFor(car)) q.set("service", service);
  for (const [k, v] of Object.entries(extra)) q.set(k, v);
  const qs = q.toString();
  return `/book/${step}${qs ? `?${qs}` : ""}`;
}

/* ---------- WhatsApp text for an unsent draft ---------- */

/** draftMessage() plus everything else entered so far (used by "Finish on WhatsApp" and the send-failed fallback). Arabic when `locale` is "ar". */
export function fullDraftMessage(trip: TripDraft, car?: Car, q?: Quote | null, locale?: string): string {
  const w = waWords(locale);
  const lines = [draftMessage(trip, car?.name, locale)];
  const service = car ? serviceFor(car, trip) : trip.service;
  if (service === "self-drive" && trip.pickupDate && trip.returnDate) lines.push(w.times(trip.pickupTime, trip.returnTime));
  if (service === "chauffeur") lines.push(`${w.package}: ${packageText(trip, locale)}`);
  if (service === "self-drive" && !trip.sameReturn && trip.handover) lines.push(`${w.return}: ${zoneName(trip.dropoff.zone, locale)}${trip.dropoff.address ? `${w.comma}${trip.dropoff.address}` : ""}`);
  const extras: string[] = [];
  if (service === "self-drive" && trip.extras.fullCover) extras.push(w.fullCover);
  if (service === "self-drive" && trip.extras.additionalDrivers) extras.push(w.drivers(trip.extras.additionalDrivers));
  if (trip.extras.childSeats) extras.push(w.seats(trip.extras.childSeats));
  if (extras.length) lines.push(`${w.extras}: ${extras.join(w.comma)}`);
  if (q && q.total > 0) lines.push(`${w.quote}: ${q.onRequest ? w.fromPrice : ""}${formatAED(q.total, locale)} ${w.inclVat}${q.deposit ? ` · ${w.deposit}: ${formatAED(q.deposit, locale)}` : ""}`);
  if (trip.driver.name) lines.push(`${w.name}: ${trip.driver.name}`);
  if (trip.driver.notes) lines.push(`${w.notes}: ${trip.driver.notes}`);
  return lines.join("\n");
}

/** "Half day, 5 hours" / "نصف يوم، 5 ساعات" */
export function packageText(trip: TripDraft, locale?: string): string {
  const w = waWords(locale);
  const c = trip.chauffeur;
  if (c.package === "hourly") return w.hours(c.hours);
  if (c.package === "half-day") return w.halfDay(rules.chauffeur.halfDayHours);
  if (c.package === "full-day") return w.fullDay(rules.chauffeur.fullDayHours);
  return w.airportTransfer;
}

/* ---------- payments (mock provider, plan D-09) ---------- */

/** Advance: 25% of the total, at least one day's rental (never more than the total). Chauffeur: the full total. */
export function paymentFor(b: BookingRecord): { amount: number; kind: "advance" | "full" } {
  if (b.trip.service === "chauffeur") return { amount: b.quote.total, kind: "full" };
  const quarter = Math.round(b.quote.total * 0.25);
  return { amount: Math.min(b.quote.total, Math.max(quarter, b.quote.perDay)), kind: "advance" };
}

/* ---------- statuses ---------- */

export const STATUS_ORDER: BookingStatus[] = ["requested", "confirmed", "awaiting_payment", "paid", "declined", "cancelled", "expired"];
export const statusTone: Record<BookingStatus, "warning" | "success" | "info" | "muted"> = {
  requested: "warning",
  confirmed: "success",
  awaiting_payment: "info",
  paid: "success",
  declined: "muted",
  cancelled: "muted",
  expired: "muted",
};
export const canCustomerCancel = (s: BookingStatus) => s === "requested" || s === "confirmed" || s === "awaiting_payment";
export const canPay = (s: BookingStatus) => s === "confirmed" || s === "awaiting_payment";

/* ---------- calendar file ---------- */

function icsStamp(date: string, time: string): string {
  // Dubai is UTC+4 all year: convert the wall time to UTC.
  const d = new Date((toMinutes(date, time) - 240) * 60_000);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

/**
 * A one-event .ics for the request (generated in the browser, nothing is sent anywhere).
 * Pass the booking translator and locale to write it in the visitor's language.
 */
export function buildIcs(b: BookingRecord, now: Date, tr?: T, locale?: string): string {
  const t = b.trip;
  const start = t.pickupDate ?? b.createdAt.slice(0, 10);
  let endDate = t.returnDate ?? start;
  let endTime = t.returnTime;
  if (t.service === "chauffeur") {
    const hours = b.quote.hours || 2;
    const end = fromMinutes(toMinutes(start, t.pickupTime) + hours * 60);
    endDate = end.date;
    endTime = end.time;
  }
  const sep = listSep(locale);
  const where = t.service === "chauffeur" || t.handover === "delivery" ? `${localizeZone(getZone(t.pickup.zone), locale)?.name ?? ""}${t.pickup.address ? `${sep}${t.pickup.address}` : ""}` : [site.businessName, siteFor(locale).address.area, siteFor(locale).address.city].join(sep);
  const stampNow = (() => {
    const d = now;
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  })();
  // English (and the fallback while a translation is missing) matches the original wording.
  const amount = formatAED(b.quote.total, locale);
  const msg = (key: string, vars: Record<string, string | number>, en: string) => {
    const text = tr ? tr(key, vars) : key;
    return text === key ? en : text;
  };
  const words = {
    summary: t.service === "chauffeur"
      ? msg("ics.summaryChauffeur", { car: b.carName, ref: b.ref }, `${b.carName} with chauffeur (request ${b.ref}, not yet confirmed)`)
      : msg("ics.summary", { car: b.carName, ref: b.ref }, `${b.carName} (request ${b.ref}, not yet confirmed)`),
    description: [
      msg("ics.description", { ref: b.ref, business: site.businessName }, `Booking request ${b.ref}. Not confirmed until ${site.businessName} confirms it on WhatsApp.`),
      b.quote.onRequest ? msg("ics.quoteFrom", { amount }, `Quote: from ${amount} incl. VAT.`) : msg("ics.quote", { amount }, `Quote: ${amount} incl. VAT.`),
      msg("ics.whatsapp", { number: site.whatsappDisplay }, `WhatsApp: ${site.whatsappDisplay}`),
    ].join("\n"),
  };
  const lang = locale && locale !== "en" ? `;LANGUAGE=${locale}` : "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${site.businessName}//Booking request//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${b.ref}@${site.domain}`,
    `DTSTAMP:${stampNow}`,
    `DTSTART:${icsStamp(start, t.pickupTime)}`,
    `DTEND:${icsStamp(endDate, endTime)}`,
    `SUMMARY${lang}:${icsText(words.summary)}`,
    `DESCRIPTION${lang}:${icsText(words.description)}`,
    `LOCATION${lang}:${icsText(where)}`,
    "STATUS:TENTATIVE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- display rows for a trip ---------- */

export const zoneName = (slug?: string, locale?: string) => (slug ? localizeZone(getZone(slug), locale)?.name ?? slug : "");
export const deliveryZones = zones.filter((z) => z.slug !== "dso");
export const dateTime = (date?: string, time?: string, locale?: string) => (date ? `${formatDay(date, locale)}${listSep(locale)}${time ?? ""}` : "");

/* ---------- drivers: licences and phones ---------- */

export const GCC = ["AE", "SA", "KW", "QA", "BH", "OM"];
const EU = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];
/** Workstream 05 BR-35 examples (UK, EU, USA, Canada, Australia, Japan, South Korea, Singapore). Verify the full RTA list before launch. */
export const RTA_APPROVED = ["GB", ...EU, "US", "CA", "AU", "JP", "KR", "SG"];
export const needsIdp = (country?: string) => !!country && !GCC.includes(country) && !RTA_APPROVED.includes(country);

export const countries: { code: string; name: string }[] = [
  { code: "AE", name: "United Arab Emirates" },
  ...[
    ["SA", "Saudi Arabia"], ["KW", "Kuwait"], ["QA", "Qatar"], ["BH", "Bahrain"], ["OM", "Oman"],
    ["GB", "United Kingdom"], ["US", "United States"], ["CA", "Canada"], ["AU", "Australia"], ["JP", "Japan"], ["KR", "South Korea"], ["SG", "Singapore"],
    ["AT", "Austria"], ["BE", "Belgium"], ["BG", "Bulgaria"], ["HR", "Croatia"], ["CY", "Cyprus"], ["CZ", "Czechia"], ["DK", "Denmark"], ["EE", "Estonia"], ["FI", "Finland"], ["FR", "France"], ["DE", "Germany"], ["GR", "Greece"], ["HU", "Hungary"], ["IE", "Ireland"], ["IT", "Italy"], ["LV", "Latvia"], ["LT", "Lithuania"], ["LU", "Luxembourg"], ["MT", "Malta"], ["NL", "Netherlands"], ["PL", "Poland"], ["PT", "Portugal"], ["RO", "Romania"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["ES", "Spain"], ["SE", "Sweden"],
    ["CH", "Switzerland"], ["NO", "Norway"], ["NZ", "New Zealand"], ["CN", "China"], ["HK", "Hong Kong"], ["IN", "India"], ["PK", "Pakistan"], ["RU", "Russia"], ["KZ", "Kazakhstan"], ["UA", "Ukraine"], ["TR", "Türkiye"], ["EG", "Egypt"], ["LB", "Lebanon"], ["JO", "Jordan"], ["IR", "Iran"], ["NG", "Nigeria"], ["ZA", "South Africa"], ["PH", "Philippines"], ["MY", "Malaysia"], ["TH", "Thailand"], ["ID", "Indonesia"], ["BR", "Brazil"], ["MX", "Mexico"],
  ]
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  { code: "XX", name: "Another country" },
];

/** Country names in the visitor's language (CLDR via Intl.DisplayNames), English list as the fallback. */
function regionName(code: string, locale?: string): string | undefined {
  if (!locale || locale === "en") return undefined;
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(code);
    return name && name !== code ? name : undefined;
  } catch {
    return undefined;
  }
}

export const countryName = (code?: string, locale?: string, other?: string) =>
  code === "XX" && other ? other : (code && regionName(code, locale)) ?? countries.find((c) => c.code === code)?.name ?? code ?? "";

/** The licence-country list in the visitor's language, sorted for that language, UAE first and "Another country" last. */
export function countriesFor(locale: string, other: string): { code: string; name: string }[] {
  if (locale === "en") return countries.map((c) => (c.code === "XX" ? { ...c, name: other } : c));
  const collator = new Intl.Collator(locale);
  const named = countries.map((c) => ({ code: c.code, name: c.code === "XX" ? other : countryName(c.code, locale) }));
  const middle = named.slice(1, -1).sort((a, b) => collator.compare(a.name, b.name));
  return [named[0], ...middle, named[named.length - 1]];
}

/** Dial-code country name in the visitor's language. */
export const dialName = (c: DialCode, locale?: string) => regionName(c.iso, locale) ?? c.name;

export interface DialCode { iso: string; name: string; dial: string }
export const dialCodes: DialCode[] = [
  { iso: "AE", name: "United Arab Emirates", dial: "971" },
  { iso: "SA", name: "Saudi Arabia", dial: "966" },
  { iso: "KW", name: "Kuwait", dial: "965" },
  { iso: "QA", name: "Qatar", dial: "974" },
  { iso: "BH", name: "Bahrain", dial: "973" },
  { iso: "OM", name: "Oman", dial: "968" },
  { iso: "GB", name: "United Kingdom", dial: "44" },
  { iso: "US", name: "United States", dial: "1" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "IN", name: "India", dial: "91" },
  { iso: "PK", name: "Pakistan", dial: "92" },
  { iso: "RU", name: "Russia", dial: "7" },
  { iso: "KZ", name: "Kazakhstan", dial: "7" },
  { iso: "DE", name: "Germany", dial: "49" },
  { iso: "FR", name: "France", dial: "33" },
  { iso: "IT", name: "Italy", dial: "39" },
  { iso: "ES", name: "Spain", dial: "34" },
  { iso: "NL", name: "Netherlands", dial: "31" },
  { iso: "CH", name: "Switzerland", dial: "41" },
  { iso: "TR", name: "Türkiye", dial: "90" },
  { iso: "EG", name: "Egypt", dial: "20" },
  { iso: "LB", name: "Lebanon", dial: "961" },
  { iso: "JO", name: "Jordan", dial: "962" },
  { iso: "CN", name: "China", dial: "86" },
  { iso: "HK", name: "Hong Kong", dial: "852" },
  { iso: "SG", name: "Singapore", dial: "65" },
  { iso: "JP", name: "Japan", dial: "81" },
  { iso: "KR", name: "South Korea", dial: "82" },
  { iso: "AU", name: "Australia", dial: "61" },
  { iso: "NG", name: "Nigeria", dial: "234" },
  { iso: "ZA", name: "South Africa", dial: "27" },
  { iso: "PH", name: "Philippines", dial: "63" },
  { iso: "UA", name: "Ukraine", dial: "380" },
  { iso: "BR", name: "Brazil", dial: "55" },
];

export function parsePhone(e164?: string): { iso: string; national: string } {
  if (e164?.startsWith("+")) {
    const byLength = [...dialCodes].sort((a, b) => b.dial.length - a.dial.length);
    const match = byLength.find((c) => e164.startsWith(`+${c.dial}`));
    if (match) return { iso: dialCodes.find((c) => c.dial === match.dial)!.iso, national: e164.slice(match.dial.length + 1) };
  }
  return { iso: "AE", national: e164 ?? "" };
}

export function toE164(iso: string, national: string): string {
  const dial = dialCodes.find((c) => c.iso === iso)?.dial ?? "971";
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `+${dial}${digits}` : "";
}

/** null when valid; otherwise an error key in the booking namespace. */
export function phoneError(e164: string | undefined): "required" | "uaeMobile" | "invalid" | null {
  if (!e164) return "required";
  const { iso, national } = parsePhone(e164);
  if (iso === "AE") return /^5\d{8}$/.test(national) ? null : "uaeMobile";
  return /^\d{6,14}$/.test(national) && e164.length <= 16 ? null : "invalid";
}

/** "+971 50 123 4567"-style display, without guessing other countries' grouping. */
export function formatPhone(e164?: string): string {
  if (!e164) return "";
  const { iso, national } = parsePhone(e164);
  const dial = dialCodes.find((c) => c.iso === iso)?.dial;
  if (iso === "AE" && national.length === 9) return `+971 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
  return dial ? `+${dial} ${national}` : e164;
}

export const emailOk = (v?: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const flightOk = (v?: string) => !v || /^[A-Z0-9]{2}\s?\d{1,4}[A-Z]?$/i.test(v.trim());

/* ---------- hand-off between review and confirmation ---------- */

// Set when a request has just been sent from this tab; the confirmation page then clears the
// trip draft (keeping contact details). A reload of the confirmation page leaves the draft alone.
let justSent: string | null = null;
export const markSent = (ref: string) => {
  justSent = ref;
};
export function consumeSent(ref: string): boolean {
  if (justSent !== ref) return false;
  justSent = null;
  return true;
}
