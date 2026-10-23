import type { Car, Offer, Season } from "@/content/types";
import { getZone } from "@/content/zones";
import { offers, rules, seasonFor, seasons } from "@/content/rules";
import { dayOfWeek, isValidIsoDate, isValidTime, isWithin, minutesNow, toMinutes, todayInDubai } from "./dates";
import { formatAED } from "./format";

// One pricing module for the whole site (plan D-10). It is pure: the same function gives
// the instant preview in the browser and, later, the authoritative quote on the server.
// All amounts are whole AED including 5% VAT.

export type ServiceMode = "self-drive" | "chauffeur";
export type ChauffeurPackage = "hourly" | "half-day" | "full-day" | "airport";

export interface QuoteInput {
  car: Car;
  service: ServiceMode;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  pickupZone?: string;
  returnZone?: string;
  extras?: { fullCover?: boolean; additionalDrivers?: number; childSeats?: number };
  chauffeur?: { package: ChauffeurPackage; hours?: number };
  /** The moment the quote is made; defaults to now. Used for lead time and offer validity. */
  now?: Date;
}

export type QuoteField = "car" | "pickupDate" | "pickupTime" | "returnDate" | "returnTime" | "pickupZone" | "returnZone" | "hours";

export interface QuoteIssue {
  field: QuoteField;
  message: string;
  /** "whatsapp" = the request can't be made online but can be on WhatsApp. */
  resolution?: "whatsapp";
}

export interface QuoteLine {
  id: string;
  label: string;
  detail?: string;
  amount: number;
  kind: "rate" | "fee" | "extra" | "discount";
}

export interface Quote {
  ok: boolean;
  issues: QuoteIssue[];
  service: ServiceMode;
  season: Season;
  days: number; // self-drive rental days (0 for chauffeur)
  hours: number; // chauffeur hours (0 for self-drive)
  minDays: number;
  lines: QuoteLine[];
  total: number;
  vat: number;
  deposit: number;
  includedKm: number;
  extraKmFee: number;
  onRequest: boolean;
  offer?: Offer;
  /** Effective rental rate per day before fees, for display. */
  perDay: number;
}

const round50 = (n: number) => Math.round(n / 50) * 50;

/** Daily rate in a season. Peak uses the approved peak rate card. */
export function seasonalDaily(car: Car, season: Season): number {
  if (season.id === "peak") return car.rates.peakDaily;
  if (season.id === "standard") return car.rates.daily;
  return round50(car.rates.daily * season.multiplier);
}

/** "From" price for cards: today's seasonal daily rate. */
export function fromPrice(car: Car, date = todayInDubai()): number {
  return seasonalDaily(car, seasonFor(date));
}

/** Lowest current daily rate in a list of cars (for "From AED X" labels). */
export const lowestFrom = (list: Car[], date?: string) => Math.min(...list.map((c) => fromPrice(c, date)));

/** Minimum rental days for a pickup date (workstream 04 §11). */
export function minDaysFor(car: Car, pickupDate: string): number {
  const season = seasonFor(pickupDate);
  let min = car.minDays;
  if (season.id === "super-peak") min = Math.max(min, 3);
  const dow = dayOfWeek(pickupDate);
  if (season.id === "peak" && car.priceTier === "A" && (dow === 5 || dow === 6 || dow === 0)) min = Math.max(min, 2);
  return min;
}

/** Rental days, counting 24-hour blocks after a 60-minute grace. */
export function rentalDays(pickupDate: string, pickupTime: string, returnDate: string, returnTime: string): number {
  const minutes = toMinutes(returnDate, returnTime) - toMinutes(pickupDate, pickupTime);
  return Math.max(1, Math.ceil((minutes - rules.graceMinutes) / 1440));
}

function ladderPct(days: number): number {
  let pct = 100;
  for (const step of rules.ladder) if (days >= step.fromDays) pct = step.pct;
  return pct;
}

function handoverFee(zoneSlug: string | undefined, days: number, waiveDubai: boolean): { amount: number; label: string; onRequest: boolean } {
  const zone = zoneSlug ? getZone(zoneSlug) : undefined;
  if (!zone) return { amount: 0, label: "", onRequest: false };
  if (zone.fee === null) return { amount: 0, label: zone.name, onRequest: true };
  if (zone.kind === "zone" && zone.slug === "dubai" && waiveDubai) return { amount: 0, label: zone.name, onRequest: false };
  if (zone.freeFromDays && days >= zone.freeFromDays) return { amount: 0, label: zone.name, onRequest: false };
  return { amount: zone.fee, label: zone.name, onRequest: false };
}

const offerValid = (id: string, today: string) => {
  const o = offers.find((x) => x.id === id);
  return o && today <= o.validUntil ? o : undefined;
};

export function quote(input: QuoteInput): Quote {
  const { car, service } = input;
  const now = input.now ?? new Date();
  const today = todayInDubai(now);
  const pickupDate = input.pickupDate && isValidIsoDate(input.pickupDate) ? input.pickupDate : undefined;
  const season = seasonFor(pickupDate ?? today);
  const issues: QuoteIssue[] = [];
  const lines: QuoteLine[] = [];
  const base: Quote = {
    ok: false, issues, service, season, days: 0, hours: 0, minDays: car.minDays, lines, total: 0, vat: 0,
    deposit: 0, includedKm: 0, extraKmFee: car.rates.extraKm, onRequest: !!car.rates.onRequest, perDay: 0,
  };

  if (service === "chauffeur") return chauffeurQuote(input, base, now, today);

  const pickupTime = isValidTime(input.pickupTime) ? input.pickupTime : "10:00";
  const returnTime = isValidTime(input.returnTime) ? input.returnTime : pickupTime;
  const returnDate = input.returnDate && isValidIsoDate(input.returnDate) ? input.returnDate : undefined;
  if (!pickupDate) issues.push({ field: "pickupDate", message: "Choose a pickup date." });
  if (!returnDate) issues.push({ field: "returnDate", message: "Choose a return date." });
  if (!pickupDate || !returnDate) return base;

  const start = toMinutes(pickupDate, pickupTime);
  const end = toMinutes(returnDate, returnTime);
  if (start < minutesNow(now) + car.leadHours * 60) {
    issues.push({
      field: "pickupDate",
      message: car.leadHours >= 24 ? `This car needs ${car.leadHours / 24} days' notice.` : `Pickup needs at least ${car.leadHours} hours' notice. Need it sooner? Ask us on WhatsApp.`,
      resolution: car.leadHours < 24 ? "whatsapp" : undefined,
    });
  }
  if (toMinutes(pickupDate) > toMinutes(today) + rules.maxAdvanceDays * 1440) issues.push({ field: "pickupDate", message: "You can book up to 12 months ahead." });
  if (end <= start) {
    issues.push({ field: "returnDate", message: "Return must be after pickup." });
    return base;
  }

  const days = rentalDays(pickupDate, pickupTime, returnDate, returnTime);
  const minDays = minDaysFor(car, pickupDate);
  base.days = days;
  base.minDays = minDays;
  if (days < minDays) issues.push({ field: "returnDate", message: `The minimum rental for these dates is ${minDays} days.` });
  if (days > rules.maxOnlineDays) issues.push({ field: "returnDate", message: "Rentals over 30 days are quoted personally. Message us on WhatsApp.", resolution: "whatsapp" });

  // Rental
  const daily = seasonalDaily(car, season);
  let rental: number;
  let detail: string;
  if (days >= 30 && car.rates.monthly) {
    rental = Math.round((car.rates.monthly / 30) * days);
    detail = `Monthly rate, ${days} days`;
  } else {
    const pct = ladderPct(days);
    rental = Math.round(daily * (pct / 100) * days);
    detail = pct < 100 ? `${days} days × ${formatAED(Math.round(daily * (pct / 100)))} (${Math.round(100 - pct)}% multi-day rate)` : `${days} ${days === 1 ? "day" : "days"} × ${formatAED(daily)}`;
    if (car.rates.monthly && days >= 24 && rental > car.rates.monthly) {
      rental = car.rates.monthly;
      detail = `${days} days, capped at the 30-day rate`;
    }
  }
  lines.push({ id: "rental", label: `${car.name}${season.id === "standard" ? "" : `, ${season.name.toLowerCase()}`}`, detail, amount: rental, kind: "rate" });

  // Weekday rate: Mon–Thu pickup and return, standard and summer only
  const weekday = (d: string) => [1, 2, 3, 4].includes(dayOfWeek(d));
  if ((season.id === "standard" || season.id === "summer") && weekday(pickupDate) && weekday(returnDate) && !car.rates.onRequest) {
    lines.push({ id: "weekday", label: "Weekday rate", detail: "Mon–Thu pickup and return", amount: -Math.round(rental * rules.weekdayDiscountPct / 100), kind: "discount" });
  }

  // Offer: one per booking, the one worth most to the customer
  const founding = !car.rates.onRequest ? offerValid("founding-client", today) : undefined;
  const longRental = days >= 3 && car.priceTier !== "A" && car.priceTier !== "H" && season.id !== "super-peak" ? offerValid("first-long-rental", today) : undefined;
  const feesNoOffer = handoverFee(input.pickupZone, days, false).amount + handoverFee(input.returnZone ?? input.pickupZone, days, false).amount;
  const feesFounding = handoverFee(input.pickupZone, days, true).amount + handoverFee(input.returnZone ?? input.pickupZone, days, true).amount;
  const foundingValue = founding ? feesNoOffer - feesFounding : -1;
  const longValue = longRental ? Math.round(rental * 0.1) : -1;
  let offer: Offer | undefined;
  if (longRental && longValue > foundingValue) {
    offer = longRental;
    lines.push({ id: "offer", label: `${longRental.name} offer`, detail: "10% off your first booking of 3+ days", amount: -longValue, kind: "discount" });
  } else if (founding) {
    offer = founding;
  }
  const waiveDubai = offer?.id === "founding-client";

  // Handover fees
  const pickupFee = handoverFee(input.pickupZone, days, waiveDubai);
  const returnZone = input.returnZone ?? input.pickupZone;
  const returnFee = handoverFee(returnZone, days, waiveDubai);
  if (pickupFee.onRequest || returnFee.onRequest) issues.push({ field: "pickupZone", message: "Deliveries outside Dubai, Sharjah, Ajman and Abu Dhabi are quoted personally.", resolution: "whatsapp" });
  const zoneLabel = (slug?: string) => (slug ? getZone(slug)?.name ?? "" : "");
  if (input.pickupZone) lines.push({ id: "pickup", label: "Delivery", detail: zoneLabel(input.pickupZone) + (pickupFee.amount === 0 && input.pickupZone !== "dso" ? (waiveDubai && input.pickupZone === "dubai" ? " · Founding Client offer" : " · free") : ""), amount: pickupFee.amount, kind: "fee" });
  if (returnZone) lines.push({ id: "return", label: "Collection", detail: zoneLabel(returnZone) + (returnFee.amount === 0 && returnZone !== "dso" ? (waiveDubai && returnZone === "dubai" ? " · Founding Client offer" : " · free") : ""), amount: returnFee.amount, kind: "fee" });

  const { from, to } = rules.handoverHours;
  const ooh = [pickupTime, returnTime].filter((t) => !isWithin(t, from, to)).length;
  if (ooh) lines.push({ id: "out-of-hours", label: "Out-of-hours handover", detail: `${ooh} × outside ${from}–${to}`, amount: ooh * rules.outOfHoursFee, kind: "fee" });

  // Extras
  const tier = rules.tiers[car.tier];
  if (input.extras?.fullCover) lines.push({ id: "full-cover", label: "Full Cover", detail: `${days} days × ${formatAED(tier.fullCoverPerDay)}, excess ${formatAED(tier.fullCoverExcess)}`, amount: tier.fullCoverPerDay * days, kind: "extra" });
  const drivers = input.extras?.additionalDrivers ?? 0;
  if (drivers > 0) lines.push({ id: "drivers", label: "Additional driver", detail: `${drivers} × ${days} days × ${formatAED(rules.additionalDriverPerDay)}`, amount: drivers * days * rules.additionalDriverPerDay, kind: "extra" });
  const seats = input.extras?.childSeats ?? 0;
  if (seats > 0) lines.push({ id: "child-seats", label: "Child seat", detail: `${seats} × free on request`, amount: 0, kind: "extra" });

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  const kmPerDay = car.rates.kmPerDay + (waiveDubai ? 50 : 0);
  return {
    ...base,
    ok: issues.length === 0,
    days, minDays, total,
    vat: Math.round((total * 5) / 105),
    deposit: car.rates.deposit,
    includedKm: days >= 30 ? car.rates.kmPerMonth ?? 4500 : kmPerDay * days,
    offer,
    perDay: Math.round(rental / days),
  };
}

function chauffeurQuote(input: QuoteInput, base: Quote, now: Date, today: string): Quote {
  const { car } = input;
  const { issues, lines } = base;
  const rates = car.chauffeur;
  if (!rates) {
    issues.push({ field: "car", message: "Chauffeur service is available on the Rolls-Royce Phantom, Rolls-Royce Cullinan and Bentley Bentayga." });
    return base;
  }
  const date = input.pickupDate && isValidIsoDate(input.pickupDate) ? input.pickupDate : undefined;
  const time = isValidTime(input.pickupTime) ? input.pickupTime : "10:00";
  if (!date) {
    issues.push({ field: "pickupDate", message: "Choose a date." });
    return base;
  }
  const season = seasonFor(date);
  const c = rules.chauffeur;
  if (toMinutes(date, time) < minutesNow(now) + c.leadHours * 60) issues.push({ field: "pickupDate", message: `Chauffeur bookings need ${c.leadHours} hours' notice. Need it sooner? Ask us on WhatsApp.`, resolution: "whatsapp" });

  const pkg = input.chauffeur?.package ?? "hourly";
  let hours = 0;
  let amount = 0;
  let label = "";
  if (pkg === "hourly") {
    hours = Math.max(c.minHours, Math.min(c.maxHours, Math.round(input.chauffeur?.hours ?? c.minHours)));
    if ((input.chauffeur?.hours ?? c.minHours) < c.minHours) issues.push({ field: "hours", message: `The minimum is ${c.minHours} hours.` });
    amount = rates.hourly * hours;
    label = `${hours} hours × ${formatAED(rates.hourly)}`;
  } else if (pkg === "half-day") {
    hours = c.halfDayHours; amount = rates.halfDay; label = `Half day, ${hours} hours`;
  } else if (pkg === "full-day") {
    hours = c.fullDayHours; amount = rates.fullDay; label = `Full day, ${hours} hours`;
  } else {
    hours = 0; amount = rates.airport; label = "Airport transfer, one way, within Dubai";
  }
  lines.push({ id: "chauffeur", label: `${car.name} with chauffeur`, detail: label, amount, kind: "rate" });

  if (time < "06:00") lines.push({ id: "night", label: "Night surcharge", detail: `Starts between 00:00 and 06:00 (+${c.nightSurchargePct}%)`, amount: Math.round(amount * c.nightSurchargePct / 100), kind: "fee" });
  if (season.id === "super-peak") lines.push({ id: "festive", label: "Festive peak", detail: `20 Dec – 5 Jan (+${c.superPeakSurchargePct}%)`, amount: Math.round(amount * c.superPeakSurchargePct / 100), kind: "fee" });

  const zone = input.pickupZone ? getZone(input.pickupZone) : undefined;
  if (zone?.fee === null) issues.push({ field: "pickupZone", message: "Trips to these emirates are quoted personally.", resolution: "whatsapp" });
  if (zone?.chauffeurSurcharge) lines.push({ id: "emirate", label: "Outside Dubai", detail: zone.name, amount: zone.chauffeurSurcharge, kind: "fee" });

  let offer: Offer | undefined;
  const intro = offerValid("chauffeur-intro", today);
  if (intro && (pkg === "half-day" || pkg === "full-day") && season.id !== "super-peak") {
    offer = intro;
    lines.push({ id: "offer", label: "Chauffeur Intro offer", detail: "One free hour", amount: -rates.hourly, kind: "discount" });
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { ...base, ok: issues.length === 0, season, hours, total, vat: Math.round((total * 5) / 105), deposit: 0, includedKm: 0, extraKmFee: 0, offer, perDay: 0 };
}

export { seasons };
