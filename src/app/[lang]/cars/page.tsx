import { Suspense } from "react";
import type { Metadata } from "next";
import { cars } from "@/content/cars";
import { brands } from "@/content/brands";
import { getHref, getT } from "@/i18n/dictionaries";
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
import probeJson from "@/messages/en/fleet.json";

export async function generateMetadata(): Promise<Metadata> {
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);
  const min = lowestFrom(cars.filter((c) => !c.rates.onRequest), today);
  return {
    title: t("meta.fleetTitle"),
    description: t("meta.fleetDescription", { count: cars.length, min: formatNumber(min) }),
    // Filtered views (?category=…) canonicalise to the full fleet.
    alternates: { canonical: href("/cars") },
  };
}

export default async function FleetPage() {
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);

  // Cards are rendered here on the server; the client view only chooses which to show and in what order.
  const cards = Object.fromEntries(cars.map((car) => [car.slug, <CarCard key={car.slug} car={car} today={today} href={href} headingLevel="h2" className="h-full" />]));
  const crossSell = <ChauffeurCrossSell href={href} t={t} />;
  const brandLinks = brands.map((b) => ({ label: b.name, href: href(`/cars/${b.slug}`) }));
  const shared = { today, cards, crossSell, brandLinks, brandCount: brands.length };

  return (
    <div className="container-site pb-36" data-probe={(probeJson as {fleet?: {title?: string}}).fleet?.title ?? "none"}>
      <JsonLd data={graph(breadcrumbLd([{ name: t("nav.home"), path: href("/") }, { name: t("nav.fleet"), path: href("/cars") }]))} />
      <Suspense fallback={<FleetView {...shared} filters={DEFAULT_FILTERS} />}>
        <FleetBrowser {...shared} />
      </Suspense>
      <Dock />
    </div>
  );
}
