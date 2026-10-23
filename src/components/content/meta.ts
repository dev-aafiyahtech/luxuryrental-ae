import type { Metadata } from "next";
import { getHref } from "@/i18n/dictionaries";
import { site } from "@/content/site";

// Metadata for the content pages (workstream 07 §7.2 templates). The root layout adds
// " | LuxuryRental.ae" through its title template.
export async function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Promise<Metadata> {
  const href = await getHref();
  const url = href(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: site.brandName, type: "website", locale: "en_AE" },
    twitter: { card: "summary_large_image", title, description },
  };
}
