"use client";

import { useCallback, useSyncExternalStore } from "react";
import { addDays, todayInDubai } from "@/lib/dates";
import { listBookings, getBooking, subscribeBookings } from "./store";
import type { BookingRecord, TripDraft } from "./types";

// The visitor's trip: car, dates, handover, extras and driver details. One shared draft
// powers the dock, reserve cards and the /book steps, and survives reloads
// (localStorage, wrapped so the flow still works when storage is blocked).

const KEY = "lr.trip.v1";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000; // stale after 24 h: dates are re-defaulted

export function defaultDraft(withDates = true): TripDraft {
  const today = todayInDubai();
  return {
    carSlug: undefined,
    service: "self-drive",
    pickupDate: withDates ? addDays(today, 1) : undefined,
    pickupTime: "10:00",
    returnDate: withDates ? addDays(today, 4) : undefined,
    returnTime: "10:00",
    handover: "delivery",
    pickup: { zone: "dubai" },
    sameReturn: true,
    dropoff: { zone: "dubai" },
    chauffeur: { package: "half-day", hours: 5 },
    extras: { fullCover: false, additionalDrivers: 0, childSeats: 0 },
    driver: { channel: "whatsapp", resident: false, ageBand: "30+", ackTerms: false, whatsappConsent: true, marketing: false, licenceCountry: "AE" },
    updatedAt: 0,
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: TripDraft | null = null;
const SERVER_SNAPSHOT = defaultDraft(false);

function load(): TripDraft {
  if (cache) return cache;
  const fresh = defaultDraft(true);
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as TripDraft;
      const stale = Date.now() - (saved.updatedAt || 0) > DRAFT_TTL_MS || (saved.pickupDate && saved.pickupDate < todayInDubai());
      cache = stale ? { ...fresh, carSlug: saved.carSlug, driver: { ...fresh.driver, ...saved.driver } } : { ...fresh, ...saved };
      return cache;
    }
  } catch {
    /* blocked storage: fall through */
  }
  cache = fresh;
  return cache;
}

function save(next: TripDraft) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type DraftPatch = Partial<Omit<TripDraft, "extras" | "driver" | "chauffeur" | "pickup" | "dropoff">> & {
  extras?: Partial<TripDraft["extras"]>;
  driver?: Partial<TripDraft["driver"]>;
  chauffeur?: Partial<TripDraft["chauffeur"]>;
  pickup?: Partial<TripDraft["pickup"]>;
  dropoff?: Partial<TripDraft["dropoff"]>;
};

export function updateDraft(patch: DraftPatch) {
  const cur = load();
  save({
    ...cur,
    ...patch,
    extras: { ...cur.extras, ...patch.extras },
    driver: { ...cur.driver, ...patch.driver },
    chauffeur: { ...cur.chauffeur, ...patch.chauffeur },
    pickup: { ...cur.pickup, ...patch.pickup },
    dropoff: { ...cur.dropoff, ...patch.dropoff },
    updatedAt: Date.now(),
  });
}

export function resetDraft(keep: Partial<TripDraft> = {}) {
  save({ ...defaultDraft(true), ...keep, updatedAt: Date.now() });
}

/** `const [trip, update, hydrated] = useTripDraft()` */
export function useTripDraft() {
  const trip = useSyncExternalStore(subscribe, load, () => SERVER_SNAPSHOT);
  const hydrated = trip !== SERVER_SNAPSHOT;
  const update = useCallback((patch: DraftPatch) => updateDraft(patch), []);
  return [trip, update, hydrated] as const;
}

const EMPTY: BookingRecord[] = [];

/** Live list of demo bookings (updates across tabs). */
export function useBookings(): BookingRecord[] {
  return useSyncExternalStore(subscribeBookings, listBookings, () => EMPTY);
}

/** Live single booking by reference. */
export function useBooking(ref: string | null | undefined): BookingRecord | undefined {
  const list = useBookings();
  return ref ? list.find((b) => b.ref === ref.toUpperCase()) ?? (list === EMPTY ? undefined : getBooking(ref)) : undefined;
}
