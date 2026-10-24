// Content model for the demo. These shapes mirror the planned Sanity types
// (docs/plan/workstreams/01-architecture.md §1.3), so the data source can be swapped
// for the CMS later without touching pages.

/** Booking-rules tier (workstream 05): Luxury, Supercar, Hypercar. */
export type Tier = "L" | "S" | "H";
/** Pricing tier (workstream 04): flagship, core, entry, hypercar. */
export type PriceTier = "A" | "B" | "C" | "H";

export type CategorySlug = "hypercars" | "supercars" | "convertibles" | "grand-tourers" | "suvs";
/** Shape used for the light-sculpture placeholder art and the homepage sculpture. */
export type BodyStyle = "supercar" | "spider" | "hypercar" | "suv" | "gt" | "cabriolet" | "limousine";
export type CarPart = "body" | "cabin" | "wheels" | "powertrain" | "lights";

export interface Brand {
  slug: string;
  name: string;
  country: string;
  order: number;
}

export interface Category {
  slug: CategorySlug;
  name: string; // "Supercars"
  singular: string; // "Supercar"
  description: string;
  order: number;
}

export interface CarSpecs {
  engine: string; // "6.5 L V12 plug-in hybrid"
  engineLayout: "V6" | "V8" | "V12" | "W16";
  hybrid: boolean;
  hp: number;
  ps: number;
  zeroTo100: number; // seconds
  topSpeedKmh: number;
  topSpeedNote?: string; // "limited", "over"
  seats: string; // "2", "4–5", "2+2"
  body: string; // "Coupé, scissor doors"
  drivetrain: "AWD" | "RWD";
}

export interface CarRates {
  /** Standard-season daily rate, AED incl. VAT. Seasons adjust it (see rules.ts). */
  daily: number;
  /** Approved peak-season daily rate (1 Nov – 31 Mar), AED incl. VAT. */
  peakDaily: number;
  /** 7-day total, AED incl. VAT. Null when only offered on request. */
  weekly: number | null;
  /** 30-day total, AED incl. VAT, fixed all year. Null when not offered. */
  monthly: number | null;
  deposit: number;
  kmPerDay: number;
  /** Allowance for a 30-day rental (default 4,500 km). */
  kmPerMonth?: number;
  extraKm: number;
  /** Bugatti: shown as "from", final price confirmed by the concierge. */
  onRequest?: boolean;
}

export interface ChauffeurRates {
  hourly: number; // 3-hour minimum
  halfDay: number; // 5 h
  fullDay: number; // 10 h
  airport: number; // DXB/DWC one way
  overtime: number; // per hour
}

/** The specific car in the fleet: trim and equipment shown on the car page. */
export interface CarDetails {
  interior: string;
  wheels: string;
  /** Three or four notable items. */
  equipment: string[];
}

export type ImageStatus = "placeholder" | "ai-illustrative" | "ai-verified" | "photo";

export interface CarImages {
  status: ImageStatus;
  /** Public paths. Missing slots fall back to the light-sculpture art. */
  hero?: string; // front 3/4, 16:9
  side?: string; // side profile
  card?: string; // 4:3 card crop
  cockpit?: string;
  gallery?: { src: string; alt: string }[];
}

export interface Car {
  slug: string; // "lamborghini-revuelto": unique id
  brand: string; // brand slug
  model: string; // "Revuelto"
  modelSlug: string; // URL: /cars/{brand}/{modelSlug}
  name: string; // "Lamborghini Revuelto"
  year: string; // model year
  category: CategorySlug | "chauffeur"; // primary; "chauffeur" = listed under /chauffeur, not a type page
  tags: CategorySlug[]; // extra filters
  tier: Tier;
  priceTier: PriceTier;
  body: BodyStyle;
  paint: { name: string; hex: string }; // exterior colour of the fleet car (assumed in the demo)
  details: CarDetails;
  heroRank?: 1 | 2 | 3 | 4 | 5;
  heroScene?: "skyline" | "sculpture";
  tagline: string;
  specs: CarSpecs;
  rates: CarRates;
  chauffeur?: ChauffeurRates;
  /** Phantom: chauffeur-first; self-drive only with approval. */
  chauffeurFirst?: boolean;
  minDays: number;
  minAge: number;
  licenceYears: number;
  leadHours: number;
  images: CarImages;
  addedAt: string; // ISO date
}

export type ZoneKind = "branch" | "zone" | "airport";

export interface DeliveryZone {
  slug: string;
  name: string;
  kind: ZoneKind;
  areas: string[];
  /** Fee per handover (each way), AED incl. VAT. Null = quoted on request. */
  fee: number | null;
  /** Free when the rental is at least this many days. */
  freeFromDays?: number;
  note?: string;
  /** Extra charge on chauffeur bookings that start here. */
  chauffeurSurcharge?: number;
}

export interface Offer {
  id: string;
  name: string;
  summary: string;
  validUntil: string; // ISO date, inclusive
}

export interface Season {
  id: "summer" | "standard" | "peak" | "super-peak";
  name: string;
  multiplier: number;
}
