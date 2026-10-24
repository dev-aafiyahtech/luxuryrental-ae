import { rules } from "@/content/rules";

// Cancellation and refund policy (workstream 05 §2). The one source for refund windows:
// the FAQ, the requirements page and the legal pages all read from here.
// The chauffeur advance follows the 3-hour minimum set in plan D-20 (rules.chauffeur.minHours).

export interface RefundWindow {
  /** Column: who the window applies to. */
  id: "standard" | "hypercar" | "chauffeur";
  label: string;
  full: string; // 100% refund of the advance
  half: string; // 50% refund
  none: string; // no refund
  /** Hours before the start for a full refund (used in sentences). */
  fullHours: number;
}

export const refundWindows: RefundWindow[] = [
  { id: "standard", label: "Luxury and Supercar", full: "72 hours or more before", half: "24 to 72 hours before", none: "Under 24 hours, or no-show", fullHours: 72 },
  { id: "hypercar", label: "Hypercar", full: "7 days or more before", half: "72 hours to 7 days before", none: "Under 72 hours, or no-show", fullHours: 168 },
  { id: "chauffeur", label: "Chauffeur", full: "24 hours or more before", half: "6 to 24 hours before", none: "Under 6 hours, or no-show", fullHours: 24 },
];

export const advanceRule = `To confirm a booking we may ask for an advance of up to ${rules.advanceMaxPct}% of the rental total (at least one day's rental, or the ${rules.chauffeur.minHours}-hour minimum for chauffeur bookings).`;
