import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// Before launch, crawlers are kept out (pages also send noindex).
// At launch, `site.demo` turns off and the production rules below apply.
export default function robots(): MetadataRoute.Robots {
  if (site.demo) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/book/", "/booking", "/pay", "/ops"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
