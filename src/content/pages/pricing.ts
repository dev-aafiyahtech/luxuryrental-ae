import { cars, getCar } from "@/content/cars";
import { brands } from "@/content/brands";
import { offers, rules, seasonFor, seasons } from "@/content/rules";
import { getZone, zones } from "@/content/zones";
import type { Car, Season } from "@/content/types";
import { addDays } from "@/lib/dates";
import { formatAED, formatNumber as n } from "@/lib/format";
import { extraRules as x, dayMonth, festiveMinDays, flagshipCars, listJoin, peakWeekendMinDays, seasonPct, seasonTable, tierName } from "./shared";

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
    { key: "airport-wait", fee: "Airport waiting", amount: `${formatAED(x.airportWaitPerHour)} / hour`, detail: `After the first ${rules.airportWaitFreeMinutes} minutes, which are free. Per started hour.` },
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
    { key: "salik", fee: "Salik and Darb tolls", amount: `Tariff + ${formatAED(rules.tollAdminFee)}`, detail: "Per crossing, at the toll operator's tariff, plus our admin fee." },
    { key: "fuel", fee: "Refuelling", amount: `Fuel + ${formatAED(rules.refuelFee)}`, detail: "If the car comes back with less fuel than at handover. Fuel at pump price." },
    { key: "fines", fee: "Traffic and parking fines", amount: `Fine + ${formatAED(rules.fineAdminFee)}`, detail: "Admin fee per fine. Black points are transferred where the authority allows." },
    { key: "extra-km", fee: "Extra kilometres", amount: `${formatAED(Math.min(...cars.map((c) => c.rates.extraKm)))}–${n(Math.max(...cars.map((c) => c.rates.extraKm)))} / km`, detail: "Depends on the car; see the table above." },
    { key: "late", fee: "Late return", amount: `${x.lateReturnHourPct}% of daily / hour`, detail: `Free for the first ${rules.graceMinutes} minutes, then per started hour, up to one extra day.` },
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
