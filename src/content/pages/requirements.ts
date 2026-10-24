import { cars, getCar } from "@/content/cars";
import { rules } from "@/content/rules";
import type { Tier } from "@/content/types";
import { formatAED } from "@/lib/format";
import { faqsById, type FaqEntry } from "./faq";
import {
  carsInTier, commonKmPerDay, depositRange, festiveDates, festiveMinDays, flagshipCars, hypercars,
  kmExceptions, listJoin, noticeText, peakWeekendMinDays, tierName, tierOrder, salikTariff,
} from "./shared";

// Copy for /requirements (workstream 05 §4 outline, 07 §7.4 fact page). Rules come from
// rules.ts (tiers, fees) and cars.ts (deposits, km); statements follow the BR-* sheet.

const c = rules.chauffeur;
const phantom = getCar("rolls-royce-phantom")!;

export const requirementsPage = {
  meta: {
    title: "What You Need to Rent a Supercar in Dubai: Age, Licence, IDP",
    description: `Minimum age, licence history, IDP rules by country, deposit and documents, for residents and tourists. Drivers ${rules.tiers.L.minAge}+, or ${rules.tiers.H.minAge}+ for Bugatti.`,
  },
  hero: {
    eyebrow: "Rental requirements",
    title: "What you need to rent a luxury car in Dubai",
    lede: [
      "A full driving licence, your passport or Emirates ID, and a credit card in the main driver's name.",
      "The age and licence rules depend on the car. Everything is checked at handover, and we check your licence country on WhatsApp before we confirm.",
    ],
  },
  facts: () => {
    const { L, H } = rules.tiers;
    const minYears = Math.min(...tierOrder.map((t) => rules.tiers[t].licenceYears));
    const maxYears = Math.max(...tierOrder.map((t) => rules.tiers[t].licenceYears));
    return [
      { label: "Minimum age", value: `${L.minAge}`, note: `${H.minAge} for Bugattis` },
      { label: "Licence held", value: `${minYears}–${maxYears} years`, note: "Depends on the car" },
      { label: "Deposit from", value: formatAED(Math.min(...cars.map((car) => car.rates.deposit))), note: "Credit card only" },
      { label: "Notice", value: noticeText(L.leadHours), note: `${noticeText(H.leadHours)} for Bugattis` },
    ];
  },
  tierRows: () => tierOrder.map((t: Tier) => {
    const tier = rules.tiers[t];
    const list = carsInTier(t);
    return {
      tier: t,
      name: tier.name,
      cars: list.map((car) => car.name),
      minAge: tier.minAge,
      licenceYears: tier.licenceYears,
      notice: noticeText(tier.leadHours),
      deposit: depositRange(list),
      excess: formatAED(tier.excess),
    };
  }),
  tierNotes: () => [
    `Bugattis also need approval from our team and our insurer before we confirm.`,
    `The Rolls-Royce Phantom is offered with a chauffeur first. Self-drive needs our approval and a driver aged ${phantom.minAge} or older.`,
    `Under ${rules.tiers.L.minAge}? You cannot be the main or an additional driver, but you can book our chauffeur service.`,
  ],
  licences: [
    { title: "UAE residents", text: "UAE residents must drive on a valid UAE driving licence." },
    { title: "GCC licences", text: "Visitors can drive on a licence issued in Saudi Arabia, Kuwait, Qatar, Bahrain or Oman." },
    { title: "RTA-approved countries", text: "Visitors can drive on their home licence if it comes from a country on the RTA's approved list, such as the UK, EU countries, the USA, Canada, Australia, Japan, South Korea and Singapore." },
    { title: "Everyone else", text: "Visitors with a licence from any other country need an International Driving Permit together with their home licence." },
  ],
  licenceNote: "Licences must be full (not learner or provisional) and valid for the whole rental. The RTA's list changes from time to time, so we check your licence country on WhatsApp before we confirm.",
  documents: {
    visitors: ["Passport", "UAE entry stamp or visa page", "Driving licence", "International Driving Permit, if needed"],
    residents: ["Emirates ID", "UAE driving licence"],
    note: "Bring the originals to the handover. We check them and hand them straight back, and we never keep your passport or Emirates ID. You do not upload any documents on this website.",
  },
  deposit: () => {
    const { L, S, H } = rules.tiers;
    const same = L.releaseDays === S.releaseDays;
    return [
      { label: "Card", value: "Credit card in the main driver's name. Debit cards and cash are not accepted for the deposit." },
      { label: "Amount", value: `${depositRange(carsInTier("L"))} (${tierName("L")}), ${depositRange(carsInTier("S"))} (${tierName("S")}), ${depositRange(carsInTier("H"))} (${tierName("H")}). Each car's deposit is on the pricing page.` },
      { label: "When", value: "Held on your card at handover. It is a hold, so no money leaves your account unless we deduct a charge." },
      { label: "Release", value: `${same ? `${L.releaseDays} days` : `${L.releaseDays} or ${S.releaseDays} days`} after you return the car (${H.releaseDays} days for Bugattis), less any fines, tolls or charges. Your bank may take a further ${rules.bankReleaseWorkingDays} working days.` },
      { label: "Later fines", value: "If a fine arrives after the release, we charge it to the card on file and send you the fine notice." },
    ];
  },
  drivers: `Additional drivers must meet the same age and licence rules and be named on the rental agreement. Each one costs ${formatAED(rules.additionalDriverPerDay)} a day. If someone who is not named drives the car, the insurance does not cover it.`,
  noticeRows: () => {
    const { L, S, H } = rules.tiers;
    const baseMin = Math.min(...cars.filter((car) => car.tier !== "H").map((car) => car.minDays));
    const hyperMin = Math.min(...hypercars().map((car) => car.minDays));
    return [
      { key: "ls", what: `${tierName("L")} and ${tierName("S").toLowerCase()} self-drive`, notice: L.leadHours === S.leadHours ? noticeText(L.leadHours) : `${noticeText(L.leadHours)} / ${noticeText(S.leadHours)}`, min: `${baseMin} day (24 hours)` },
      { key: "h", what: `${tierName("H")} (Bugatti)`, notice: noticeText(H.leadHours), min: `${hyperMin} days` },
      { key: "ch", what: "Chauffeur", notice: noticeText(c.leadHours), min: `${c.minHours} hours` },
      { key: "festive", what: `Any car, festive peak (${festiveDates()})`, notice: "As above", min: `${festiveMinDays()} days` },
      { key: "peak", what: `Flagship cars, Friday to Sunday pickups in peak season`, notice: "As above", min: `${peakWeekendMinDays()} days` },
    ];
  },
  noticeNote: () => `Self-drive handovers run from ${rules.handoverHours.from} to ${rules.handoverHours.to}. You can book up to ${Math.round(rules.maxAdvanceDays / 30.4)} months ahead and request up to ${rules.maxOnlineDays} days online. Flagship cars: ${listJoin(flagshipCars().map((car) => car.name))}.`,
  insuranceRows: () => tierOrder.map((t) => {
    const tier = rules.tiers[t];
    return { key: t, tier: tier.name, excess: formatAED(tier.excess), fullCover: `${formatAED(tier.fullCoverPerDay)} / day`, withCover: formatAED(tier.fullCoverExcess) };
  }),
  exclusions: ["Driving under alcohol or drugs", "A driver who is not named on the agreement", "Racing or track use", "Off-road or sand driving", "Leaving the UAE", "Damage with no police report"],
  accident: `Report any accident or damage to the police (Dubai Police app or 999) and to us straight away. Without a police report you pay the full repair cost. Damage is charged from an agency-garage estimate, capped at the excess when the insurance applies. Loss of use during repairs is ${rules.lossOfUsePct}% of the daily rate, for up to ${rules.lossOfUseMaxDays} days.`,
  onTheRoad: () => {
    const common = commonKmPerDay();
    const exceptions = kmExceptions();
    const byKm = new Map<number, string[]>();
    for (const car of exceptions) byKm.set(car.rates.kmPerDay, [...(byKm.get(car.rates.kmPerDay) ?? []), car.model]);
    const kmText = [...byKm.entries()].map(([km, models]) => `${km} km on the ${listJoin(models)}`).join(" and ");
    return [
      { label: "Fuel", value: `Return the car with the same fuel level. If it is lower, we charge fuel at pump price plus ${formatAED(rules.refuelFee)}. Supercars and hypercars take Super 98 only.` },
      { label: "Kilometres", value: `${common} km a day on most cars${kmText ? ` (${kmText})` : ""}. Extra kilometres are charged per km at the rate on the pricing page.` },
      { label: "Salik and Darb", value: `Each toll crossing is charged at the tariff, ${salikTariff()}, plus ${formatAED(rules.tollAdminFee)}. Abu Dhabi's Darb is ${formatAED(rules.tolls.darbPeak)} at peak times.` },
      { label: "Fines", value: `Fines during the rental are yours, plus ${formatAED(rules.fineAdminFee)} admin per fine. Where the authority allows, we transfer the fine and black points to the driver's licence. If the car is impounded because of how it was driven, you pay the impound and release costs and loss of use.` },
      { label: "Where you can drive", value: "Within the UAE only. Crossing into Oman, off-road or track driving, racing, ride-hailing and commercial filming need our written approval." },
      { label: "In the car", value: `No smoking, vaping or pets (assistance animals are welcome). Cleaning or odour treatment costs ${formatAED(rules.cleaningFee)}.` },
      { label: "Tracking", value: "Our cars have GPS trackers for security and recovery. We check a car's location only for theft, emergencies, accidents or a suspected breach of these rules." },
      { label: "Late return", value: `Up to ${rules.graceMinutes} minutes late is free. After that, each started hour costs ${rules.lateReturnHourPct}% of the daily rate, up to one extra day.` },
    ];
  },
  chauffeurRules: () => [
    `Book at least ${c.leadHours} hours ahead. The minimum is ${c.minHours} hours, and one chauffeur works up to ${c.maxHours} hours a day.`,
    `Up to ${rules.chauffeur.maxPassengers} passengers, or fewer if the car has fewer seats. Child seats are free on request.`,
    "Waiting counts as booked time. Parking is charged at cost.",
    "Your chauffeur follows UAE traffic law and may refuse any unsafe or unlawful request.",
  ],
  faqs: (): FaqEntry[] => [
    {
      id: "under-25",
      q: `Can I rent a car if I am under ${rules.tiers.L.minAge}?`,
      a: `Not to drive yourself. The main driver and any additional drivers must be ${rules.tiers.L.minAge} or older for every car we rent, and ${rules.tiers.H.minAge} or older for Bugattis. A chauffeur booking has no age rule for passengers, so our [chauffeur service](/chauffeur) is the way to travel in one of our cars.`,
    },
    ...faqsById("idp", "documents", "deposit-release", "insurance"),
  ],
};

