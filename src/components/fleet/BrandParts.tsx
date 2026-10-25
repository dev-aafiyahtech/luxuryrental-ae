import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import type { Car } from "@/content/types";
import { brands, getBrand } from "@/content/brands";
import { carPath, carsByBrand } from "@/content/cars";
import { rules } from "@/content/rules";
import { localizeCategory } from "@/content/localize";
import { fromPrice } from "@/lib/pricing";
import { formatAED, formatNumber, formatSeconds, formatTopSpeed } from "@/lib/format";
import { CarArt } from "@/components/car/CarArt";
import { PriceFrom, driveText, headlineSpecs } from "@/components/car/CarBits";
import { commonT } from "@/i18n/static";
import { primaryCategory } from "./facts";

type T = (key: string, vars?: Record<string, string | number>) => string;
type Href = (path: string) => string;

/** Large model card for a brand page: wide image, name, tagline, headline specs, price and both CTAs. */
export function BrandModelCard({ car, today, href, t, locale }: { car: Car; today: string; href: Href; t: T; locale?: string }) {
  const category = localizeCategory(primaryCategory(car), locale)?.singular ?? t("car.chauffeurPanelEyebrow");
  const reserveHref = car.chauffeurFirst ? href(`/book/trip?car=${car.slug}&service=chauffeur`) : href(`/book/trip?car=${car.slug}`);
  const reserveLabel = car.chauffeurFirst ? t("car.bookChauffeur") : car.rates.onRequest ? t("car.request") : t("car.reserve");
  return (
    <article className="card card-hover group relative grid overflow-hidden" data-car={car.slug}>
      <div className="relative">
        <CarArt car={car} view="hero" className="aspect-[2/1] w-full" sizes="(min-width: 1024px) 50vw, 100vw" locale={locale} />
        {car.heroRank && <span className="badge absolute start-4 top-4">{t("car.featured")}</span>}
      </div>
      <div className="grid gap-4 p-6 md:p-8">
        <div className="grid gap-2">
          <p className="label">{category} · {car.year}</p>
          <h3 className="display-sm">
            <Link href={href(carPath(car))} className="no-underline after:absolute after:inset-0 after:content-['']">{car.model}</Link>
          </h3>
          <p className="text-[15px] text-champagne">{car.tagline}</p>
        </div>
        <p className="text-sm text-muted">{headlineSpecs(car, locale).join(" · ")}</p>
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
          <PriceFrom car={car} today={today} size="lg" locale={locale} />
          <div className="relative z-[1] flex flex-wrap gap-2">
            <span className="btn btn-ghost btn-sm pointer-events-none gap-2 text-accent-hover" aria-hidden="true">
              {t("brand.details")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </span>
            <Link href={reserveHref} className="btn btn-secondary btn-sm">{reserveLabel}</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Two-model comparison. A real table on wider screens; below `md` each row becomes the spec
 * name on its own line with the two values side by side (roles keep the table semantics).
 */
export function BrandCompare({ a, b, today, t, id, locale }: { a: Car; b: Car; today: string; t: T; id: string; locale?: string }) {
  const ct = commonT(locale);
  const price = (c: Car) => `${c.rates.onRequest ? `${t("car.rate.onRequest")} · ` : ""}${formatAED(fromPrice(c, today), locale)}`;
  const rows: { label: string; values: [string, string] }[] = [
    { label: t("brand.row.from"), values: [price(a), price(b)] },
    { label: t("brand.row.power"), values: [ct("car.hp", { hp: formatNumber(a.specs.hp) }), ct("car.hp", { hp: formatNumber(b.specs.hp) })] },
    { label: t("brand.row.sprint"), values: [formatSeconds(a.specs.zeroTo100, locale), formatSeconds(b.specs.zeroTo100, locale)] },
    { label: t("brand.row.top"), values: [formatTopSpeed(a.specs.topSpeedKmh, a.specs.topSpeedNote, locale), formatTopSpeed(b.specs.topSpeedKmh, b.specs.topSpeedNote, locale)] },
    { label: t("brand.row.engine"), values: [a.specs.engine, b.specs.engine] },
    { label: t("brand.row.seats"), values: [a.specs.seats, b.specs.seats] },
    { label: t("brand.row.body"), values: [a.specs.body, b.specs.body] },
    { label: t("brand.row.drive"), values: [driveText(a, locale), driveText(b, locale)] },
    { label: t("brand.row.km"), values: [ct("car.km", { km: formatNumber(a.rates.kmPerDay) }), ct("car.km", { km: formatNumber(b.rates.kmPerDay) })] },
    { label: t("brand.row.deposit"), values: [formatAED(a.rates.deposit, locale), formatAED(b.rates.deposit, locale)] },
    { label: t("brand.row.age"), values: [ct("car.minAge", { age: a.minAge }), ct("car.minAge", { age: b.minAge })] },
  ];
  const rowCls = "grid grid-cols-2 gap-x-4 border-b border-line py-3 md:table-row md:py-0";
  return (
    <section aria-labelledby={id} className="grid gap-6">
      <div className="grid gap-2">
        <h2 id={id} className="display-sm">{t("brand.compare")}</h2>
        <p className="text-muted">{t("brand.compareLede", { a: a.model, b: b.model })}</p>
      </div>
      <table role="table" className="block w-full border-collapse text-[14px] md:table">
        <caption className="sr-only">{t("brand.compareCaption", { a: a.name, b: b.name })}</caption>
        <thead role="rowgroup" className="block md:table-header-group">
          <tr role="row" className={clsx(rowCls, "border-line md:border-b")}>
            <th role="columnheader" scope="col" className="hidden py-3 text-start md:table-cell md:w-[28%]"><span className="label">{t("brand.spec")}</span></th>
            {[a, b].map((c) => (
              <th key={c.slug} role="columnheader" scope="col" className="py-1 text-start align-bottom md:table-cell md:py-4">
                <span className="font-display text-[13px] font-bold uppercase tracking-[0.06em] text-accent-hover md:text-[15px]">{c.model}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {rows.map((r) => (
            <tr key={r.label} role="row" className={rowCls}>
              <th role="rowheader" scope="row" className="col-span-2 pb-1 text-start md:table-cell md:py-3.5 md:pe-4">
                <span className="label">{r.label}</span>
              </th>
              {r.values.map((v, i) => (
                <td key={i} role="cell" className="text-start align-top font-semibold tabular md:table-cell md:py-3.5 md:pe-4">{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Row of the other marques, each with its two models and today's lowest "from" price. */
export function OtherBrands({ current, today, href, t, id, locale }: { current: string; today: string; href: Href; t: T; id: string; locale?: string }) {
  const others = brands.filter((b) => b.slug !== current).sort((x, y) => x.order - y.order);
  return (
    <section aria-labelledby={id} className="grid gap-6">
      <h2 id={id} className="display-sm">{t("brand.otherBrands")}</h2>
      <ul className="grid grid-cols-1 gap-3 p-0 [list-style:none] sm:grid-cols-2 lg:grid-cols-4">
        {others.map((b) => {
          const list = carsByBrand(b.slug);
          const min = Math.min(...list.map((c) => fromPrice(c, today)));
          return (
            <li key={b.slug} className="grid">
              <Link href={href(`/cars/${b.slug}`)} className="card card-hover group grid min-h-11 gap-1.5 p-5 no-underline">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-[14px] font-bold uppercase tracking-[0.06em] text-fg">{getBrand(b.slug)?.name}</span>
                  <ArrowRight className="h-4 w-4 flex-none text-accent transition-transform duration-200 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" />
                </span>
                <span className="text-[13px] text-muted">{t("brand.models2", { a: list[0]?.model ?? "", b: list[1]?.model ?? "" })}</span>
                <span className="text-[13px] font-semibold text-champagne tabular">{t("brand.fromPrice", { price: formatAED(min, locale) })}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Data-driven FAQs for a brand when the CMS copy has none. */
export function brandFallbackFaqs(cars: Car[], brand: string, t: T, locale?: string) {
  const [a, b] = cars;
  if (!a || !b) return [];
  const minAge = Math.max(a.minAge, b.minAge);
  const years = Math.max(a.licenceYears, b.licenceYears);
  const days = Math.max(rules.tiers[a.tier].releaseDays, rules.tiers[b.tier].releaseDays);
  return [
    { q: t("brand.faq.ageQ", { brand }), a: t("brand.faq.ageA", { age: minAge, years }) },
    { q: t("brand.faq.whichQ", { a: a.model, b: b.model }), a: t("brand.faq.whichA", { a: a.model, b: b.model, hpA: formatNumber(a.specs.hp), hpB: formatNumber(b.specs.hp), seatsA: a.specs.seats, seatsB: b.specs.seats }) },
    { q: t("brand.faq.depositQ", { brand }), a: t("brand.faq.depositA", { a: a.model, b: b.model, depA: formatAED(a.rates.deposit, locale), depB: formatAED(b.rates.deposit, locale), days }) },
  ];
}
