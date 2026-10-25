"use client";

import Link from "next/link";
import clsx from "clsx";
import type { MouseEvent } from "react";
import { CalendarDays, PencilLine } from "lucide-react";
import { useHref, useLocale, useT } from "@/i18n/client";
import { useTripDraft } from "@/lib/booking/draft";
import { formatDay, formatRange } from "@/lib/dates";
import { getZone } from "@/content/zones";

/** Name of the window event the booking dock may listen for; it calls preventDefault() when it opens. */
export const DOCK_OPEN_EVENT = "lr:dock:open";

/**
 * "Your trip · Fri 24 – Sun 26 Oct · Delivery · Edit trip", shown on the fleet page once the visitor
 * has chosen dates (in the dock or on a car page). Edit asks the dock to open; if nothing handles
 * the request it falls back to the trip step of the booking flow.
 */
export function TripBar({ className, zoneNames }: { className?: string; /** Zone names in the page language, by slug (from the server page). */ zoneNames?: Record<string, string> }) {
  const t = useT("fleet");
  const locale = useLocale();
  const href = useHref();
  const [trip, , hydrated] = useTripDraft();
  const chosen = hydrated && trip.updatedAt > 0 && !!trip.pickupDate && (trip.service === "chauffeur" || !!trip.returnDate);
  if (!chosen || !trip.pickupDate) return null;

  const when = trip.service === "chauffeur" ? `${formatDay(trip.pickupDate, locale)}${locale === "ar" ? "، " : ", "}${trip.pickupTime}` : formatRange(trip.pickupDate, trip.returnDate ?? trip.pickupDate, locale);
  const zone = getZone(trip.pickup.zone);
  const how =
    trip.service === "chauffeur"
      ? t("trip.chauffeur")
      : trip.handover === "collect"
        ? t("trip.collect")
        : `${t("trip.delivery")}${zone && zone.slug !== "dubai" ? `${locale === "ar" ? "،" : ","} ${zone.kind === "airport" ? zone.slug.toUpperCase() : zoneNames?.[zone.slug] ?? zone.name}` : ""}`;

  const onEdit = (e: MouseEvent<HTMLAnchorElement>) => {
    const handled = !window.dispatchEvent(new CustomEvent(DOCK_OPEN_EVENT, { cancelable: true }));
    if (handled) e.preventDefault();
  };

  return (
    <div className={clsx("card flex flex-wrap items-center gap-x-4 gap-y-2 border-accent/40 px-4 py-3 sm:px-5", className)}>
      <CalendarDays className="h-5 w-5 flex-none text-accent" aria-hidden="true" />
      <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="label">{t("trip.label")}</span>
        <span className="font-semibold tabular">{when}</span>
        <span className="text-sm text-muted" aria-hidden="true">·</span>
        <span className="text-sm text-champagne">{how}</span>
      </p>
      <Link href={href(`/book/trip${trip.carSlug ? `?car=${trip.carSlug}` : ""}`)} onClick={onEdit} className="btn btn-ghost btn-sm -me-2 gap-2 text-accent-hover hover:text-fg">
        <PencilLine className="h-4 w-4" aria-hidden="true" />
        {t("trip.edit")}
      </Link>
    </div>
  );
}
