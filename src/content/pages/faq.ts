import { cars, getCar } from "@/content/cars";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import type { Tier } from "@/content/types";
import { formatAED, formatNumber as n, plural } from "@/lib/format";
import { advanceRule, refundWindows } from "./cancellation";
import {
  carsInTier, chauffeurFromHourly, chauffeurNames, depositRange, extraRules as x, festiveDates, festiveMinDays,
  flagshipCars, hypercars, listJoin, noticeText, peakWeekendMinDays, tierName,
} from "./shared";

// The FAQ (workstream 06: about 28 questions in 7 groups). Every answer is built from the
// rules and data modules, so it cannot disagree with the pricing or requirements pages.
// The chauffeur, delivery and requirements pages reuse entries from here by id.
//
// Answers use the copy mini-markup: **bold**, [label](/path), blank line = new paragraph.

export interface FaqEntry {
  id: string;
  q: string;
  a: string;
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqEntry[];
}

const { L, S, H } = rules.tiers;
const c = rules.chauffeur;
const { from, to } = rules.handoverHours;
const dubai = getZone("dubai")!;
const dxb = getZone("dxb")!;
const shjAjm = getZone("sharjah-ajman")!;
const auh = getZone("abu-dhabi")!;
const other = getZone("other-emirates")!;
const phantom = getCar("rolls-royce-phantom")!;

/** Brands in a tier, e.g. "Rolls-Royce, Bentley, Aston Martin and Maserati". */
function tierBrands(tier: Tier): string {
  const names: string[] = [];
  for (const car of carsInTier(tier)) {
    const brand = car.name.slice(0, car.name.length - car.model.length).trim();
    if (!names.includes(brand)) names.push(brand);
  }
  return listJoin(names);
}

const baseMinDays = Math.min(...cars.map((car) => car.minDays));
const hyperMinDays = Math.min(...hypercars().map((car) => car.minDays));
/** 30-day km allowance; pricing.ts uses 4,500 km when a car sets none. */
const monthKm = (slug: string) => getCar(slug)!.rates.kmPerMonth ?? 4500;
const monthlyCars = cars.filter((car) => car.rates.monthly);
const monthKmExceptions = monthlyCars.filter((car) => car.rates.kmPerMonth && car.rates.kmPerMonth !== 4500);
const monthsAhead = Math.round(rules.maxAdvanceDays / 30.4);
const sameLead = L.leadHours === S.leadHours;
const sameRelease = L.releaseDays === S.releaseDays;

export const faqGroups: FaqGroup[] = [
  {
    id: "booking",
    title: "Booking",
    items: [
      {
        id: "how-booking-works",
        q: "How does booking work?",
        a: `Choose a car and your dates, then send a booking request. Requests are free and nothing is charged on this website. Our team checks the car and your details, then confirms on WhatsApp. ${site.replyPromise}\n\nYour booking is confirmed only when we confirm it. You pay the rental at handover, or by a secure payment link we send after confirmation.`,
      },
      {
        id: "notice",
        q: "How much notice do you need?",
        a: sameLead
          ? `**${noticeText(L.leadHours)}** for Luxury cars and supercars, for handovers between ${from} and ${to}. Bugattis need **${noticeText(H.leadHours)}** so we can check documents and insurance, and chauffeur bookings need **${c.leadHours} hours**. You can book up to ${monthsAhead} months ahead.`
          : `**${noticeText(L.leadHours)}** for Luxury cars, **${noticeText(S.leadHours)}** for supercars and **${noticeText(H.leadHours)}** for Bugattis. Chauffeur bookings need **${c.leadHours} hours**. You can book up to ${monthsAhead} months ahead.`,
      },
      {
        id: "minimum-rental",
        q: "What is the minimum rental?",
        a: `The minimum is ${plural(baseMinDays, "day")}, counted as 24 hours from handover, and returns up to ${rules.graceMinutes} minutes late are free. Some cars and dates need longer. Bugattis have a ${hyperMinDays}-day minimum. Any car picked up in the festive peak (${festiveDates()}) has a ${festiveMinDays()}-day minimum. In peak season our flagship cars (${listJoin(flagshipCars().map((car) => car.name))}) need ${peakWeekendMinDays()} days for Friday to Sunday pickups.`,
      },
      {
        id: "monthly",
        q: "Can I rent a car for a month?",
        a: `Yes. Every car except the Bugattis has a fixed 30-day rate that stays the same all year, with ${n(4500)} km included${monthKmExceptions.length ? ` (${monthKmExceptions.map((car) => `${n(monthKm(car.slug))} km on the ${car.model}`).join(", ")})` : ""}. Our [pricing page](/pricing) lists the 30-day rate for each car. You can request up to ${rules.maxOnlineDays} days online; for longer rentals, message us on WhatsApp.`,
      },
    ],
  },
  {
    id: "requirements",
    title: "Requirements",
    items: [
      {
        id: "age",
        q: "How old do I need to be to rent a car?",
        a: `For Luxury cars (${tierBrands("L")}), the main driver must be **${L.minAge} or older** with a full licence held for at least ${L.licenceYears} years. Supercars (${tierBrands("S")}) also need a driver aged **${S.minAge} or older**, with ${S.licenceYears} years on their licence. Bugattis need a driver aged **${H.minAge} or older** with ${H.licenceYears} years on their licence, plus approval from our team and our insurer.\n\nSelf-drive in the Rolls-Royce Phantom needs our approval and a driver aged ${phantom.minAge} or older.`,
      },
      {
        id: "idp",
        q: "Do I need an International Driving Permit?",
        a: `It depends on where your licence was issued. UAE residents must drive on a UAE licence. Visitors can drive on a licence from a GCC country, or from a country on the RTA's approved list, such as the UK, EU countries, the USA, Canada, Australia, Japan, South Korea and Singapore. Visitors with a licence from anywhere else need an International Driving Permit together with their home licence.\n\nTell us your licence country when you send the request, and we check it on WhatsApp before we confirm.`,
      },
      {
        id: "documents",
        q: "What documents do I need to bring?",
        a: `**Visitors:** passport, UAE entry stamp or visa page, driving licence, and an International Driving Permit if you need one. **Residents:** Emirates ID and UAE driving licence.\n\nBring the originals to the handover. We check them and hand them straight back. We never keep your passport or Emirates ID.`,
      },
      {
        id: "additional-drivers",
        q: "Can someone else drive the car?",
        a: `Yes, if they meet the same age and licence rules and are named on the rental agreement. Each additional driver costs ${formatAED(rules.additionalDriverPerDay)} a day. If someone who is not named drives the car, the insurance does not cover it.`,
      },
    ],
  },
  {
    id: "deposit",
    title: "Deposit and payment",
    items: [
      {
        id: "deposit-amount",
        q: "How much is the security deposit?",
        a: `It depends on the car: ${depositRange(carsInTier("L"))} for Luxury cars, ${depositRange(carsInTier("S"))} for supercars and ${depositRange(carsInTier("H"))} for Bugattis. Our [pricing page](/pricing) shows the deposit for each car.\n\nThe deposit is held on a **credit card in the main driver's name** at handover. Debit cards and cash are not accepted for the deposit.`,
      },
      {
        id: "deposit-release",
        q: "When do I get my deposit back?",
        a: `We release the hold ${sameRelease ? `${L.releaseDays} days` : `${L.releaseDays} days (${tierName("L")}) or ${S.releaseDays} days (${tierName("S")})`} after you return the car, or ${H.releaseDays} days for Bugattis, less any fines, tolls or charges. Your bank may take a further ${x.bankReleaseWorkingDays} working days to show it. If a fine arrives after the release, we charge it to the card on file and send you the fine notice.`,
      },
      {
        id: "payment",
        q: "How do I pay for the rental?",
        a: `Nothing is charged on this website. After we confirm your booking, you pay at handover or by a secure payment link we send you. ${advanceRule}`,
      },
      {
        id: "vat",
        q: "Do your prices include VAT?",
        a: `Yes. Every price on this website is in AED and includes ${site.vatRate}% VAT, and you receive a tax invoice for every rental. Delivery fees and extras appear in your quote before you send the request. The deposit is shown separately because it is a refundable hold on your card.`,
      },
    ],
  },
  {
    id: "insurance",
    title: "Insurance and fines",
    items: [
      {
        id: "insurance",
        q: "Is insurance included?",
        a: `Yes, every rental includes comprehensive insurance. For each damage claim you pay up to the excess: ${formatAED(L.excess)} for Luxury cars, ${formatAED(S.excess)} for supercars and ${formatAED(H.excess)} for Bugattis.\n\nThe insurance does not apply to driving under alcohol or drugs, unnamed drivers, racing or track use, off-road or sand driving, leaving the UAE, or damage with no police report.`,
      },
      {
        id: "full-cover",
        q: "What does Full Cover add?",
        a: `Full Cover lowers the excess to ${formatAED(L.fullCoverExcess)} for ${formatAED(L.fullCoverPerDay)} a day on Luxury cars, or ${formatAED(S.fullCoverPerDay)} a day on supercars. On Bugattis it lowers the excess to ${formatAED(H.fullCoverExcess)} for ${formatAED(H.fullCoverPerDay)} a day. It also covers tyres, rims and glass. Add it when you send your request.`,
      },
      {
        id: "salik",
        q: "How are Salik tolls charged?",
        a: `Salik is Dubai's road toll. We charge each crossing at the Salik tariff plus a ${formatAED(rules.tollAdminFee)} admin fee, and Abu Dhabi's Darb tolls the same way. They are deducted from the deposit before we release it. On chauffeur bookings, Salik and Darb are included in the rate.`,
      },
      {
        id: "fines",
        q: "What happens if I get a traffic fine?",
        a: `Traffic and parking fines during your rental are your responsibility. We charge the fine plus a ${formatAED(rules.fineAdminFee)} admin fee per fine. Where the authority allows it, we transfer the fine and any black points to the driver's licence.`,
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    items: [
      {
        id: "delivery-fee",
        q: "Do you deliver to hotels and homes?",
        a: `Yes, anywhere in Dubai. Delivery and collection are free for rentals of ${dubai.freeFromDays} days or more, and ${formatAED(dubai.fee ?? 0)} each way for shorter rentals. Hatta, the other emirates and the airports have their own fees, listed on our [delivery page](/delivery).`,
      },
      {
        id: "airport",
        q: "Can you meet me at the airport?",
        a: `Yes, at Dubai International (DXB, ${listJoin(dxb.areas)}) or Al Maktoum International (DWC). An airport handover costs ${formatAED(dxb.fee ?? 0)}, including airport parking and meet-and-greet at arrivals. We track your flight. The first ${rules.airportWaitFreeMinutes} minutes after landing are free, then waiting costs ${formatAED(x.airportWaitPerHour)} per started hour.`,
      },
      {
        id: "collect",
        q: "Can I collect the car myself?",
        a: `Yes. You can collect and return the car at our office in [Dubai Silicon Oasis](/delivery/dubai-silicon-oasis) at no charge. Choose office collection when you send your request, and bring the main driver's original documents.`,
      },
      {
        id: "hours",
        q: "What are your delivery hours?",
        a: `Handovers run from ${from} to ${to} every day. Outside those hours we can still deliver, subject to availability, for ${formatAED(rules.outOfHoursFee)} extra per handover. We arrive within ${x.slotToleranceMinutes} minutes of your slot, and the handover takes ${x.handoverMinutes} minutes.`,
      },
    ],
  },
  {
    id: "chauffeur",
    title: "Chauffeur",
    items: [
      {
        id: "chauffeur-cars",
        q: "Which cars come with a chauffeur?",
        a: `The ${chauffeurNames()}. The Phantom is offered with a chauffeur first. Our two-seat sports cars are self-drive only. Each chauffeur car takes up to ${x.chauffeurMaxPassengers} passengers.`,
      },
      {
        id: "chauffeur-cost",
        q: "How much does a chauffeur cost?",
        a: `From ${formatAED(chauffeurFromHourly())} an hour, with a ${c.minHours}-hour minimum. Half days (${c.halfDayHours} hours), full days (${c.fullDayHours} hours) and one-way airport transfers have fixed prices, all listed on our [chauffeur page](/chauffeur). Journeys that start between 00:00 and 06:00 cost ${c.nightSurchargePct}% more, and bookings in the festive peak (${festiveDates()}) cost ${c.superPeakSurchargePct}% more.`,
      },
      {
        id: "chauffeur-included",
        q: "What is included in the chauffeur rate?",
        a: `${c.included} Waiting time counts as booked time, and parking is charged at cost. Child seats are free on request.`,
      },
      {
        id: "chauffeur-emirates",
        q: "Can the chauffeur take us to Abu Dhabi or Sharjah?",
        a: `Yes. Bookings in ${shjAjm.name} add ${formatAED(shjAjm.chauffeurSurcharge ?? 0)}, and bookings in ${auh.name} add ${formatAED(auh.chauffeurSurcharge ?? 0)}. Trips to ${listJoin(other.areas)} are quoted on WhatsApp. Send us the full route with your request and we confirm the price.`,
      },
    ],
  },
  {
    id: "cancellation",
    title: "Cancellation",
    items: [
      {
        id: "cancel-request",
        q: "Can I cancel a booking request?",
        a: `Yes, at any time before we confirm it, at no cost. Send us your booking reference on WhatsApp or by email.\n\nNeed different dates instead? Each confirmed booking gets one free date change up to ${x.freeDateChangeHours} hours before the start, subject to availability. Any price difference applies.`,
      },
      {
        id: "refunds",
        q: "What refund do I get if I cancel a confirmed booking?",
        a: [
          "It depends on how close to the start you cancel. We refund the advance as follows:",
          ...refundWindows.map((w) => `**${w.label}:** 100% back ${w.full} the start, 50% back ${w.half}, and no refund ${w.none.charAt(0).toLowerCase()}${w.none.slice(1)}.`),
          "The [cancellation policy](/legal/cancellation) has the full terms.",
        ].join("\n\n"),
      },
      {
        id: "flight-weather",
        q: "What if my flight is delayed or cancelled?",
        a: `If a flight delay or cancellation, or an official weather warning, stops you from starting the rental, you can move your dates free of charge within ${x.flightChangeMonths} months or take a full refund. We ask for proof, such as the airline's notice or a National Center of Meteorology warning.`,
      },
      {
        id: "we-cancel",
        q: "What if you cannot provide my car?",
        a: `If we cancel or cannot provide the car you booked, you choose between a full refund and a comparable or better car at no extra cost. Refunds go back to the original payment method within ${x.refundWorkingDays} working days.`,
      },
    ],
  },
];

/** All FAQ entries, flat. */
export const allFaqs = faqGroups.flatMap((g) => g.items);

/** Pick entries by id (throws on a typo, so a renamed question fails the build). */
export function faqsById(...ids: string[]): FaqEntry[] {
  return ids.map((id) => {
    const item = allFaqs.find((f) => f.id === id);
    if (!item) throw new Error(`faq.ts: unknown question ${id}`);
    return item;
  });
}

export const faqCount = allFaqs.length;
