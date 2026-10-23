import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { formatRange, formatDay } from "./dates";
import { formatAED } from "./format";
import type { BookingRecord, TripDraft } from "./booking/types";

// WhatsApp hand-off (plan D-08). The customer always sends the first message; the
// reference comes first so ops can find the stored request.

export function whatsappHref(text?: string): string {
  return `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function handoverText(trip: TripDraft): string {
  if (trip.service === "chauffeur") return `Pickup: ${getZone(trip.pickup.zone)?.name ?? trip.pickup.zone}${trip.pickup.address ? `, ${trip.pickup.address}` : ""}`;
  if (trip.handover === "collect") return "Handover: Collect at Dubai Silicon Oasis";
  const zone = trip.pickup.zone === "dubai" ? "in Dubai" : `to ${getZone(trip.pickup.zone)?.name ?? trip.pickup.zone}`;
  return `Handover: Delivery ${zone}${trip.pickup.address ? `, ${trip.pickup.address}` : ""}${trip.pickup.flight ? ` (flight ${trip.pickup.flight})` : ""}`;
}

/** Message for a stored booking request. */
export function bookingMessage(b: BookingRecord): string {
  const t = b.trip;
  const when = t.service === "chauffeur"
    ? `Date: ${t.pickupDate ? formatDay(t.pickupDate) : ""} ${t.pickupTime}, ${b.quote.hours ? `${b.quote.hours} hours` : "airport transfer"}`
    : `From: ${t.pickupDate ? formatDay(t.pickupDate) : ""} ${t.pickupTime}   Until: ${t.returnDate ? formatDay(t.returnDate) : ""} ${t.returnTime}`;
  const lines = [
    `Hello ${site.businessName}, I'd like to confirm booking request ${b.ref}.`,
    `Car: ${b.carName}${t.service === "chauffeur" ? " with chauffeur" : ""}`,
    when,
    handoverText(t),
    `Quote: ${b.quote.onRequest ? "from " : ""}${formatAED(b.quote.total)} incl. VAT${b.quote.deposit ? ` · Refundable deposit: ${formatAED(b.quote.deposit)}` : ""}`,
  ];
  if (t.driver.name) lines.push(`Name: ${t.driver.name}`);
  return lines.join("\n");
}

/** Message for a visitor who wants to finish on WhatsApp before sending the request. */
export function draftMessage(trip: TripDraft, carName?: string): string {
  const lines = [`Hello ${site.businessName}, I'd like to book${carName ? ` the ${carName}` : " a car"}.`];
  if (trip.pickupDate && trip.returnDate && trip.service === "self-drive") lines.push(`Dates: ${formatRange(trip.pickupDate, trip.returnDate)}`);
  if (trip.pickupDate && trip.service === "chauffeur") lines.push(`Date: ${formatDay(trip.pickupDate)} ${trip.pickupTime}`);
  lines.push(handoverText(trip));
  return lines.join("\n");
}
