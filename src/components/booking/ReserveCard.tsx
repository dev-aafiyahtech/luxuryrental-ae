"use client";

// STUB — owned by the booking-flow workstream, which replaces this with the full card:
// date chips (Tomorrow · This weekend · 3 days · 7 days), a 30-day date rail, "More dates"
// calendar, live quote from lib/pricing and a Reserve link into /book/trip.
// Keep this props interface stable: the homepage and car pages already use it.

import Link from "next/link";
import type { Car } from "@/content/types";
import { useHref } from "@/i18n/client";
import { quote } from "@/lib/pricing";
import { useTripDraft } from "@/lib/booking/draft";
import { formatAED } from "@/lib/format";
import { formatRange } from "@/lib/dates";

export interface ReserveCardProps {
  car: Car;
  /** "panel" = glass card (homepage chapter 4, car page sidebar); "inline" = flat block (mobile car page). */
  variant?: "panel" | "inline";
  className?: string;
  /** Heading shown above the car name, e.g. "Your reservation". */
  eyebrow?: string;
}

export function ReserveCard({ car, variant = "panel", className, eyebrow = "Your reservation" }: ReserveCardProps) {
  const [trip, , hydrated] = useTripDraft();
  const href = useHref();
  const q = hydrated ? quote({ car, service: "self-drive", pickupDate: trip.pickupDate, pickupTime: trip.pickupTime, returnDate: trip.returnDate, returnTime: trip.returnTime, pickupZone: trip.handover === "collect" ? "dso" : trip.pickup.zone }) : null;
  return (
    <div className={`${variant === "panel" ? "glass" : "card"} grid gap-4 p-6 ${className ?? ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <p className="display-sm">{car.name}</p>
      <p className="text-sm text-muted">{hydrated && trip.pickupDate && trip.returnDate ? formatRange(trip.pickupDate, trip.returnDate) : "Choose your dates"}</p>
      <p className="flex items-baseline justify-between"><span className="label">Total</span><strong className="font-display text-2xl text-accent-hover tabular">{q ? formatAED(q.total) : "—"}</strong></p>
      <Link className="btn btn-primary" href={href(`/book/trip?car=${car.slug}`)}>{car.rates.onRequest ? "Request" : "Reserve"}</Link>
    </div>
  );
}
