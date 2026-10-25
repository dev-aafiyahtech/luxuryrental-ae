import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { formatAED } from "@/lib/format";
import { faqsById, type FaqEntry } from "./faq";
import { chauffeurFromHourly, chauffeurNames, festiveDates, listJoin } from "./shared";

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
    { label: listJoin(other.areas), value: `+${formatAED(other.chauffeurSurcharge ?? 0)}` },
  ],
  goodToKnow: () => [
    "Waiting time counts as booked time.",
    `One chauffeur works up to ${c.maxHours} hours a day.`,
    `Up to ${rules.chauffeur.maxPassengers} passengers per car. Child seats are free on request.`,
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
      a: `Tell your chauffeur. Extra time is charged at the car's extra-hour rate in the table above, per started ${c.overtimeStepMinutes} minutes, as long as the chauffeur's ${c.maxHours}-hour day allows it. If you already know the day will run long, a full day (${c.fullDayHours} hours) usually costs less.`,
    },
    ...faqsById("chauffeur-emirates"),
  ],
  /** Labels and short copy that used to sit in the page JSX. */
  ui: {
    crumb: "Chauffeur service",
    serviceType: "Chauffeur-driven luxury car hire",
    offerName: (car: string) => `${car} with chauffeur`,
    city: "Dubai",
    chooseCar: "Choose your car",
    whatsappText: `Hello ${site.businessName}, I'd like to book a chauffeur.`,
    factsLabel: "Chauffeur service at a glance",
    facts: (fromHourly: number, fromAirport: number) => [
      { label: "From", value: `${formatAED(fromHourly)} / hour`, note: `${c.minHours}-hour minimum` },
      { label: "Airport transfer", value: `From ${formatAED(fromAirport)}`, note: "DXB or DWC, one way within Dubai" },
      { label: "Notice", value: `${c.leadHours} hours`, note: "Sooner? Ask on WhatsApp" },
      { label: "Passengers", value: `Up to ${c.maxPassengers}`, note: "Child seats free on request" },
    ],
    howEyebrow: "How it works",
    howTitle: "Three steps to the back seat",
    stepsLabel: "How chauffeur booking works",
    ratesEyebrow: "Rates",
    ratesTitle: "Chauffeur rates",
    ratesIntro: () => `Fixed prices in AED, including ${site.vatRate}% VAT, for journeys within Dubai. Hourly bookings run from ${c.minHours} to ${c.maxHours} hours.`,
    tableCaption: "Chauffeur rates by car",
    col: {
      car: "Car",
      perHour: "Per hour",
      perHourNote: `${c.minHours} h minimum`,
      halfDay: "Half day",
      halfDayNote: `${c.halfDayHours} hours`,
      fullDay: "Full day",
      fullDayNote: `${c.fullDayHours} hours`,
      airport: "Airport transfer",
      airportNote: "One way",
      extra: "Extra hour",
      extraNote: `Per started ${c.overtimeStepMinutes} min`,
    },
    seats: (seats: string) => `${seats} seats`,
    tableFootnote: () => `Airport transfers run between DXB or DWC and anywhere in Dubai, with ${rules.airportWaitFreeMinutes} minutes' free waiting after landing. Surcharges for night starts, the festive peak and other emirates are listed below.`,
    offerNote: "It applies to half-day and full-day bookings outside the festive peak, and the free hour is taken off at the car's hourly rate.",
    includedEyebrow: "What you get",
    includedTitle: "Included, and what costs extra",
    inEvery: "In every booking",
    surchargesTitle: "Surcharges",
    surchargesNote: "Percentage surcharges apply to the booking price. Outside-Dubai surcharges apply to bookings that start in that area.",
    carsEyebrow: "The cars",
    carsTitle: "Choose your car",
    carsIntro: "The Phantom is offered with a chauffeur first. The Cullinan and the Bentayga can also be rented self-drive from the fleet pages.",
    imagesNote: "Car images are illustrations until photos of our own cars are ready.",
    faqTitle: "Chauffeur questions",
    ctaTitle: "Plan the day with us",
    ctaText: "Send us the date, the pickup point and where you need to be. We suggest the car and the package, and confirm the price on WhatsApp.",
    request: "Request a chauffeur",
  },
};

/** The shape the Arabic module (./ar/chauffeur.ts) follows. */
export type ChauffeurPageContent = typeof chauffeurPage;
