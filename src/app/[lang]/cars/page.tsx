import { Suspense } from "react";
import type { Metadata } from "next";
import { cars } from "@/content/cars";
import { brands, categories } from "@/content/brands";
import { zones } from "@/content/zones";
import { localizeCategory, localizeZone } from "@/content/localize";
import { getHref, getLocale, getT } from "@/i18n/dictionaries";
import { alternatesFor } from "@/i18n/metadata";
import { getToday } from "@/lib/server-time";
import { lowestFrom } from "@/lib/pricing";
import { formatNumber } from "@/lib/format";
import { CarCard } from "@/components/car/CarCard";
import { Dock } from "@/components/booking/Dock";
import { FleetBrowser } from "@/components/fleet/FleetBrowser";
import { FleetView } from "@/components/fleet/FleetView";
import { ChauffeurCrossSell } from "@/components/fleet/ChauffeurCrossSell";
import { DEFAULT_FILTERS } from "@/components/fleet/filters";
import { JsonLd, breadcrumbLd, graph } from "@/components/fleet/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale, today] = await Promise.all([getT("fleet"), getLocale(), getToday()]);
  const min = lowestFrom(cars.filter((c) => !c.rates.onRequest), today);
  return {
    title: t("meta.fleetTitle"),
    description: t("meta.fleetDescription", { count: cars.length, min: formatNumber(min) }),
    // Filtered views (?category=…) canonicalise to the full fleet.
    alternates: alternatesFor(locale, "/cars"),
  };
}

export default async function FleetPage() {
  const [t, href, today, locale] = await Promise.all([getT("fleet"), getHref(), getToday(), getLocale()]);

  // Cards are rendered here on the server; the client view only chooses which to show and in what order.
  const cards = Object.fromEntries(cars.map((car) => [car.slug, <CarCard key={car.slug} car={car} today={today} href={href} headingLevel="h2" className="h-full" priority={!!car.heroRank && car.heroRank <= 3} locale={locale} />]));
  const crossSell = <ChauffeurCrossSell href={href} t={t} locale={locale} />;
  const brandLinks = brands.map((b) => ({ label: b.name, href: href(`/cars/${b.slug}`) }));
  const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, localizeCategory(c, locale).name]));
  const zoneNames = Object.fromEntries(zones.map((z) => [z.slug, localizeZone(z, locale).name]));
  const shared = { today, cards, crossSell, brandLinks, brandCount: brands.length, categoryNames, zoneNames };

  return (
    <div className="container-site pb-36">
      <JsonLd data={graph(breadcrumbLd([{ name: t("nav.home"), path: href("/") }, { name: t("nav.fleet"), path: href("/cars") }]))} />
      <Suspense fallback={<FleetView {...shared} filters={DEFAULT_FILTERS} />}>
        <FleetBrowser {...shared} />
      </Suspense>
      <Dock />
    </div>
  );
}
