import type { Offer, Season, Tier } from "./types";

// Booking rules (workstream 05) and pricing rules (workstream 04 §11). All values are
// assumed for the demo and listed in docs/brief/assumptions.md for the client to confirm.
// One config drives validation, quotes, FAQ answers and the legal summaries.

export const rules = {
  timezone: "Asia/Dubai",
  graceMinutes: 60, // late return grace
  maxOnlineDays: 30, // longer rentals go to WhatsApp
  maxAdvanceDays: 365,
  handoverHours: { from: "08:00", to: "22:00" },
  outOfHoursFee: 300, // per handover outside 08:00–22:00
  airportWaitFreeMinutes: 60,
  additionalDriverPerDay: 100,
  childSeatPerDay: 0, // free on request
  refuelFee: 100,
  tollAdminFee: 1, // Salik / Darb, per crossing on top of the tariff
  /** Toll tariffs passed on at cost (published tariffs, Oct 2026). */
  tolls: {
    salikPeak: 6, // Dubai Salik, Mon–Sat 06:00–10:00 and 16:00–20:00
    salikOffPeak: 4, // other times and all day Sunday
    salikFreeHours: "01:00–06:00",
    darbPeak: 4, // Abu Dhabi Darb, Mon–Sat 07:00–09:00 and 15:00–19:00; free at other times
  },
  airportWaitPerHour: 150, // BR-15: after the free 60 minutes, per started hour
  lateReturnHourPct: 25, // BR-02: per started hour after the grace period, up to one extra day
  slotToleranceMinutes: 30, // BR-17
  handoverMinutes: "20 to 30", // BR-17
  bankReleaseWorkingDays: "5 to 14", // BR-55: deposit hold release by the card issuer
  lossOfUsePct: 50, // BR-61: of the daily rate while a damaged car is off the road
  lossOfUseMaxDays: 10, // BR-61
  advanceMaxPct: 25, // 05 §2: advance taken by payment link after confirmation
  refundWorkingDays: 7, // 05 §2
  freeDateChangeHours: 48, // 05 §2
  flightChangeMonths: 6, // 05 §2
  complaintReplyWorkingDays: 5, // C-14
  rightsReplyDays: 30, // C-04
  fineAdminFee: 100,
  cleaningFee: 1000,
  tiers: {
    L: { name: "Luxury", minAge: 25, licenceYears: 2, leadHours: 4, excess: 5000, fullCoverPerDay: 150, fullCoverExcess: 0, releaseDays: 21 },
    S: { name: "Supercar", minAge: 25, licenceYears: 3, leadHours: 4, excess: 10000, fullCoverPerDay: 350, fullCoverExcess: 0, releaseDays: 21 },
    H: { name: "Hypercar", minAge: 30, licenceYears: 5, leadHours: 72, excess: 50000, fullCoverPerDay: 1500, fullCoverExcess: 15000, releaseDays: 30 },
  } satisfies Record<Tier, unknown>,
  chauffeur: {
    minHours: 3,
    leadHours: 12,
    halfDayHours: 5,
    fullDayHours: 10,
    nightSurchargePct: 20, // 00:00–06:00 starts
    superPeakSurchargePct: 20,
    maxHours: 12,
    maxPassengers: 4, // BR-75, or fewer if the car has fewer seats
    overtimeStepMinutes: 30, // extra time is billed per started 30 minutes, at half the car's extra-hour rate
    included: "Chauffeur, fuel, Salik and Darb tolls, bottled water and Wi-Fi. 60 minutes' free waiting at airports.",
  },
  /** Rental-length ladder: share of the (seasonal) daily rate per day. 30+ days uses the fixed monthly rate. */
  ladder: [
    { fromDays: 1, pct: 100 },
    { fromDays: 3, pct: 93 },
    { fromDays: 7, pct: (6 / 7) * 100 }, // 7 days for the price of 6
  ],
  weekdayDiscountPct: 10, // Mon–Thu pickup and return, standard and summer seasons only
} as const;

export const seasons: Record<Season["id"], Season> = {
  summer: { id: "summer", name: "Summer", multiplier: 0.8 },
  standard: { id: "standard", name: "Standard", multiplier: 1 },
  peak: { id: "peak", name: "Peak season", multiplier: 1.15 },
  "super-peak": { id: "super-peak", name: "Festive peak", multiplier: 1.3 },
};

/** Season for a pickup date (YYYY-MM-DD, Dubai time). */
export function seasonFor(isoDate: string): Season {
  const [, m, d] = isoDate.split("-").map(Number);
  const md = m * 100 + d;
  if (md >= 1220 || md <= 105) return seasons["super-peak"]; // 20 Dec – 5 Jan
  if (m >= 11 || m <= 3) return seasons.peak; // 1 Nov – 31 Mar
  if (m >= 6 && m <= 8) return seasons.summer; // 1 Jun – 31 Aug
  return seasons.standard;
}

export const offers: Offer[] = [
  { id: "founding-client", name: "Founding Client", summary: "Free delivery and collection anywhere in Dubai, plus 50 km a day extra.", validUntil: "2026-12-31" },
  { id: "first-long-rental", name: "First Long Rental", summary: "10% off a first booking of 3 days or more (not flagship cars, Bugatti or festive peak).", validUntil: "2027-01-31" },
  { id: "chauffeur-intro", name: "Chauffeur Intro", summary: "One free hour on a first 5- or 10-hour chauffeur booking.", validUntil: "2026-12-31" },
];

export const cancellation = {
  summary: "Requests are free to cancel before we confirm. After confirmation, any advance is refunded in full up to 72 hours before the start (7 days for hypercars, 24 hours for chauffeur bookings).",
};
