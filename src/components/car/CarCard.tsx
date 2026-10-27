import Link from "next/link";
import clsx from "clsx";
import type { Car } from "@/content/types";
import { getBrand, getCategory } from "@/content/brands";
import { carPath } from "@/content/cars";
import { localizeCategory } from "@/content/localize";
import { getLocale } from "@/i18n/dictionaries";
import { commonT } from "@/i18n/static";
import { isolateFor } from "@/i18n/config";
import { BrandLogo } from "./BrandLogo";
import { CarArt } from "./CarArt";
import { PriceFrom, headlineSpecs } from "./CarBits";

/**
 * Fleet card: image, maker's mark, name, headline specs, "from" price, details and Reserve links.
 * Server Component: it reads the page's locale itself unless `locale` is passed.
 */
export async function CarCard({ car, today, href, className, headingLevel = "h3", priority, locale }: { car: Car; today: string; href: (path: string) => string; className?: string; headingLevel?: "h2" | "h3"; priority?: boolean; locale?: string }) {
  const lc = locale ?? (await getLocale());
  const t = commonT(lc);
  const Heading = headingLevel;
  const category = car.category === "chauffeur" ? t("car.chauffeur") : localizeCategory(getCategory(car.category), lc)?.singular;
  const badge = car.heroRank ? t("car.featured") : undefined;
  return (
    <article className={clsx("card card-hover group relative grid overflow-hidden", className)} data-car={car.slug} data-brand={car.brand} data-category={[car.category, ...car.tags].join(" ")}>
      <div className="relative">
        <CarArt car={car} view="card" priority={priority} className="aspect-[4/3] w-full" locale={lc} />
        {badge && <span className="badge absolute start-3 top-3">{badge}</span>}
      </div>
      <div className="grid gap-3 p-5">
        <div className="grid gap-1">
          {/* The maker's mark sits at the end of the brand line as a label; the name stays as text. */}
          <div className="flex min-h-6 items-center justify-between gap-3">
            <p className="label min-w-0 text-balance">{getBrand(car.brand)?.name} · {category}</p>
            <BrandLogo slug={car.brand} className="h-6 w-auto text-muted transition-colors duration-200 group-hover:text-champagne" />
          </div>
          <Heading className="display-sm">
            <Link href={href(carPath(car))} className="no-underline after:absolute after:inset-0 after:content-['']">
              {isolateFor(lc)(car.model)}
            </Link>
          </Heading>
        </div>
        <p className="text-sm text-muted">{headlineSpecs(car, lc).join(" · ")}</p>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <PriceFrom car={car} today={today} locale={lc} />
          <Link href={href(`/book/trip?car=${car.slug}`)} className="btn btn-secondary btn-sm relative z-[1]">
            {car.rates.onRequest ? t("car.request") : t("car.reserve")}
          </Link>
        </div>
      </div>
    </article>
  );
}
