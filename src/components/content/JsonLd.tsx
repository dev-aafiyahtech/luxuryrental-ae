import { site } from "@/content/site";
import { plain } from "@/content/pages/shared";

// Structured data for the content pages (workstream 07 §7.3). Every value mirrors visible
// text on the page. FAQPage no longer earns a Google rich result (May 2026); it is kept for
// entity clarity with Bing and AI answer engines.

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

const abs = (path: string) => `${site.url}${path === "/" ? "/" : path}`;

export function breadcrumbLd(items: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: abs(item.path) } : {}),
    })),
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: plain(item.a).replace(/\n{2,}/g, " ") },
    })),
  };
}

export const businessRef = { "@id": `${site.url}/#business` };

export function graph(...nodes: Record<string, unknown>[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

export { abs as absoluteUrl };
