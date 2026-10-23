import { rules } from "@/content/rules";
import { getZone } from "@/content/zones";
import { formatAED } from "@/lib/format";
import { faqsById, type FaqEntry } from "./faq";
import { chauffeurFromHourly, chauffeurNames, extraRules as x, festiveDates, listJoin } from "./shared";

// Copy for /chauffeur (workstream 06 §6.2). Rates come from each car's `chauffeur` block in
// cars.ts; rules (minimum hours, notice, surcharges) from rules.chauffeur and zones.ts.

const c = rules.chauffeur;
const shjAjm = getZone("sharjah-ajman")!;
const auh = getZone("abu-dhabi")!;
const other = getZone("other-emirates")!;

export const chauffeurPage = {
  meta: {
    title: "Chauffeur Service Dubai: Rolls-Royce & Bentley with Driver",
    description: () => `Chauffeur hire from ${formatAED(chauffeurFromHourly())}/hour: airport pickups, weddings and business days in a Rolls-Royce Phantom, Cullinan or Bentley Bentayga across Dubai.`,
  },
  hero: {
    eyebrow: "Chauffeur service",
    title: "Chauffeur service in Dubai",
    lede: () => [
      `Book the ${chauffeurNames()} with a driver. Choose hourly with a ${c.minHours}-hour minimum, a half or full day, or a single airport transfer.`,
      "Fuel, Salik and Darb tolls are in the price, and the chauffeur waits while you work, shop or celebrate.",
    ],
  },
  steps: [
    { title: "Choose the car and the time", text: () => `Pick the car, then hourly (${c.minHours} hours or more), a half day, a full day or an airport transfer. Book at least ${c.leadHours} hours ahead.` },
    { title: "Send the request", text: () => "Add the pickup address and time, the route if you know it, and your flight number for an airport pickup. Nothing is charged on this website." },
    { title: "We confirm on WhatsApp", text: () => "We check the car and a chauffeur for your time, then confirm the price on WhatsApp. On the day, your chauffeur meets you at the pickup point." },
  ],
  surcharges: () => [
    { label: "Journeys starting 00:00–06:00", value: `+${c.nightSurchargePct}%` },
    { label: `Festive peak, ${festiveDates()}`, value: `+${c.superPeakSurchargePct}%` },
    { label: shjAjm.name, value: `+${formatAED(shjAjm.chauffeurSurcharge ?? 0)}` },
    { label: auh.name, value: `+${formatAED(auh.chauffeurSurcharge ?? 0)}` },
    { label: listJoin(other.areas), value: "On request" },
  ],
  goodToKnow: () => [
    "Waiting time counts as booked time.",
    `One chauffeur works up to ${c.maxHours} hours a day.`,
    `Up to ${x.chauffeurMaxPassengers} passengers per car. Child seats are free on request.`,
    "Parking is charged at cost.",
    "Your chauffeur follows UAE traffic law and may refuse any unsafe or unlawful request.",
  ],
  faqs: (): FaqEntry[] => [
    {
      id: "wedding",
      q: "Can I book a chauffeur for a wedding?",
      a: `Yes. The Phantom is the car we suggest for weddings. Book a half day or a full day so the car can wait between the ceremony, the photos and the reception, because waiting counts as booked time. Send us the venues and timings on WhatsApp and we suggest the right package.`,
    },
    {
      id: "airport-transfer",
      q: "How does an airport transfer work?",
      a: `An airport transfer is one trip at a fixed price between DXB or DWC and anywhere in Dubai. Add your flight number to the request. Your chauffeur tracks the flight and meets you at arrivals, and the first ${rules.airportWaitFreeMinutes} minutes after landing are free.`,
    },
    {
      id: "overtime",
      q: "What if we need the car for longer?",
      a: `Tell your chauffeur. Extra time is charged at the car's extra-hour rate in the table above, per started 30 minutes, as long as the chauffeur's ${c.maxHours}-hour day allows it. If you already know the day will run long, a full day (${c.fullDayHours} hours) usually costs less.`,
    },
    ...faqsById("chauffeur-emirates"),
  ],
};
