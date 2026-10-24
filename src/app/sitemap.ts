import type { MetadataRoute } from "next";
import { brands, categories } from "@/content/brands";
import { carPath, cars } from "@/content/cars";
import { site } from "@/content/site";
import { areaPages } from "@/content/pages/delivery";
import { legalDocs } from "@/content/pages/legal";
import { factsUpdated, legalUpdated } from "@/content/pages/shared";

// English URLs only (unprefixed). Arabic alternates are added in Phase 3.
// Booking, status, payment and demo pages are left out: they are per-visitor.
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${site.url}${path === "/" ? "" : path}`;
  const page = (path: string, priority: number, lastModified = factsUpdated) => ({ url: url(path), lastModified, priority });
  return [
    page("/", 1),
    page("/cars", 0.9),
    ...cars.map((c) => page(carPath(c), 0.9, c.addedAt)),
    ...brands.map((b) => page(`/cars/${b.slug}`, 0.7)),
    ...categories.map((c) => page(`/cars/type/${c.slug}`, 0.7)),
    page("/chauffeur", 0.8),
    page("/delivery", 0.7),
    ...areaPages.map((a) => page(`/delivery/${a.slug}`, 0.6)),
    page("/pricing", 0.8),
    page("/requirements", 0.7),
    page("/about", 0.5),
    page("/faq", 0.6),
    page("/contact", 0.6),
    ...legalDocs.map((d) => page(`/legal/${d.slug}`, 0.3, legalUpdated)),
  ];
}
