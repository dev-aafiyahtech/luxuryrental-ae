"use client";

import { CalendarX2 } from "lucide-react";
import { useT } from "@/i18n/client";
import type { Busy } from "@/lib/booking/availability";
import { addDays, daysBetween, formatDay } from "@/lib/dates";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** "Thu 5 Nov" or "Thu 5 Nov – Fri 6 Nov" for a busy stretch (days inclusive). */
export const busyRange = (b: Busy) => (b.from === b.to ? formatDay(b.from) : `${formatDay(b.from)} – ${formatDay(b.to)}`);

/** One line saying why the car isn't free, for error summaries and the ops desk. */
export function clashMessage(c: Busy, t: T, car?: string): string {
  const range = busyRange(c);
  if (c.kind === "booking") return t("availability.busyBooking", { car: car ?? "", range });
  return t("availability.busyBlock", { car: car ?? "", range, reason: t(`availability.reasons.${c.reason ?? "other"}`) });
}

/**
 * Shown where dates are chosen when the car is already out for part of the trip: what clashes,
 * and the next dates that fit the same rental length (one tap to use them).
 */
export function AvailabilityNotice({ clash, carName, start, end, chauffeur, nextFree, onPick }: {
  clash: Busy;
  carName: string;
  start?: string;
  end?: string;
  chauffeur: boolean;
  nextFree: (from: string, nights: number, service: "self-drive" | "chauffeur") => string | null;
  onPick: (range: { start: string; end?: string }) => void;
}) {
  const t = useT("booking");
  const nights = !chauffeur && start && end ? Math.max(1, daysBetween(start, end)) : 0;
  const from = start ?? clash.from;
  const next = nextFree(from, nights, chauffeur ? "chauffeur" : "self-drive");
  const nextEnd = next && !chauffeur ? addDays(next, nights) : undefined;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-bg/40 p-3 text-[13px] leading-snug text-champagne" role="status">
      <CalendarX2 className="mt-px h-4 w-4 flex-none text-warning" aria-hidden="true" />
      <div className="grid gap-1.5">
        <p>{clashMessage(clash, t, carName)}</p>
        {next ? (
          <button type="button" className="inline-flex min-h-11 w-fit items-center font-semibold text-fg underline decoration-accent/60 underline-offset-4" onClick={() => onPick({ start: next, end: nextEnd })}>
            {t("availability.useNext", { range: nextEnd ? `${formatDay(next)} – ${formatDay(nextEnd)}` : formatDay(next) })}
          </button>
        ) : (
          <p>{t("availability.none")}</p>
        )}
      </div>
    </div>
  );
}
