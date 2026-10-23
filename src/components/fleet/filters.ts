import type { Car, CategorySlug } from "@/content/types";
import { cars } from "@/content/cars";
import { categories } from "@/content/brands";
import { fromPrice } from "@/lib/pricing";

// Fleet filters live in the URL (`/cars?category=suvs&price=2500-5000&chauffeur=1&sort=price-asc`)
// and are applied in the browser. Everything here is pure so the server fallback and the
// client view agree.

export type PriceBucket = "under-2500" | "2500-5000" | "5000-plus" | "on-request";
export type SortKey = "featured" | "price-asc" | "price-desc" | "power";

export const CATEGORY_SLUGS = categories.map((c) => c.slug) as CategorySlug[];
export const PRICE_BUCKETS: PriceBucket[] = ["under-2500", "2500-5000", "5000-plus", "on-request"];
export const SORT_KEYS: SortKey[] = ["featured", "price-asc", "price-desc", "power"];

export interface FleetFilters {
  category?: CategorySlug;
  price?: PriceBucket;
  chauffeur: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: FleetFilters = { chauffeur: false, sort: "featured" };

/** The facts a filter needs about each car (plain data, safe to compute on either side). */
export interface CarMeta {
  slug: string;
  name: string;
  categories: string[];
  price: number;
  onRequest: boolean;
  hp: number;
  chauffeur: boolean;
  order: number;
}

export function carMeta(today: string, list: Car[] = cars): CarMeta[] {
  return list.map((c, i) => ({
    slug: c.slug,
    name: c.name,
    categories: [c.category, ...c.tags],
    price: fromPrice(c, today),
    onRequest: !!c.rates.onRequest,
    hp: c.specs.hp,
    chauffeur: !!c.chauffeur,
    order: i,
  }));
}

export function parseFilters(get: (key: string) => string | null): FleetFilters {
  const category = get("category");
  const price = get("price");
  const sort = get("sort");
  const chauffeur = get("chauffeur");
  return {
    category: CATEGORY_SLUGS.includes(category as CategorySlug) ? (category as CategorySlug) : undefined,
    price: PRICE_BUCKETS.includes(price as PriceBucket) ? (price as PriceBucket) : undefined,
    chauffeur: chauffeur === "1" || chauffeur === "true",
    sort: SORT_KEYS.includes(sort as SortKey) ? (sort as SortKey) : "featured",
  };
}

/** Query string for a filter state, without defaults ("" when nothing is set). */
export function toQuery(f: FleetFilters): string {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.price) p.set("price", f.price);
  if (f.chauffeur) p.set("chauffeur", "1");
  if (f.sort !== "featured") p.set("sort", f.sort);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const activeFilterCount = (f: FleetFilters) => (f.category ? 1 : 0) + (f.price ? 1 : 0) + (f.chauffeur ? 1 : 0);

const RANGES: Record<Exclude<PriceBucket, "on-request">, [number, number]> = {
  "under-2500": [0, 2499],
  "2500-5000": [2500, 5000],
  "5000-plus": [5001, Number.POSITIVE_INFINITY],
};

export function inBucket(car: Pick<CarMeta, "price" | "onRequest">, bucket: PriceBucket): boolean {
  if (bucket === "on-request") return car.onRequest;
  if (car.onRequest) return false;
  const [lo, hi] = RANGES[bucket];
  return car.price >= lo && car.price <= hi;
}

function bucketDistance(car: CarMeta, bucket: PriceBucket): number {
  if (inBucket(car, bucket)) return 0;
  if (bucket === "on-request") return Math.abs(45000 - car.price);
  const [lo, hi] = RANGES[bucket];
  return car.price < lo ? lo - car.price : car.price - hi;
}

const matchCategory = (car: CarMeta, f: FleetFilters) => !f.category || car.categories.includes(f.category);
const matchPrice = (car: CarMeta, f: FleetFilters) => !f.price || inBucket(car, f.price);
const matchChauffeur = (car: CarMeta, f: FleetFilters) => !f.chauffeur || car.chauffeur;

export function sortCars(list: CarMeta[], sort: SortKey): CarMeta[] {
  const out = [...list];
  if (sort === "price-asc") out.sort((a, b) => a.price - b.price || a.order - b.order);
  else if (sort === "price-desc") out.sort((a, b) => b.price - a.price || a.order - b.order);
  else if (sort === "power") out.sort((a, b) => b.hp - a.hp || a.order - b.order);
  else out.sort((a, b) => a.order - b.order);
  return out;
}

export function applyFilters(list: CarMeta[], f: FleetFilters): CarMeta[] {
  return sortCars(list.filter((c) => matchCategory(c, f) && matchPrice(c, f) && matchChauffeur(c, f)), f.sort);
}

/** The closest cars when nothing matches: most filters met, then nearest price. */
export function nearestMatches(list: CarMeta[], f: FleetFilters, n = 3): CarMeta[] {
  const score = (c: CarMeta) => Number(matchCategory(c, f)) + Number(matchPrice(c, f)) + Number(matchChauffeur(c, f));
  return [...list]
    .sort((a, b) => score(b) - score(a) || (f.price ? bucketDistance(a, f.price) - bucketDistance(b, f.price) : 0) || a.order - b.order)
    .slice(0, n);
}
