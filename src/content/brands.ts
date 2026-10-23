import type { Brand, Category } from "./types";

// Brand names are used as text only (plan D-22): no manufacturer logos anywhere on the site.
export const brands: Brand[] = [
  { slug: "lamborghini", name: "Lamborghini", country: "Italy", order: 1 },
  { slug: "ferrari", name: "Ferrari", country: "Italy", order: 2 },
  { slug: "rolls-royce", name: "Rolls-Royce", country: "United Kingdom", order: 3 },
  { slug: "bugatti", name: "Bugatti", country: "France", order: 4 },
  { slug: "mclaren", name: "McLaren", country: "United Kingdom", order: 5 },
  { slug: "bentley", name: "Bentley", country: "United Kingdom", order: 6 },
  { slug: "aston-martin", name: "Aston Martin", country: "United Kingdom", order: 7 },
  { slug: "maserati", name: "Maserati", country: "Italy", order: 8 },
];

export const categories: Category[] = [
  { slug: "supercars", name: "Supercars", singular: "Supercar", order: 1, description: "Two-seat, mid- or rear-engined cars built for the coast road and Jebel Jais." },
  { slug: "suvs", name: "Luxury SUVs", singular: "Luxury SUV", order: 2, description: "High-riding, four- and five-seat cars for families, airport runs and Hatta day trips." },
  { slug: "convertibles", name: "Convertibles", singular: "Convertible", order: 3, description: "Open-top cars for winter evenings on Jumeirah Beach Road." },
  { slug: "grand-tourers", name: "Grand Tourers", singular: "Grand Tourer", order: 4, description: "Front-engined, long-distance cars with room for two or four." },
  { slug: "hypercars", name: "Hypercars", singular: "Hypercar", order: 5, description: "1,500 hp and up. Price on request, with an escorted handover." },
];

export const getBrand = (slug: string) => brands.find((b) => b.slug === slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
