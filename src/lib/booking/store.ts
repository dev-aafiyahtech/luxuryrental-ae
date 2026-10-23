"use client";

import type { Quote } from "@/lib/pricing";
import { transitions, type BookingRecord, type BookingStatus, type TripDraft } from "./types";

// SIMULATED BACKEND. Booking requests are kept in this browser's localStorage so the whole
// flow (request → ops confirm → pay → status) can be demonstrated without a server.
// The async functions mirror the planned API (POST /api/bookings, ops action links,
// payment webhook) so the UI won't change when the real backend replaces this file.

const KEY = "lr.bookings.v1";
const LATENCY_MS = 700;
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: BookingRecord[] | null = null;

function read(): BookingRecord[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as BookingRecord[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(list: BookingRecord[]) {
  cache = list;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked: keep the in-memory copy for this session */
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

const wait = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

function newRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "LR-" + Array.from(bytes, (b) => CROCKFORD[b % 32]).join("");
}

/** Subscribe to booking changes (this tab and other tabs). Returns an unsubscribe function. */
export function subscribeBookings(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const listBookings = (): BookingRecord[] => read();
export const getBooking = (ref: string): BookingRecord | undefined => read().find((b) => b.ref === ref.toUpperCase());

/** POST /api/bookings: store the request and "email ops". Set `fail` to simulate a network error. */
export async function submitBookingRequest(trip: TripDraft, quote: Quote, carName: string, opts: { fail?: boolean } = {}): Promise<BookingRecord> {
  await wait();
  if (opts.fail) throw new Error("Simulated network error");
  if (!trip.carSlug) throw new Error("No car selected");
  const now = new Date().toISOString();
  const record: BookingRecord = {
    ref: newRef(),
    status: "requested",
    createdAt: now,
    carSlug: trip.carSlug,
    carName,
    trip: structuredClone(trip),
    quote: structuredClone(quote),
    events: [
      { at: now, status: "requested", by: "customer", note: "Request sent from the website" },
      { at: now, status: "requested", by: "system", note: "Ops emailed (simulated)" },
    ],
  };
  write([record, ...read()]);
  return record;
}

/** Ops actions (email links / ops console) and customer cancellation. */
export async function updateBookingStatus(ref: string, status: BookingStatus, by: "customer" | "ops" | "system", note?: string): Promise<BookingRecord> {
  await wait(400);
  const list = read();
  const current = list.find((b) => b.ref === ref);
  if (!current) throw new Error(`Booking ${ref} not found`);
  if (!transitions[current.status].includes(status)) throw new Error(`Can't change ${current.status} to ${status}`);
  const updated: BookingRecord = { ...current, status, events: [...current.events, { at: new Date().toISOString(), status, by, note }] };
  write(list.map((b) => (b.ref === ref ? updated : b)));
  return updated;
}

/** Mock payment provider: "pays" and moves the booking to paid. No card data is collected. */
export async function recordDemoPayment(ref: string, amount: number, kind: "advance" | "balance" | "full"): Promise<BookingRecord> {
  await wait(1200);
  const list = read();
  const current = list.find((b) => b.ref === ref);
  if (!current) throw new Error(`Booking ${ref} not found`);
  if (!["confirmed", "awaiting_payment"].includes(current.status)) throw new Error("This booking isn't waiting for payment");
  const paidAt = new Date().toISOString();
  const updated: BookingRecord = {
    ...current,
    status: "paid",
    payment: { amount, kind, reference: `DEMO-${current.ref.slice(3)}`, paidAt, method: "demo-card" },
    events: [...current.events, { at: paidAt, status: "paid", by: "system", note: "Demo payment, nothing charged" }],
  };
  write(list.map((b) => (b.ref === ref ? updated : b)));
  return updated;
}

/** Clears every demo booking in this browser. */
export function resetDemoBookings() {
  write([]);
}
