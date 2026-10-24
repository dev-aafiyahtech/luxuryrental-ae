"use client";

import { useMemo, useSyncExternalStore } from "react";
import { addDays, todayInDubai } from "@/lib/dates";
import { listBookings, subscribeBookings } from "./store";
import type { BookingRecord, BookingStatus } from "./types";

// SIMULATED availability. A car is busy on the days covered by its confirmed (or paid)
// bookings and by ops blocks (maintenance, owner use, events). Requests don't hold a car until
// ops confirm them, so two people can request the same dates, but ops can't confirm both.
// Blocks live in this browser's localStorage, like the rest of the simulated backend.

export type BlockReason = "maintenance" | "owner" | "event" | "other";

export interface CarBlock {
  id: string;
  carSlug: string;
  from: string; // YYYY-MM-DD, inclusive
  to: string; // inclusive
  reason: BlockReason;
  note?: string;
  createdAt: string;
}

/** A busy stretch for one car (days inclusive). */
export interface Busy {
  from: string;
  to: string;
  kind: "booking" | "block";
  ref?: string;
  reason?: BlockReason;
  note?: string;
}

/** Statuses in which a booking holds the car. */
export const HOLDING: readonly BookingStatus[] = ["confirmed", "awaiting_payment", "paid"];

const KEY = "lr.blocks.v1";
type Listener = () => void;
const listeners = new Set<Listener>();
let cache: CarBlock[] | null = null;

const uid = () => {
  const b = new Uint8Array(5);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

/** Demo seed, relative to today so it is always in the future: a service slot and an event day. */
function seed(): CarBlock[] {
  const today = todayInDubai();
  const at = new Date().toISOString();
  return [
    { id: uid(), carSlug: "lamborghini-revuelto", from: addDays(today, 9), to: addDays(today, 10), reason: "maintenance", note: "Scheduled service", createdAt: at },
    { id: uid(), carSlug: "rolls-royce-phantom", from: addDays(today, 4), to: addDays(today, 4), reason: "event", note: "Wedding booked by phone", createdAt: at },
  ];
}

function read(): CarBlock[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      cache = seed();
      localStorage.setItem(KEY, JSON.stringify(cache));
    } else cache = JSON.parse(raw) as CarBlock[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: CarBlock[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* keep the in-memory copy */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export function subscribeBlocks(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const listBlocks = (): CarBlock[] => read();

/** Ops: block a car for maintenance, owner use or an event. */
export function addBlock(input: Omit<CarBlock, "id" | "createdAt">): CarBlock {
  const block: CarBlock = { ...input, to: input.to < input.from ? input.from : input.to, id: uid(), createdAt: new Date().toISOString() };
  write([...read(), block].sort((a, b) => a.from.localeCompare(b.from)));
  return block;
}

export function removeBlock(id: string) {
  write(read().filter((b) => b.id !== id));
}

/** Clears every block (the next read re-seeds the demo blocks). */
export function resetDemoBlocks() {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/* ---------- busy days ---------- */

/** Days a booking occupies: pickup to the day before return (the return day is free for a later pickup). Chauffeur jobs occupy their day. */
export function bookingSpan(b: Pick<BookingRecord, "trip">): { from: string; to: string } | null {
  const { pickupDate, returnDate, service } = b.trip;
  if (!pickupDate) return null;
  if (service === "chauffeur" || !returnDate || returnDate <= pickupDate) return { from: pickupDate, to: pickupDate };
  return { from: pickupDate, to: addDays(returnDate, -1) };
}

/** The days a requested trip would need, in the same terms. */
export function tripSpan(start?: string, end?: string, service: "self-drive" | "chauffeur" = "self-drive") {
  return start ? bookingSpan({ trip: { pickupDate: start, returnDate: end, service } as BookingRecord["trip"] }) : null;
}

export function busyRanges(carSlug: string, bookings: BookingRecord[], blocks: CarBlock[], ignoreRef?: string): Busy[] {
  const out: Busy[] = [];
  for (const b of bookings) {
    if (b.carSlug !== carSlug || b.ref === ignoreRef || !HOLDING.includes(b.status)) continue;
    const span = bookingSpan(b);
    if (span) out.push({ ...span, kind: "booking", ref: b.ref });
  }
  for (const k of blocks) if (k.carSlug === carSlug) out.push({ from: k.from, to: k.to, kind: "block", reason: k.reason, note: k.note });
  return out.sort((a, b) => a.from.localeCompare(b.from));
}

const overlaps = (a: { from: string; to: string }, b: { from: string; to: string }) => a.from <= b.to && b.from <= a.to;

/** The first busy stretch that a trip would run into, or null when the car is free. */
export function clashIn(ranges: Busy[], start?: string, end?: string, service?: "self-drive" | "chauffeur"): Busy | null {
  const span = tripSpan(start, end, service);
  return span ? ranges.find((r) => overlaps(r, span)) ?? null : null;
}

/** First pickup day from `from` on which a trip of `nights` nights (0 for chauffeur) fits, within a year. */
export function nextFreeStart(ranges: Busy[], from: string, nights: number, service: "self-drive" | "chauffeur"): string | null {
  let day = from;
  for (let i = 0; i < 366; i++, day = addDays(day, 1)) {
    if (!clashIn(ranges, day, addDays(day, Math.max(nights, 0)), service)) return day;
  }
  return null;
}

/* ---------- hooks ---------- */

const EMPTY_BOOKINGS: BookingRecord[] = [];
const EMPTY_BLOCKS: CarBlock[] = [];

export function useBlocks(): CarBlock[] {
  return useSyncExternalStore(subscribeBlocks, read, () => EMPTY_BLOCKS);
}

/** Live availability for one car: busy ranges, a day test for calendars, and the clash check. */
export function useAvailability(carSlug?: string, ignoreRef?: string) {
  const bookings = useSyncExternalStore(subscribeBookings, listBookings, () => EMPTY_BOOKINGS);
  const blocks = useBlocks();
  return useMemo(() => {
    const ranges = carSlug ? busyRanges(carSlug, bookings, blocks, ignoreRef) : [];
    const busy = (day: string) => ranges.some((r) => day >= r.from && day <= r.to);
    return {
      ranges,
      busy,
      clash: (start?: string, end?: string, service?: "self-drive" | "chauffeur") => clashIn(ranges, start, end, service),
      nextFree: (from: string, nights: number, service: "self-drive" | "chauffeur") => nextFreeStart(ranges, from, nights, service),
    };
  }, [carSlug, bookings, blocks, ignoreRef]);
}
