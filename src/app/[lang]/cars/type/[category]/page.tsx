import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { categories, getCategory } from "@/content/brands";
import { carsInCategory, chauffeurCars } from "@/content/cars";
import { rules } from "@/content/rules";
import { getHref, getT } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { lowestFrom } from "@/lib/pricing";
import { formatAED, formatNumber } from "@/lib/format";
import { Breadcrumbs } from "@/components/ui";
import { CarCard } from "@/components/car/CarCard";
import { Dock } from "@/components/booking/Dock";
import { FleetSkeleton } from "@/components/fleet/Skeleton";
import { JsonLd, absolute, breadcrumbLd, graph } from "@/components/fleet/seo";

export async function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

function load(slug: string) {
  const category = getCategory(slug);
  const list = category ? carsInCategory(category.slug) : [];
  return category && list.length ? { category, list } : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/cars/type/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const data = load(slug);
  if (!data) return {};
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);
  const { category, list } = data;
  const title = t("meta.categoryTitle", { category: category.name, min: formatNumber(lowestFrom(list, today)) });
  const description = t("meta.categoryDescription", { count: list.length, category: category.name.toLowerCase(), models: list.map((c) => c.name).join(", ") });
  const url = href(`/cars/type/${category.slug}`);
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url: absolute(url), type: "website" } };
}

export default function CategoryPage({ params }: PageProps<"/[lang]/cars/type/[category]">) {
  // `params` are read under Suspense so client navigations get an instant shell.
  return (
    <Suspense fallback={<FleetSkeleton variant="list" />}>
      <CategoryDetail params={params} />
    </Suspense>
  );
}

async function CategoryDetail({ params }: { params: PageProps<"/[lang]/cars/type/[category]">["params"] }) {
  const { category: slug } = await params;
  const data = load(slug);
  if (!data) notFound();
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);
  const { category, list } = data;
  const min = formatNumber(lowestFrom(list, today));
  const allOnRequest = list.every((c) => c.rates.onRequest);
  const related = categories.filter((c) => c.slug !== category.slug).sort((a, b) => a.order - b.order);
  const chauffeurFrom = Math.min(...chauffeurCars().map((c) => c.chauffeur!.hourly));

  return (
    <div className="container-site grid gap-16 pb-36 md:gap-20">
      <JsonLd
        data={graph(
          breadcrumbLd([
            { name: t("nav.home"), path: href("/") },
            { name: t("nav.fleet"), path: href("/cars") },
            { name: category.name, path: href(`/cars/type/${category.slug}`) },
          ]),
        )}
      />

      <header className="grid gap-5 pt-8 md:pt-12">
        <Breadcrumbs items={[{ label: t("nav.home"), href: href("/") }, { label: t("nav.fleet"), href: href("/cars") }, { label: category.name }]} />
        <p className="eyebrow pt-4">{t("category.eyebrow", { count: list.length })}</p>
        <h1 className="display-md max-w-5xl">{t(allOnRequest ? "category.titleOnRequest" : "category.title", { category: category.name, min })}</h1>
        <p className="lede max-w-[68ch]">{category.description} {t("category.intro")}</p>
      </header>

      <section aria-labelledby="category-cars" className="grid gap-6">
        <h2 id="category-cars" className="display-sm">{t("category.cars", { category: category.name })}</h2>
        <ul className="m-0 grid gap-4 p-0 [list-style:none] md:grid-cols-2 md:gap-5 min-[90rem]:grid-cols-3">
          {list.map((car) => (
            <li key={car.slug} className="grid">
              <CarCard car={car} today={today} href={href} headingLevel="h3" className="h-full" />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="category-related" className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="category-related" className="display-sm">{t("category.related")}</h2>
          <Link href={href("/cars")} className="btn btn-ghost btn-sm -me-3 gap-2 text-accent-hover">
            {t("category.browseAll")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
        <ul className="m-0 grid gap-3 p-0 [list-style:none] sm:grid-cols-2 lg:grid-cols-5">
          {related.map((c) => {
            const cars = carsInCategory(c.slug);
            return (
              <li key={c.slug} className="grid">
                <Link href={href(`/cars/type/${c.slug}`)} className="card card-hover group grid content-start gap-2 p-5 no-underline">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-fg">{c.name}</span>
                    <ArrowRight className="h-4 w-4 flex-none text-accent rtl:-scale-x-100" aria-hidden="true" />
                  </span>
                  <span className="text-[13px] text-muted tabular">{t("category.relatedCount", { count: cars.length, price: formatAED(lowestFrom(cars, today)) })}</span>
                </Link>
              </li>
            );
          })}
          <li className="grid">
            <Link href={href("/chauffeur")} className="card card-hover group grid content-start gap-2 border-accent/40 p-5 no-underline">
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-fg">{t("category.chauffeurCard")}</span>
                <ArrowRight className="h-4 w-4 flex-none text-accent rtl:-scale-x-100" aria-hidden="true" />
              </span>
              <span className="text-[13px] text-muted tabular">{t("crossSell.price", { price: formatAED(chauffeurFrom), hours: rules.chauffeur.minHours })}</span>
            </Link>
          </li>
        </ul>
      </section>

      <Dock />
    </div>
  );
}
