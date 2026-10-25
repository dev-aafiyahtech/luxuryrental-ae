import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { localizeZone } from "@/content/localize";
import { formatRange, formatDay } from "./dates";
import { formatAED } from "./format";
import { arabicHours } from "./pricing";
import type { BookingRecord, TripDraft } from "./booking/types";

// WhatsApp hand-off (plan D-08). The customer always sends the first message; the
// reference comes first so ops can find the stored request.
// Every message builder takes an optional locale: Arabic visitors send the message in Arabic
// (the reference, car name, times and amounts stay in Latin script and Western digits, so the
// ops team can match it to the stored request whatever language they read).

export function whatsappHref(text?: string): string {
  return `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

const EN = {
  pickup: "Pickup",
  collect: "Handover: Collect at Dubai Silicon Oasis",
  delivery: (where: string) => `Handover: Delivery ${where}`,
  inDubai: "in Dubai",
  toZone: (zone: string) => `to ${zone}`,
  flight: (f: string) => ` (flight ${f})`,
  hello: (ref: string) => `Hello ${site.businessName}, I'd like to confirm booking request ${ref}.`,
  car: "Car",
  withChauffeur: " with chauffeur",
  date: "Date",
  hours: (n: number) => `${n} hours`,
  airport: "airport transfer",
  from: "From",
  until: "Until",
  quote: "Quote",
  fromPrice: "from ",
  inclVat: "incl. VAT",
  deposit: "Refundable deposit",
  name: "Name",
  book: (carName?: string) => `Hello ${site.businessName}, I'd like to book${carName ? ` the ${carName}` : " a car"}.`,
  dates: "Dates",
  times: (pickup: string, ret: string) => `Times: pickup ${pickup}, return ${ret}`,
  package: "Package",
  return: "Return",
  extras: "Extras",
  fullCover: "Full Cover",
  drivers: (n: number) => `${n} additional driver(s)`,
  seats: (n: number) => `${n} child seat(s)`,
  notes: "Notes",
  halfDay: (h: number) => `Half day, ${h} hours`,
  fullDay: (h: number) => `Full day, ${h} hours`,
  airportTransfer: "Airport transfer",
  comma: ", ",
};
type Words = typeof EN;

// Arabic (UAE), Modern Standard Arabic. Demo translation, to be reviewed with the rest of the Arabic.
const AR: Words = {
  pickup: "مكان الانطلاق",
  collect: "التسليم: الاستلام من مكتبنا في واحة دبي للسيليكون",
  delivery: (where) => `التسليم: توصيل ${where}`,
  inDubai: "داخل دبي",
  toZone: (zone) => `إلى ${zone}`,
  flight: (f) => ` (رقم الرحلة ${f})`,
  hello: (ref) => `مرحبًا ${site.businessName}، أودّ تأكيد طلب الحجز ${ref}`,
  car: "السيارة",
  withChauffeur: " مع سائق خاص",
  date: "التاريخ",
  hours: (n) => arabicHours(n),
  airport: "توصيل من المطار أو إليه",
  from: "من",
  until: "حتى",
  quote: "السعر",
  fromPrice: "ابتداءً من ",
  inclVat: "شامل ضريبة القيمة المضافة",
  deposit: "مبلغ التأمين المسترد",
  name: "الاسم",
  book: (carName) => `مرحبًا ${site.businessName}، أودّ طلب حجز ${carName ? `سيارة ${carName}` : "سيارة"}`,
  dates: "التواريخ",
  times: (pickup, ret) => `المواعيد: الاستلام ${pickup}، الإرجاع ${ret}`,
  package: "الباقة",
  return: "الإرجاع",
  extras: "الإضافات",
  fullCover: "التغطية الشاملة",
  drivers: (n) => `سائقون إضافيون: ${n}`,
  seats: (n) => `مقاعد أطفال: ${n}`,
  notes: "ملاحظات",
  halfDay: (h) => `نصف يوم، ${arabicHours(h)}`,
  fullDay: (h) => `يوم كامل، ${arabicHours(h)}`,
  airportTransfer: "توصيل من المطار أو إليه",
  comma: "، ",
};

/** WhatsApp message words for a locale (English unless "ar"). Also used by the booking flow's draft message. */
export const waWords = (locale?: string): Words => (locale === "ar" ? AR : EN);

const zoneText = (slug: string, locale?: string) => localizeZone(getZone(slug), locale)?.name ?? slug;

function handoverText(trip: TripDraft, locale?: string): string {
  const w = waWords(locale);
  if (trip.service === "chauffeur") return `${w.pickup}: ${zoneText(trip.pickup.zone, locale)}${trip.pickup.address ? `${w.comma}${trip.pickup.address}` : ""}`;
  if (trip.handover === "collect") return w.collect;
  const zone = trip.pickup.zone === "dubai" ? w.inDubai : w.toZone(zoneText(trip.pickup.zone, locale));
  return `${w.delivery(zone)}${trip.pickup.address ? `${w.comma}${trip.pickup.address}` : ""}${trip.pickup.flight ? w.flight(trip.pickup.flight) : ""}`;
}

/** Message for a stored booking request. */
export function bookingMessage(b: BookingRecord, locale?: string): string {
  const w = waWords(locale);
  const t = b.trip;
  const day = (iso?: string) => (iso ? formatDay(iso, locale) : "");
  const when = t.service === "chauffeur"
    ? `${w.date}: ${day(t.pickupDate)} ${t.pickupTime}${w.comma}${b.quote.hours ? w.hours(b.quote.hours) : w.airport}`
    : `${w.from}: ${day(t.pickupDate)} ${t.pickupTime}   ${w.until}: ${day(t.returnDate)} ${t.returnTime}`;
  const lines = [
    w.hello(b.ref),
    `${w.car}: ${b.carName}${t.service === "chauffeur" ? w.withChauffeur : ""}`,
    when,
    handoverText(t, locale),
    `${w.quote}: ${b.quote.onRequest ? w.fromPrice : ""}${formatAED(b.quote.total, locale)} ${w.inclVat}${b.quote.deposit ? ` · ${w.deposit}: ${formatAED(b.quote.deposit, locale)}` : ""}`,
  ];
  if (t.driver.name) lines.push(`${w.name}: ${t.driver.name}`);
  return lines.join("\n");
}

/** Message for a visitor who wants to finish on WhatsApp before sending the request. */
export function draftMessage(trip: TripDraft, carName?: string, locale?: string): string {
  const w = waWords(locale);
  const lines = [w.book(carName)];
  if (trip.pickupDate && trip.returnDate && trip.service === "self-drive") lines.push(`${w.dates}: ${formatRange(trip.pickupDate, trip.returnDate, locale)}`);
  if (trip.pickupDate && trip.service === "chauffeur") lines.push(`${w.date}: ${formatDay(trip.pickupDate, locale)} ${trip.pickupTime}`);
  lines.push(handoverText(trip, locale));
  return lines.join("\n");
}
