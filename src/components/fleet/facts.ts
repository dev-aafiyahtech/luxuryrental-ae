import type { Car, Category } from "@/content/types";
import { cars } from "@/content/cars";
import { categories, getBrand, getCategory } from "@/content/brands";
import { offers } from "@/content/rules";
import { fromPrice } from "@/lib/pricing";

// Small, pure helpers shared by the brand, car and category pages. Facts always come from
// the content modules; nothing here invents a number.

/** The car's primary category ("Supercars"), or undefined for the chauffeur-only Phantom. */
export const primaryCategory = (car: Car): Category | undefined => (car.category === "chauffeur" ? undefined : getCategory(car.category));

/** Every category the car appears in (primary first, then tags). */
export const carCategories = (car: Car): Category[] =>
  [car.category, ...car.tags].map((slug) => categories.find((c) => c.slug === slug)).filter((c): c is Category => !!c);

export const brandName = (car: Car) => getBrand(car.brand)?.name ?? car.brand;

/** An offer when it is still valid on `today` (YYYY-MM-DD). */
export function activeOffer(id: string, today: string) {
  const offer = offers.find((o) => o.id === id);
  return offer && today <= offer.validUntil ? offer : undefined;
}

/** "31 Dec 2026" from an ISO date. */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

/**
 * Three similar cars: cars sharing a category come first, then the nearest daily price.
 * Same-brand siblings are left to the brand link, so they rank just below other matches.
 */
export function similarCars(car: Car, today: string, n = 3): Car[] {
  const mine = new Set<string>([car.category, ...car.tags]);
  const price = fromPrice(car, today);
  const score = (c: Car) => {
    const shared = [c.category, ...c.tags].filter((s) => mine.has(s)).length;
    return (shared > 0 ? 10 : 0) + (c.category === car.category ? 2 : 0) + (c.brand === car.brand ? -1 : 0);
  };
  return cars
    .filter((c) => c.slug !== car.slug)
    .sort((a, b) => score(b) - score(a) || Math.abs(fromPrice(a, today) - price) - Math.abs(fromPrice(b, today) - price))
    .slice(0, n);
}

/** Parse the first-number seat count for comparisons ("4–5" → "4–5" stays as text elsewhere). */
export const seatText = (car: Car) => car.specs.seats;
