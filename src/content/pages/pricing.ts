import { cars, getCar } from "@/content/cars";
import { brands } from "@/content/brands";
import { offers, rules, seasonFor, seasons } from "@/content/rules";
import { getZone, zones } from "@/content/zones";
import { site } from "@/content/site";
import type { Car, Season } from "@/content/types";
import { addDays, formatDayLong } from "@/lib/dates";
import { formatAED, formatNumber as n } from "@/lib/format";
import {
  DEFAULT_MONTH_KM, dayMonth, festiveMinDays, flagshipCars, listJoin, monthKmFor, monthStamp, peakWeekendMinDays, seasonLabel, seasonPct, seasonTable, tierName,
} from "./shared";

// Data and copy for /pricing (workstream 07 §7.4 fact page: numbers in tables, one place per
// fact, "Last updated"). Every figure is read from cars.ts, rules.ts and zones.ts.

export const pricingMeta = {
  title: (stamp: string) => `Luxury Car Rental Prices in Dubai (Updated ${stamp})`,
  description: `Day, week and month rates for all ${cars.length} cars, plus deposit, mileage, Salik, fuel and delivery fees in one table. Prices in AED including VAT.`,
};

/** Cars in brand order, most expensive first within a brand. */
export const pricingCars = (): Car[] => {
  const order = new Map(brands.map((b) => [b.slug, b.order]));
  return [...cars].sort((a, b) => (order.get(a.brand)! - order.get(b.brand)!) || b.rates.daily - a.rates.daily);
};

/** The next date the season changes after `today`, and the season it changes to. */
export function nextSeasonChange(today: string): { date: string; season: Season } | undefined {
  const current = seasonFor(today).id;
  let d = today;
  for (let i = 0; i < 366; i++) {
    d = addDays(d, 1);
    const s = seasonFor(d);
    if (s.id !== current) return { date: d, season: s };
  }
  return undefined;
}

/** Seasons table rows. */
export function seasonRows() {
  const flagship = listJoin(flagshipCars().map((c) => c.model.replace(/ Series II.*$/, "")));
  return seasonTable().map(({ season, ranges }) => {
    const pct = seasonPct(season);
    const rate =
      season.id === "standard" ? "Standard rate card" :
      season.id === "peak" ? `Peak rate card, about ${pct}% above standard` :
      `${Math.abs(pct)}% ${pct < 0 ? "below" : "above"} standard`;
    const notes: string[] = [];
    if (season.id === "summer" || season.id === "standard") notes.push(`Weekday rate: ${rules.weekdayDiscountPct}% off when pickup and return are both Monday to Thursday.`);
    if (season.id === "peak") notes.push(`${peakWeekendMinDays()}-day minimum on our flagship cars (${flagship}) for Friday to Sunday pickups.`);
    if (season.id === "super-peak") notes.push(`${festiveMinDays()}-day minimum on every car. Chauffeur bookings add ${rules.chauffeur.superPeakSurchargePct}%.`);
    return { season, ranges, rate, notes };
  });
}

/** Rental-length ladder rows, with a worked example on one reference car at the standard rate. */
export function ladderRows(exampleSlug = "ferrari-296-gts") {
  const car = getCar(exampleSlug) ?? cars[0];
  const daily = car.rates.daily;
  const steps = rules.ladder;
  const rows = steps.map((step, i) => {
    const next = steps[i + 1];
    const toDays = next ? next.fromDays - 1 : 29;
    const pct = step.pct;
    const exampleDays = step.fromDays === 1 ? 1 : step.fromDays;
    const total = Math.round(daily * (pct / 100) * exampleDays);
    const how =
      pct === 100 ? "The daily rate for the season" :
      Math.abs(pct * 7 - 600) < 0.01 ? "7 days for the price of 6" :
      `${Math.round(100 - pct)}% off the daily rate`;
    return {
      key: `from-${step.fromDays}`,
      length: `${step.fromDays}–${toDays} days`,
      how,
      example: `${exampleDays} ${exampleDays === 1 ? "day" : "days"}: ${formatAED(total)}`,
      perDay: formatAED(Math.round(total / exampleDays)),
    };
  });
  if (car.rates.monthly) {
    rows.push({
      key: "monthly",
      length: "30 days",
      how: "Fixed 30-day rate, the same all year",
      example: `30 days: ${formatAED(car.rates.monthly)}`,
      perDay: formatAED(Math.round(car.rates.monthly / 30)),
    });
  }
  return { car, rows };
}

export interface FeeRow { key: string; fee: string; amount: string; detail: string }

export function feeGroups(): { id: string; title: string; rows: FeeRow[] }[] {
  const dubai = getZone("dubai")!;
  const handover: FeeRow[] = zones.map((z) => ({
    key: z.slug,
    fee: z.name,
    amount: z.fee === null ? "On request" : z.fee === 0 ? "Free" : formatAED(z.fee),
    detail: z.slug === "dubai" ? `Each way. Free for rentals of ${dubai.freeFromDays} days or more.` : z.kind === "airport" ? "Per handover, with parking and meet-and-greet." : z.fee === null ? (z.note ?? "") : z.fee === 0 ? "Collect and return at our office." : "Each way.",
  }));
  handover.push(
    { key: "airport-wait", fee: "Airport waiting", amount: `${formatAED(rules.airportWaitPerHour)} / hour`, detail: `After the first ${rules.airportWaitFreeMinutes} minutes, which are free. Per started hour.` },
    { key: "ooh", fee: "Out-of-hours handover", amount: formatAED(rules.outOfHoursFee), detail: `Per handover outside ${rules.handoverHours.from}–${rules.handoverHours.to}, subject to availability.` },
  );
  const cover: FeeRow[] = (["L", "S", "H"] as const).map((t) => {
    const tier = rules.tiers[t];
    return { key: `fc-${t}`, fee: `Full Cover, ${tierName(t)}`, amount: `${formatAED(tier.fullCoverPerDay)} / day`, detail: `Excess falls from ${formatAED(tier.excess)} to ${formatAED(tier.fullCoverExcess)}. Covers tyres, rims and glass.` };
  });
  cover.push(
    { key: "driver", fee: "Additional driver", amount: `${formatAED(rules.additionalDriverPerDay)} / day`, detail: "Per driver. Same age and licence rules as the main driver." },
    { key: "child-seat", fee: "Child seat", amount: rules.childSeatPerDay ? `${formatAED(rules.childSeatPerDay)} / day` : "Free", detail: "On request." },
  );
  const during: FeeRow[] = [
    { key: "salik", fee: "Salik and Darb tolls", amount: `${formatAED(rules.tolls.salikOffPeak)}–${rules.tolls.salikPeak} + ${formatAED(rules.tollAdminFee)}`, detail: `Per crossing, passed on at cost. Salik: ${formatAED(rules.tolls.salikPeak)} Mon–Sat 06:00–10:00 and 16:00–20:00, ${formatAED(rules.tolls.salikOffPeak)} at other times and on Sundays, free ${rules.tolls.salikFreeHours}. Abu Dhabi Darb: ${formatAED(rules.tolls.darbPeak)} at peak times. Plus our ${formatAED(rules.tollAdminFee)} admin fee per crossing.` },
    { key: "fuel", fee: "Refuelling", amount: `Fuel + ${formatAED(rules.refuelFee)}`, detail: "If the car comes back with less fuel than at handover. Fuel at pump price." },
    { key: "fines", fee: "Traffic and parking fines", amount: `Fine + ${formatAED(rules.fineAdminFee)}`, detail: "Admin fee per fine. Black points are transferred where the authority allows." },
    { key: "extra-km", fee: "Extra kilometres", amount: `${formatAED(Math.min(...cars.map((c) => c.rates.extraKm)))}–${n(Math.max(...cars.map((c) => c.rates.extraKm)))} / km`, detail: "Depends on the car; see the table above." },
    { key: "late", fee: "Late return", amount: `${rules.lateReturnHourPct}% of daily / hour`, detail: `Free for the first ${rules.graceMinutes} minutes, then per started hour, up to one extra day.` },
    { key: "cleaning", fee: "Smoking or special cleaning", amount: formatAED(rules.cleaningFee), detail: "No smoking, vaping or pets. Assistance animals are welcome." },
  ];
  return [
    { id: "fees-handover", title: "Delivery, collection and handover", rows: handover },
    { id: "fees-cover", title: "Cover, drivers and extras", rows: cover },
    { id: "fees-during", title: "During the rental", rows: during },
  ];
}

export const validOffers = (today: string) => offers.filter((o) => today <= o.validUntil);

export { seasons, dayMonth };

/**
 * Headings, labels and notes for the /pricing page, so the page itself holds no copy.
 * ar/pricing.ts exports the same shape. Paragraphs use the copy mini-markup (**bold**, [label](/path)).
 */
export const pricingPage = {
  crumbs: { home: "Home", page: "Pricing" },
  jumpLabel: "On this page",
  jump: [
    { id: "rates", label: "Car rates" },
    { id: "seasons", label: "Seasons" },
    { id: "longer", label: "Longer rentals" },
    { id: "fees", label: "Fees" },
    { id: "offers", label: "Offers" },
  ],
  hero: {
    eyebrow: (iso: string) => `Pricing · Updated ${monthStamp(iso)}`,
    title: "Luxury car rental prices",
    lede: [
      `Every rate, deposit and fee for all ${cars.length} cars on one page.`,
      `Prices are in AED and include ${site.vatRate}% VAT. The deposit is a refundable hold on your card, shown separately.`,
    ],
  },
  facts: (f: { dailyFrom: number; season: Season; depositFrom: number; km: number }) => ({
    label: "Prices at a glance",
    items: [
      { label: "Daily rates from", value: formatAED(f.dailyFrom), note: seasonLabel(f.season).replace(/^./, (ch) => ch.toUpperCase()) },
      { label: "Deposits from", value: formatAED(f.depositFrom), note: "Refundable card hold" },
      { label: "Included", value: `${f.km} km / day`, note: "On most cars" },
      { label: "VAT", value: `${site.vatRate}% included`, note: "In every price shown" },
    ],
  }),
  rates: {
    eyebrow: "Car rates",
    title: "Rates for every car",
    intro: (today: string, season: Season, change?: { date: string; season: Season }) =>
      `Today, ${formatDayLong(today)}, is in the **${seasonLabel(season)}**${change ? `; the ${seasonLabel(change.season)} starts on ${dayMonth(change.date)}` : ""}. The “Today” column shows the daily rate for a pickup today.`,
    caption: `Daily, 7-day and 30-day rates, deposit and mileage for all ${cars.length} cars`,
    /** [label, note under the label]; every column after the first is right-aligned (end). */
    columns: [
      ["Car"], ["Today", "Per day"], ["Standard", "Per day"], ["Peak", "Per day"], ["7 days", "Total"], ["30 days", "Total"],
      ["Deposit", "Card hold"], ["Included", "Per day"], ["Extra km", "Per km"], ["Chauffeur", "From / hour"],
    ] as [string, string?][],
    carNote: (car: Car) => `${tierName(car.tier)}${car.chauffeurFirst ? " · chauffeur first" : ""}${car.rates.onRequest ? " · on request" : ""}`,
    from: "From",
    weeklyOnRequest: "On request",
    monthlyNotOffered: "Not offered",
    selfDriveOnly: "Self-drive only",
    km: (km: number) => `${n(km)} km`,
    footnote: `All prices in AED including ${site.vatRate}% VAT. Standard rates apply in spring and autumn, peak rates from November to March; summer and the festive peak are worked out from the standard rate (see seasons below). Bugatti prices are where quotes start; we confirm the final price on WhatsApp. The 30-day rate includes ${n(DEFAULT_MONTH_KM)} km${cars.filter((c) => monthKmFor(c) !== DEFAULT_MONTH_KM).map((c) => ` (${n(monthKmFor(c))} km on the ${c.model})`).join("")}. Chauffeur rates are on the [chauffeur page](/chauffeur).`,
    scrollHint: "Scroll the table sideways to see every column. The car name stays in view.",
  },
  seasons: {
    eyebrow: "Seasons",
    title: "Seasons and minimum rentals",
    intro: "The season is set by the pickup date, in Dubai time.",
    caption: "Seasons, dates and how they change the daily rate",
    columns: ["Season", "Dates", "Daily rate", "Also applies"],
    now: "Now",
    nothingExtra: "Nothing extra.",
    joinRanges: (ranges: string[]) => ranges.join(" and "),
  },
  longer: {
    eyebrow: "Longer rentals",
    title: "The longer you rent, the less you pay per day",
    intro: (car: Car) => `A rental day is 24 hours from handover, with ${rules.graceMinutes} minutes' grace at the end. The example uses the ${car.name} at its standard rate of ${formatAED(car.rates.daily)} a day.`,
    caption: "Rental-length pricing",
    columns: ["Rental length", "How it is priced", "Example", "Per day"],
    footnote: `A long rental never costs more than the 30-day rate. You can request up to ${rules.maxOnlineDays} days online; for longer rentals, message us on WhatsApp. Bugattis are priced on request.`,
  },
  fees: {
    eyebrow: "Fees",
    title: "Every fee, in one place",
    intro: "Delivery fees and extras are added to your quote before you send a request. Charges during the rental are deducted from the deposit or charged to the card on file, with the receipt.",
    columns: ["Fee", "Amount", "Details"],
    note: "Excess, deposit and release timing are explained on [rental requirements](/requirements#insurance); delivery zones on the [delivery page](/delivery).",
  },
  offers: {
    eyebrow: "Launch offers",
    title: "Offers",
    intro: "The quote applies one offer per booking, the one that saves you the most. Offers end on the date shown.",
    none: "There are no offers running at the moment.",
    vat: `Prices in AED including ${site.vatRate}% VAT.`,
  },
  cta: {
    title: "See your exact price",
    text: "Choose a car and your dates. The quote shows the rental, delivery and extras before you send the request, and nothing is charged on this website.",
    whatsappText: `Hello ${site.businessName}, I have a question about prices.`,
    whatsapp: "Ask on WhatsApp",
    fleet: "Browse the fleet",
  },
  /** BCP 47 tag for JSON-LD `inLanguage`; left out on English pages. */
  inLanguage: undefined as string | undefined,
};
