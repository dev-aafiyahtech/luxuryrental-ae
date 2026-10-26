"use client";

import type { Quote } from "@/lib/pricing";
import { transitions, type AgreementRecord, type BookingRecord, type BookingStatus, type ConditionReport, type TripDraft } from "./types";

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
      { at: now, status: "requested", by: "customer", note: "Request sent from the website", code: "requestSent" },
      { at: now, status: "requested", by: "system", note: "Ops emailed (simulated)", code: "opsEmailed" },
    ],
  };
  write([record, ...read()]);
  return record;
}

/**
 * Ops actions (email links / ops console) and customer cancellation. `code` (optional) names the
 * note as a message id, so the history shows it in each viewer's language.
 */
export async function updateBookingStatus(ref: string, status: BookingStatus, by: "customer" | "ops" | "system", note?: string, code?: string): Promise<BookingRecord> {
  await wait(400);
  const list = read();
  const current = list.find((b) => b.ref === ref);
  if (!current) throw new Error(`Booking ${ref} not found`);
  if (!transitions[current.status].includes(status)) throw new Error(`Can't change ${current.status} to ${status}`);
  const updated: BookingRecord = { ...current, status, events: [...current.events, { at: new Date().toISOString(), status, by, note, ...(code ? { code } : {}) }] };
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
    payment: { amount, kind, reference: `PAY-${current.ref.slice(3)}`, paidAt, method: "demo-card" },
    events: [...current.events, { at: paidAt, status: "paid", by: "system", note: "Demo payment, nothing charged", code: "demoPayment" }],
  };
  write(list.map((b) => (b.ref === ref ? updated : b)));
  return updated;
}

/* ---------- rental agreement and condition reports (simulated e-signature) ---------- */

export const AGREEMENT_VERSION = "1.0";
/** Statuses in which the agreement exists and can be signed. */
export const agreementOpen = (s: BookingStatus) => s === "confirmed" || s === "awaiting_payment" || s === "paid";

function patch(ref: string, fn: (b: BookingRecord) => BookingRecord): BookingRecord {
  const list = read();
  const current = list.find((b) => b.ref === ref.toUpperCase());
  if (!current) throw new Error(`Booking ${ref} not found`);
  const updated = fn(current);
  write(list.map((b) => (b.ref === current.ref ? updated : b)));
  return updated;
}

const note = (b: BookingRecord, by: "customer" | "ops" | "system", text: string, code?: string, vars?: Record<string, string | number>) => [
  ...b.events,
  { at: new Date().toISOString(), status: b.status, by, note: text, ...(code ? { code } : {}), ...(vars ? { vars } : {}) },
];

/** The agreement for a booking: the stored one, or a fresh unsigned one once the request is confirmed. */
export function agreementFor(b: BookingRecord): AgreementRecord | undefined {
  if (b.agreement) return b.agreement;
  if (!agreementOpen(b.status)) return undefined;
  const confirmed = [...b.events].reverse().find((e) => e.status === "confirmed")?.at ?? b.createdAt;
  return { number: `RA-${b.ref.slice(3)}`, version: AGREEMENT_VERSION, issuedAt: confirmed };
}

/** POST /api/bookings/{ref}/agreement/sign: e-sign the rental agreement as the main driver. */
export async function signAgreement(ref: string, input: { name: string; signature: string; accepted: NonNullable<AgreementRecord["accepted"]> }): Promise<BookingRecord> {
  await wait(900);
  return patch(ref, (b) => {
    const base = agreementFor(b);
    if (!base) throw new Error("The agreement opens once we confirm your request");
    if (base.signedAt) throw new Error("This agreement is already signed");
    const signedAt = new Date().toISOString();
    return { ...b, agreement: { ...base, signedAt, signerName: input.name.trim(), signature: input.signature, accepted: input.accepted }, events: note(b, "customer", `Rental agreement ${base.number} e-signed`, "agreementSigned", { number: base.number }) };
  });
}

/** Ops: record the condition report at handover or return (car checked with the customer). */
export async function recordConditionReport(ref: string, report: Omit<ConditionReport, "recordedAt" | "customerSignedAt" | "customerName" | "customerSignature">): Promise<BookingRecord> {
  await wait(600);
  return patch(ref, (b) => {
    const full: ConditionReport = { ...report, recordedAt: new Date().toISOString() };
    const key = report.stage === "handover" ? "handoverCheck" : "returnCheck";
    const vars = { km: report.odometerKm, fuel: report.fuelEighths, marks: report.damages.length };
    return { ...b, [key]: full, events: note(b, "ops", `${report.stage === "handover" ? "Handover" : "Return"} check recorded: ${report.odometerKm.toLocaleString("en")} km, fuel ${report.fuelEighths}/8, ${report.damages.length} damage mark(s)`, `${report.stage}CheckRecorded`, vars) };
  });
}

/** Customer: acknowledge a condition report with a typed name and signature. */
export async function signConditionReport(ref: string, stage: ConditionReport["stage"], input: { name: string; signature: string }): Promise<BookingRecord> {
  await wait(700);
  return patch(ref, (b) => {
    const key = stage === "handover" ? "handoverCheck" : "returnCheck";
    const report = b[key];
    if (!report) throw new Error("No condition report to sign yet");
    const signedAt = new Date().toISOString();
    return { ...b, [key]: { ...report, customerSignedAt: signedAt, customerName: input.name.trim(), customerSignature: input.signature }, events: note(b, "customer", `${stage === "handover" ? "Handover" : "Return"} condition report signed`, `${stage}CheckSigned`) };
  });
}

/** Clears every demo booking in this browser. */
export function resetDemoBookings() {
  write([]);
}
