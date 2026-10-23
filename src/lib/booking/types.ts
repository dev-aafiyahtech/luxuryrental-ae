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
  note?: string;
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
