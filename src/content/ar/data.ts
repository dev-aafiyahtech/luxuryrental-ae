import type { CategorySlug, Season, Tier } from "../types";

// Arabic text for the data modules (cars, categories, zones, offers, seasons, tiers, rules, site).
// Brand and model names stay in Latin script, as on the cars themselves. Read through
// src/content/localize.ts; any entry left out falls back to English.

export interface CarTextAr {
  tagline: string;
  /** specs.body, e.g. "كوبيه، أبواب مقصية" */
  body: string;
  /** specs.engine, e.g. "محرك V12 سعة 6.5 لتر هجين قابل للشحن" */
  engine: string;
  interior: string;
  wheels: string;
  equipment: string[];
  /** Paint names usually stay as the maker writes them; set only to add an Arabic gloss. */
  paint?: string;
}

export const carsAr: Partial<Record<string, CarTextAr>> = {};

export const categoriesAr: Partial<Record<CategorySlug, { name: string; singular: string; description: string }>> = {};

export const brandCountriesAr: Partial<Record<string, string>> = {};

export const zonesAr: Partial<Record<string, { name: string; areas: string[]; note?: string }>> = {};

export const offersAr: Partial<Record<string, { name: string; summary: string }>> = {};

export const seasonsAr: Partial<Record<Season["id"], string>> = {};

export const tiersAr: Partial<Record<Tier, string>> = {};

export const rulesAr: { chauffeurIncluded?: string; cancellationSummary?: string } = {};

export const siteAr: {
  hours?: string;
  replyPromise?: string;
  address?: { line1?: string; area?: string; city?: string; country?: string; directions?: string };
  consumerProtectionName?: string;
} = {};
