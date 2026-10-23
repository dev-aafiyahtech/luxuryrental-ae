"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { getCar } from "@/content/cars";
import type { Car } from "@/content/types";
import { useTripDraft } from "@/lib/booking/draft";
import type { Quote, ServiceMode } from "@/lib/pricing";
import { todayInDubai } from "@/lib/dates";
import { defaultServiceFor, earliestStart, isReplyOutOfHours, quoteFor, serviceFor } from "./lib";

const noop = () => () => {};

/** false on the server and during hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

// A minute-resolution clock shared by every booking widget: stable within a minute, so
// quotes are deterministic between renders, and 0 on the server (no clock during prerender).
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | undefined;
let clockValue = 0;
function readClock() {
  const t = Math.floor(Date.now() / 60_000) * 60_000;
  if (t !== clockValue) clockValue = t;
  return clockValue;
}
function subscribeClock(cb: () => void) {
  clockListeners.add(cb);
  if (!clockTimer) clockTimer = setInterval(() => clockListeners.forEach((l) => l()), 20_000);
  return () => {
    clockListeners.delete(cb);
    if (!clockListeners.size && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

/** Current time in ms (minute resolution), or 0 before hydration. */
export function useNow(): number {
  return useSyncExternalStore(subscribeClock, readClock, () => 0);
}

export interface DraftQuote {
  trip: ReturnType<typeof useTripDraft>[0];
  update: ReturnType<typeof useTripDraft>[1];
  hydrated: boolean;
  now: number;
  today: string;
  service: ServiceMode;
  quote: Quote | null;
  earliest: { date: string; time: string } | null;
  outOfHours: boolean;
}

/** The shared draft priced for a car, plus clock-derived values. Everything is null/empty until hydrated. */
export function useDraftQuote(car: Car | undefined): DraftQuote {
  const [trip, update, hydrated] = useTripDraft();
  const now = useNow();
  const ready = hydrated && now > 0;
  const service: ServiceMode = car ? serviceFor(car, trip) : trip.service;
  const q = useMemo(() => (car && ready ? quoteFor(car, trip, new Date(now)) : null), [car, trip, ready, now]);
  const earliest = useMemo(() => (car && ready ? earliestStart(car, service, new Date(now)) : null), [car, service, ready, now]);
  return {
    trip,
    update,
    hydrated: ready,
    now,
    today: ready ? todayInDubai(new Date(now)) : "",
    service,
    quote: q,
    earliest,
    outOfHours: ready ? isReplyOutOfHours(new Date(now)) : false,
  };
}

/**
 * Reads ?car= and ?service= on a /book step into the shared draft (once per URL change) and
 * returns the car the step is about: the URL's car, or the draft's car.
 */
export function useFlowCar(): { car: Car | undefined; carParam: string | null } {
  const params = useSearchParams();
  const carParam = params.get("car");
  const serviceParam = params.get("service");
  const [trip, update, hydrated] = useTripDraft();
  const tripRef = useRef(trip);
  useEffect(() => {
    tripRef.current = trip;
  });

  useEffect(() => {
    if (!hydrated || !carParam) return;
    const car = getCar(carParam);
    if (!car) return;
    const cur = tripRef.current;
    let service: ServiceMode;
    if (serviceParam === "chauffeur" && car.chauffeur) service = "chauffeur";
    else if (serviceParam === "self-drive") service = "self-drive";
    else if (cur.carSlug === car.slug) service = car.chauffeur ? cur.service : "self-drive";
    else service = defaultServiceFor(car);
    if (cur.carSlug !== car.slug || cur.service !== service) update({ carSlug: car.slug, service });
  }, [hydrated, carParam, serviceParam, update]);

  const car = (carParam ? getCar(carParam) : undefined) ?? (hydrated && trip.carSlug ? getCar(trip.carSlug) : undefined);
  return { car, carParam };
}

/**
 * Publishes a fixed bottom bar's height as `--dock-h` on <html> while it is shown, so
 * scroll-padding and the footer keep focused content clear of it (WCAG 2.4.11).
 * A bar hidden with display:none (e.g. `lg:hidden`) counts as 0. Cleaned up on unmount.
 */
export function useDockHeight(ref: RefObject<HTMLElement | null>, active = true) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const root = document.documentElement;
    let last = "";
    const set = () => {
      const shown = el.getClientRects().length > 0;
      const value = `${shown ? Math.ceil(el.getBoundingClientRect().height) : 0}px`;
      if (value !== last) root.style.setProperty("--dock-h", (last = value));
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    window.addEventListener("resize", set);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", set);
      root.style.removeProperty("--dock-h");
    };
  }, [ref, active]);
}
