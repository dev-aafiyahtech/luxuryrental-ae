// Marketing copy for cars and brands (the future CMS fields `description`, `highlights`,
// brand `description`). Written as simulated copy for the demo; facts must come from
// cars.ts. No manufacturer copy, no invented history, awards or customer numbers.

export interface CarCopy {
  /** ~50 words, used on cards and meta descriptions. */
  summary: string;
  /** ~150 words, car detail page body. */
  description: string;
  /** Three short reasons to rent it. */
  highlights: [string, string, string];
}

export interface BrandCopy {
  /** 60–90 words, brand page intro. */
  intro: string;
  faqs: { q: string; a: string }[];
}

/** Keyed by car slug. Pages fall back to the car's tagline when an entry is missing. */
export const carCopy: Record<string, CarCopy | undefined> = {};

/** Keyed by brand slug. */
export const brandCopy: Record<string, BrandCopy | undefined> = {};
