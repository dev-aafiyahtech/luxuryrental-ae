import { cars, chauffeurCars } from "@/content/cars";
import { brands } from "@/content/brands";
import { getZone } from "@/content/zones";
import { site } from "@/content/site";
import { formatAED } from "@/lib/format";
import { listJoin } from "./shared";

// Simulated About copy for the demo (workstream 06: 300–400 words, no invented founding
// year, awards, customer counts or team photos). Company details come from site.ts (sample
// values in the demo). Fleet facts are read from the data so they stay true when the fleet changes.

const cheapest = [...cars].sort((a, b) => a.rates.daily - b.rates.daily)[0];
const halo = [...cars].sort((a, b) => b.specs.hp - a.specs.hp)[0];
const dubai = getZone("dubai")!;
const chauffeur = chauffeurCars().map((c) => c.name.replace(/ Series II.*$| EWB.*$/, ""));
const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
export const word = (n: number) => words[n] ?? String(n);

export const aboutPage = {
  meta: {
    title: "About Us: Luxury Car Rental from Dubai Silicon Oasis",
    description: `${site.businessName} rents ${cars.length} cars from ${brands.length} brands out of Dubai Silicon Oasis. Prices include VAT, and a person confirms every request on WhatsApp.`,
  },
  hero: {
    eyebrow: "About us",
    title: `About ${site.businessName}`,
    lede: `We rent ${word(cars.length)} cars from ${word(brands.length)} brands out of Dubai Silicon Oasis, and a person confirms every booking on WhatsApp.`,
  },
  storyTitle: `${word(cars.length).replace(/^./, (c) => c.toUpperCase())} cars, known in detail`,
  cta: `Browse all ${word(cars.length)} cars with their daily rates, deposits and included kilometres, then send a request for your dates.`,
  story: [
    `${site.businessName} is a car rental company based in Dubai Silicon Oasis. We keep a small fleet on purpose: ${word(cars.length)} cars from ${word(brands.length)} brands, from the ${cheapest.name} to the ${halo.name}. We would rather know every car in detail than list hundreds we have never driven.`,
    `Renting a luxury car should not come with surprises: a price that grows when VAT is added, a deposit nobody mentioned, or a different car on the day. ${site.businessName} is set up to work the other way round.`,
    `Every price on this site includes VAT, and the deposit sits next to it before you ask for anything. You send a request. A member of our team checks the car, your dates and your licence, then confirms on WhatsApp. Nothing is booked until we say so, and nothing is charged on this website.`,
    `The cars are kept at our office in Dubai Silicon Oasis, beside the Dubai–Al Ain Road. From there we deliver across Dubai, meet flights at DXB and DWC, and drive out to Sharjah, Abu Dhabi and Hatta. Rentals of ${dubai.freeFromDays} days or more are delivered free anywhere in Dubai.`,
    `Some trips are better with a driver. The ${listJoin(chauffeur)} come with a chauffeur by the hour, for weddings, business days and airport arrivals.`,
    `We are a new name, so there are no reviews to show you yet. What we can show you is every rate, fee and rule, written down in one place, so you know the price before you message us.`,
  ],
  pillars: [
    { title: "The price includes VAT", text: () => `Daily, weekly and monthly rates include ${site.vatRate}% VAT. The deposit, delivery and every fee are on our pricing page, so you see the full price before you send a request.` },
    { title: "A person confirms every booking", text: () => `Requests go to our team, who check the car and your details before confirming. ${site.replyPromise}` },
    { title: "Delivered where you are", text: () => `Free delivery anywhere in Dubai for rentals of ${dubai.freeFromDays} days or more, and meet-and-greet at DXB and DWC for ${formatAED(getZone("dxb")!.fee ?? 0)}.` },
  ],
  company: () => [
    { label: "Trading name", value: site.businessName },
    { label: "Legal entity", value: site.legalName },
    { label: "Trade licence", value: `${site.tradeLicence}, issued by ${site.licenceAuthority}` },
    { label: "RTA rental permit", value: site.rtaPermit },
    { label: "VAT TRN", value: site.vatTrn },
    { label: "Address", value: `${site.address.line1}, ${site.address.area}, ${site.address.city}` },
    { label: "Hours", value: site.hours },
  ],
};
