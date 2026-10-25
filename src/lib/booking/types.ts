import type { ChauffeurPackage, Quote, ServiceMode } from "@/lib/pricing";

// Booking request lifecycle (plan D-08, workstream 01 §1.4). In the demo the "server"
// is the browser's localStorage (lib/booking/store.ts); the shapes match the planned API.

export type BookingStatus = "requested" | "confirmed" | "declined" | "awaiting_payment" | "paid" | "cancelled" | "expired";

export interface Handover {
  zone: string; // DeliveryZone slug
  address?: string; // street, hotel or villa
  flight?: string; // airports only
}

export interface DriverDetails {
  name: string;
  phone: string; // E.164, e.g. "+971501234567"
  email?: string;
  licenceCountry: string; // ISO 3166 alpha-2
  resident: boolean; // UAE resident
  ageBand: "under-25" | "25-29" | "30+";
  channel: "whatsapp" | "phone" | "email";
  ackTerms: boolean; // read the privacy notice and rental requirements
  whatsappConsent: boolean; // ok to message about this request
  marketing: boolean; // optional, unticked by default
  notes?: string;
}

export interface TripDraft {
  carSlug?: string;
  service: ServiceMode;
  pickupDate?: string; // YYYY-MM-DD, Dubai
  pickupTime: string; // HH:MM
  returnDate?: string;
  returnTime: string;
  handover: "delivery" | "collect";
  pickup: Handover;
  sameReturn: boolean;
  dropoff: Handover;
  chauffeur: { package: ChauffeurPackage; hours: number };
  extras: { fullCover: boolean; additionalDrivers: number; childSeats: number };
  driver: Partial<DriverDetails>;
  updatedAt: number;
}

export interface BookingEvent {
  at: string; // ISO timestamp
  status: BookingStatus;
  by: "customer" | "ops" | "system";
  /** Stored as written (English for system events); shown through `code` when there is one. */
  note?: string;
  /** What happened, as a message id the UI shows in the viewer's language (e.g. "requestSent", "ops.confirmed"). */
  code?: string;
  /** Values for the coded message (agreement number, km, fuel, marks, stage). */
  vars?: Record<string, string | number>;
}

/** Rental agreement issued once a request is confirmed, e-signed by the main driver. */
export interface AgreementRecord {
  number: string; // "RA-7K3QZM"
  version: string; // terms version the customer accepted
  issuedAt: string;
  signedAt?: string;
  signerName?: string;
  /** Small PNG data URL of the drawn signature (demo: stays in this browser). */
  signature?: string;
  accepted?: { terms: boolean; deposit: boolean; damage: boolean };
}

/** One damage mark on the car outline: x/y are 0–1 across the top-down diagram. */
export interface DamageMark {
  id: string;
  x: number;
  y: number;
  kind: "scratch" | "dent" | "chip" | "scuff" | "other";
  note?: string;
}

/** Condition report recorded by ops at handover (or return) and acknowledged by the customer. */
export interface ConditionReport {
  stage: "handover" | "return";
  recordedAt: string;
  recordedBy: string; // staff name
  odometerKm: number;
  fuelEighths: number; // 0–8
  damages: DamageMark[];
  photos: number; // photos taken (demo: count only)
  notes?: string;
  customerSignedAt?: string;
  customerName?: string;
  customerSignature?: string;
}

export interface BookingRecord {
  ref: string; // "LR-7K3QZM"
  status: BookingStatus;
  createdAt: string;
  carSlug: string;
  carName: string;
  trip: TripDraft;
  quote: Quote;
  events: BookingEvent[];
  payment?: { amount: number; kind: "advance" | "balance" | "full"; reference: string; paidAt: string; method: "demo-card" | "handover" };
  agreement?: AgreementRecord;
  handoverCheck?: ConditionReport;
  returnCheck?: ConditionReport;
}

/** Allowed transitions; anything else is rejected by the store. */
export const transitions: Record<BookingStatus, BookingStatus[]> = {
  requested: ["confirmed", "declined", "cancelled", "expired"],
  confirmed: ["awaiting_payment", "paid", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid: ["cancelled"],
  declined: [],
  cancelled: [],
  expired: [],
};
