import type { Metadata } from "next";
import { getLocale } from "@/i18n/dictionaries";
import { alternatesFor, ogLocaleFor } from "@/i18n/metadata";
import { site } from "@/content/site";

// Metadata for the content pages (workstream 07 §7.2 templates). The root layout adds
// " | LuxuryRentals.ae" through its title template. `path` is the unprefixed path ("/pricing");
// the canonical URL follows the page's locale, with hreflang alternates for every locale.
export async function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Promise<Metadata> {
  const locale = await getLocale();
  const alternates = alternatesFor(locale, path);
  return {
    title,
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, siteName: site.brandName, type: "website", ...ogLocaleFor(locale) },
    twitter: { card: "summary_large_image", title, description },
  };
}
