import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brands, getBrand } from "@/content/brands";
import { carsByBrand } from "@/content/cars";
import { brandCopy } from "@/content/copy";
import { getHref, getT } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { fromPrice } from "@/lib/pricing";
import { formatAED, formatNumber } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";
import { BrandCompare, BrandModelCard, OtherBrands, brandFallbackFaqs } from "@/components/fleet/BrandParts";
import { Faqs } from "@/components/fleet/Faqs";
import { FleetSkeleton } from "@/components/fleet/Skeleton";
import { JsonLd, absolute, breadcrumbLd, graph } from "@/components/fleet/seo";

export async function generateStaticParams() {
  return brands.map((b) => ({ brand: b.slug }));
}

function load(slug: string) {
  const brand = getBrand(slug);
  const list = brand ? carsByBrand(brand.slug) : [];
  return brand && list.length ? { brand, list } : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/cars/[brand]">): Promise<Metadata> {
  const { brand: slug } = await params;
  const data = load(slug);
  if (!data) return {};
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);
  const { brand, list } = data;
  const [a, b] = list;
  const title = t("meta.brandTitle", { brand: brand.name, a: a.model, b: b?.model ?? "" });
  const description = t("meta.brandDescription", { brand: brand.name, a: a.model, pa: formatNumber(fromPrice(a, today)), b: b?.model ?? "", pb: b ? formatNumber(fromPrice(b, today)) : "" });
  const url = href(`/cars/${brand.slug}`);
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url: absolute(url), type: "website" } };
}

export default function BrandPage({ params }: PageProps<"/[lang]/cars/[brand]">) {
  // `params` are read under Suspense so client navigations get an instant shell.
  return (
    <Suspense fallback={<FleetSkeleton variant="list" />}>
      <BrandDetail params={params} />
    </Suspense>
  );
}

async function BrandDetail({ params }: { params: PageProps<"/[lang]/cars/[brand]">["params"] }) {
  const { brand: slug } = await params;
  const data = load(slug);
  if (!data) notFound();
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);
  const { brand, list } = data;
  const [a, b] = list;
  const copy = brandCopy[brand.slug];
  const intro = copy?.intro ?? t("brand.intro", { brand: brand.name, a: a.model, b: b?.model ?? "" });
  const faqs = copy?.faqs?.length ? copy.faqs.slice(0, 3) : brandFallbackFaqs(list, brand.name, t);

  const crumbs = [
    { label: t("nav.home"), href: href("/") },
    { label: t("nav.fleet"), href: href("/cars") },
    { label: brand.name },
  ];

  return (
    <div className="container-site grid gap-16 pb-36 md:gap-20">
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: t("nav.home"), path: href("/") },
            { name: t("nav.fleet"), path: href("/cars") },
            { name: brand.name, path: href(`/cars/${brand.slug}`) },
          ]),
        )}
      />

      <header className="grid gap-5 pt-8 md:pt-12">
        <Breadcrumbs items={crumbs} />
        <p className="eyebrow pt-4">{t("brand.eyebrow", { country: brand.country, count: list.length })}</p>
        <h1 className="display-md max-w-4xl">{t("brand.title", { brand: brand.name })}</h1>
        <p className="lede max-w-[68ch]">{intro}</p>
        <p className="text-sm font-semibold text-champagne tabular">
          {list.map((c) => `${c.model} ${c.rates.onRequest ? `${t("car.rate.onRequest").toLowerCase()} · ` : ""}${t("car.rate.fromDay", { price: formatAED(fromPrice(c, today)) })}`).join("  ·  ")}
        </p>
      </header>

      <section aria-labelledby="brand-models" className="grid gap-6">
        <h2 id="brand-models" className="display-sm">{t("brand.models", { brand: brand.name })}</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {list.map((car) => <BrandModelCard key={car.slug} car={car} today={today} href={href} t={t} />)}
        </div>
      </section>

      {a && b && <BrandCompare id="brand-compare" a={a} b={b} today={today} t={t} />}

      <Faqs id="brand-faqs" title={t("brand.faqs", { brand: brand.name })} items={faqs} />

      <OtherBrands id="brand-others" current={brand.slug} today={today} href={href} t={t} />

      <Dock />
    </div>
  );
}
