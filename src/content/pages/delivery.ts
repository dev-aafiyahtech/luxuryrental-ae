import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { getZone, zones } from "@/content/zones";
import { formatAED } from "@/lib/format";
import { faqsById, type FaqEntry } from "./faq";
import { chauffeurFromAirport, listJoin, noticeText } from "./shared";

// Copy for /delivery and the two MVP area pages (workstream 06 §6.2, 07 §7.2). Fees come
// from zones.ts and rules.ts. Area pages carry facts that appear nowhere else on the site.

const dubai = getZone("dubai")!;
const dso = getZone("dso")!;
const dxb = getZone("dxb")!;
const dwc = getZone("dwc")!;
const { from, to } = rules.handoverHours;
const { L, H } = rules.tiers;

/** "AED 150", "Free", "On request" for a zone fee. */
export const zoneFee = (fee: number | null) => (fee === null ? "On request" : fee === 0 ? "Free" : formatAED(fee));

export const deliveryPage = {
  meta: {
    title: "Car Delivery in Dubai: Zones, Fees and Airport Handover",
    description: () => `Delivery anywhere in Dubai, free for rentals of ${dubai.freeFromDays} days or more. DXB and DWC meet-and-greet for ${formatAED(dxb.fee ?? 0)}. Handovers ${from}–${to} daily.`,
  },
  hero: {
    eyebrow: "Delivery and collection",
    title: "Delivery and collection across Dubai",
    lede: () => [
      "We bring the car to your hotel, home or office, or meet you at DXB or DWC arrivals, and collect it from wherever you finish.",
      `Inside Dubai it is free for rentals of ${dubai.freeFromDays} days or more.`,
    ],
  },
  facts: () => [
    { label: "Anywhere in Dubai", value: `Free from ${dubai.freeFromDays} days`, note: `${formatAED(dubai.fee ?? 0)} each way for shorter rentals` },
    { label: "Airports", value: formatAED(dxb.fee ?? 0), note: "Per handover at DXB or DWC" },
    { label: "Handover hours", value: `${from}–${to}`, note: `Outside these hours +${formatAED(rules.outOfHoursFee)}` },
    { label: "Collect yourself", value: zoneFee(dso.fee), note: "At our Dubai Silicon Oasis office" },
  ],
  base: () => [
    `Every car starts its day at our office in ${dso.areas[0]}, beside the Dubai–Al Ain Road (E66) and Sheikh Mohammed Bin Zayed Road (E311). From there it is about 20 km to Downtown Dubai or DXB.`,
    "Deliveries are planned from the time you choose. You can also collect the car from the office yourself, at no charge.",
  ],
  handover: () => [
    { title: "On time", text: `We arrive within ${rules.slotToleranceMinutes} minutes of the time you choose, with the car cleaned and checked.` },
    { title: "Main driver present", text: `The main driver must attend with original documents. The handover takes ${rules.handoverMinutes} minutes, including condition photos and the deposit hold.` },
    { title: "Return anywhere", text: "You can return the car at a different place from where you collected it. That zone's fee applies to the collection." },
    { title: "Late or early", text: `Handovers between ${to} and ${from} cost ${formatAED(rules.outOfHoursFee)} extra, subject to availability. Ask on WhatsApp for very early flights.` },
  ],
  faqs: (): FaqEntry[] => [
    {
      id: "return-elsewhere",
      q: "Can I return the car somewhere else?",
      a: `Yes. Choose a different return place in your request. The fee for that zone applies to the collection, and returning at our ${dso.areas[0]} office is free.`,
    },
    {
      id: "outside-dubai",
      q: "Do you deliver outside Dubai?",
      a: `Yes. ${zones.filter((z) => z.kind === "zone" && z.fee && z.slug !== "dubai").map((z) => `${z.name}: ${formatAED(z.fee!)} each way`).join(". ")}. Book these at least 24 hours ahead. Handover at Abu Dhabi (AUH) or Sharjah (SHJ) airport costs the same as the emirate.`,
    },
    {
      id: "in-person",
      q: "Do I need to be there in person?",
      a: `Yes. The main driver must be at the handover with their original licence and passport or Emirates ID, and the credit card for the deposit. We check the documents and hand them straight back.`,
    },
    ...faqsById("collect", "hours"),
  ],
};

export interface AreaPage {
  slug: string;
  zone: string;
  name: string;
  meta: { title: string; description: () => string };
  eyebrow: string;
  title: string;
  lede: () => string[];
  facts: () => { label: string; value: string; note?: string }[];
  steps: { title: string; text: () => string }[];
  faqs: () => FaqEntry[];
}

export const areaPages: AreaPage[] = [
  {
    slug: "dubai-airport-dxb",
    zone: "dxb",
    name: "Dubai Airport (DXB)",
    meta: {
      title: "Luxury Car Rental Dubai Airport (DXB): Delivery & Handover",
      description: () => `Your car at DXB ${listJoin(dxb.areas)} for ${formatAED(dxb.fee ?? 0)}: meet-and-greet at arrivals, airport parking and flight tracking included, ${rules.airportWaitFreeMinutes} minutes' free waiting.`,
    },
    eyebrow: "Airport handover",
    title: "Luxury cars delivered to Dubai Airport (DXB)",
    lede: () => [
      `We meet you in the arrivals hall at ${listJoin(dxb.areas)}, walk you to the car in the airport car park and hand it over there.`,
      `The handover costs ${formatAED(dxb.fee ?? 0)}, with parking and meet-and-greet included. We track your flight, so a late landing is our problem to plan around.`,
    ],
    facts: () => [
      { label: "Handover fee", value: formatAED(dxb.fee ?? 0), note: "Parking and meet-and-greet included" },
      { label: "Free waiting", value: `${rules.airportWaitFreeMinutes} minutes`, note: `Then ${formatAED(rules.airportWaitPerHour)} per started hour` },
      { label: "Terminals", value: dxb.areas.map((a) => a.replace("Terminal ", "T")).join(", "), note: "Arrivals hall" },
      { label: "From our base", value: "About 20 km", note: "Dubai Silicon Oasis" },
    ],
    steps: [
      { title: "Add your flight number", text: () => "Put your flight number and terminal in the request. If you land at Al Maktoum International instead, choose DWC; the fee is the same." },
      { title: "We track the flight", text: () => `We follow your flight on the day, so an early or late landing moves the meeting time with it. Your ${rules.airportWaitFreeMinutes} free minutes start when the plane lands.` },
      { title: "Meet us at arrivals", text: () => "After passport control and baggage reclaim, come out into the arrivals hall. Your driver meets you there and walks you to the car." },
      { title: "Check and sign", text: () => `We check the main driver's original documents, take condition photos, note the km and fuel, and place the deposit hold. It takes ${rules.handoverMinutes} minutes.` },
      { title: "Drive away", text: () => "You leave with the rental agreement and our WhatsApp number for anything you need during the rental." },
    ],
    faqs: () => [
      {
        id: "dxb-delay",
        q: "What if my flight is delayed?",
        a: `We track the flight, so a delay moves the meeting time with it at no cost. The ${rules.airportWaitFreeMinutes} free minutes start when you land. If clearing immigration and baggage takes longer than that, waiting costs ${formatAED(rules.airportWaitPerHour)} per started hour; message us on WhatsApp if you are held up.`,
      },
      {
        id: "dxb-return",
        q: "Can I return the car at DXB before my flight?",
        a: `Yes. Choose DXB as the return place and tell us your departure terminal and flight time. We meet you at the terminal and check the car together. The return handover also costs ${formatAED(dxb.fee ?? 0)}. Allow 30 minutes for it on top of the airline's check-in time.`,
      },
      {
        id: "dxb-terminal",
        q: "Which terminal will I arrive at?",
        a: "Emirates uses Terminal 3. flydubai uses Terminals 2 and 3, and most other airlines use Terminal 1. Your ticket or the airline's app shows the terminal; add it to your request and we meet you there.",
      },
      {
        id: "dxb-chauffeur",
        q: "Can a chauffeur meet me instead?",
        a: `Yes. Chauffeur airport transfers from DXB or DWC to anywhere in Dubai start at ${formatAED(chauffeurFromAirport())} one way, with ${rules.airportWaitFreeMinutes} minutes' free waiting. See our [chauffeur service](/chauffeur).`,
      },
    ],
  },
  {
    slug: "dubai-silicon-oasis",
    zone: "dso",
    name: "Dubai Silicon Oasis",
    meta: {
      title: "Luxury Car Rental Dubai Silicon Oasis: Delivery & Handover",
      description: () => `Collect and return your car at our Dubai Silicon Oasis office at no charge, by appointment. Open ${site.hours.replace(/^Daily /, "daily ")}. Delivery across Dubai starts here.`,
    },
    eyebrow: "Our office",
    title: "Collect your car in Dubai Silicon Oasis",
    lede: () => [
      "Our office in Dubai Silicon Oasis is where the cars are prepared and where every delivery starts.",
      "You can collect and return your car here at no charge. Book a time with your request and we have the car ready at the door.",
    ],
    facts: () => [
      { label: "Collection and return", value: zoneFee(dso.fee), note: "By appointment" },
      { label: "Office hours", value: site.hours.replace(/^Daily /, ""), note: "Every day" },
      { label: "Notice", value: noticeText(L.leadHours), note: `${noticeText(H.leadHours)} for Bugattis` },
      { label: "Address", value: site.address.line1, note: `${site.address.area}, ${site.address.city}` },
    ],
    steps: [
      { title: "Choose office collection", text: () => "Pick the car and your dates, choose collection at Dubai Silicon Oasis, and set a time. We confirm the slot on WhatsApp." },
      { title: "Bring your documents", text: () => "The main driver brings the original licence, passport or Emirates ID, an International Driving Permit if needed, and the credit card for the deposit." },
      { title: "Handover at the office", text: () => `We walk around the car with you, take condition photos and place the deposit hold. It takes ${rules.handoverMinutes} minutes.` },
      { title: "Return here, or anywhere", text: () => "Bring the car back to the office at no charge, or choose a delivery zone for the return and we collect it from you." },
    ],
    faqs: () => [
      {
        id: "dso-appointment",
        q: "Do I need an appointment to collect?",
        a: `Yes. Choose office collection and a time in your request, and we confirm the slot on WhatsApp. Luxury cars and supercars need ${noticeText(L.leadHours)}' notice.`,
      },
      {
        id: "dso-where",
        q: "Where exactly is the office?",
        a: `${site.address.line1}, ${site.address.area}, ${site.address.city}. ${site.address.directions} [Open in Google Maps](${site.address.mapUrl}).`,
      },
      {
        id: "dso-live-nearby",
        q: "I live in Dubai Silicon Oasis. Can you deliver to my door?",
        a: `Yes. Delivery to your home follows our Dubai rate: free for rentals of ${dubai.freeFromDays} days or more, and ${formatAED(dubai.fee ?? 0)} each way for shorter rentals.`,
      },
    ],
  },
];

export const getAreaPage = (slug: string) => areaPages.find((a) => a.slug === slug);
export { dwc };
