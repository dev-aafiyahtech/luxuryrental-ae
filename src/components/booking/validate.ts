import type { Car } from "@/content/types";
import { getZone } from "@/content/zones";
import type { Quote, QuoteField, ServiceMode } from "@/lib/pricing";
import type { TripDraft } from "@/lib/booking/types";
import { emailOk, flightOk, phoneError } from "./lib";
import type { FormError } from "./ErrorSummary";

type T = (key: string, vars?: Record<string, string | number>) => string;

// Field ids used by the steps (the error summary links and focuses them).
export const tripFieldId: Record<QuoteField, string> = {
  car: "trip-car",
  pickupDate: "trip-dates",
  returnDate: "trip-dates",
  pickupTime: "trip-pickup-time",
  returnTime: "trip-return-time",
  pickupZone: "trip-zone",
  returnZone: "trip-return-zone",
  hours: "trip-package",
};

const isAirport = (slug?: string) => !!slug && getZone(slug)?.kind === "airport";

/** Step 1 errors: the quote's issues plus the flight-number format. */
export function tripErrors(trip: TripDraft, q: Quote | null, service: ServiceMode, t: T): FormError[] {
  const out: FormError[] = [];
  for (const i of q?.issues ?? []) {
    if (!out.some((e) => e.message === i.message)) out.push({ id: tripFieldId[i.field], message: i.message });
  }
  const delivering = service === "chauffeur" || trip.handover === "delivery";
  if (delivering && isAirport(trip.pickup.zone) && !flightOk(trip.pickup.flight)) out.push({ id: "trip-flight", message: t("errors.flight") });
  if (service === "self-drive" && !trip.sameReturn && isAirport(trip.dropoff.zone) && !flightOk(trip.dropoff.flight)) out.push({ id: "trip-return-flight", message: t("errors.flight") });
  return out;
}

/** Step 3 errors, keyed by field id (so each can be shown inline on blur). */
export function driverErrors(trip: TripDraft, car: Car | undefined, service: ServiceMode, t: T): FormError[] {
  const d = trip.driver;
  const out: FormError[] = [];
  if (!d.name || d.name.trim().length < 2) out.push({ id: "driver-name", message: t("errors.name") });
  const phone = phoneError(d.phone);
  if (phone) out.push({ id: "driver-phone", message: t(phone === "required" ? "errors.phoneRequired" : phone === "uaeMobile" ? "errors.phoneUaeMobile" : "errors.phoneInvalid") });
  if (d.channel === "email" && !d.email?.trim()) out.push({ id: "driver-email", message: t("errors.emailRequired") });
  else if (!emailOk(d.email)) out.push({ id: "driver-email", message: t("errors.emailInvalid") });
  if (service === "self-drive") {
    if (d.ageBand === "under-25") out.push({ id: "driver-age", message: t("errors.under25") });
    else if (car && car.minAge >= 30 && d.ageBand !== "30+") out.push({ id: "driver-age", message: t("errors.minAge", { age: car.minAge }) });
    if (d.resident && d.licenceCountry !== "AE") out.push({ id: "driver-licence", message: t("errors.residentLicence") });
  }
  return out;
}

/** Step 4 consent errors. */
export function consentErrors(trip: TripDraft, t: T): FormError[] {
  const out: FormError[] = [];
  if (!trip.driver.ackTerms) out.push({ id: "review-ack", message: t("errors.ack") });
  if (trip.driver.channel === "whatsapp" && !trip.driver.whatsappConsent) out.push({ id: "review-wa", message: t("errors.whatsappConsent") });
  return out;
}

export const errorFor = (errors: FormError[], id: string) => errors.find((e) => e.id === id)?.message;
