import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Info, UserRound } from "lucide-react";
import type { Car } from "@/content/types";
import { carPath, cars, getCarByPath } from "@/content/cars";
import { carCopy } from "@/content/copy";
import { rules } from "@/content/rules";
import { getHref, getT } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { fromPrice } from "@/lib/pricing";
import { formatAED, formatNumber, formatSeconds } from "@/lib/format";
import { Badge, Breadcrumbs } from "@/components/ui";
import { CarArt } from "@/components/car/CarArt";
import { CarCard } from "@/components/car/CarCard";
import { PriceFrom, SpecList, specRows } from "@/components/car/CarBits";
import { ReserveCard } from "@/components/booking/ReserveCard";
import { CarStickyBar } from "@/components/fleet/CarStickyBar";
import { Faqs } from "@/components/fleet/Faqs";
import { ChauffeurPanel, ChauffeurRates, ConciergePanel, HeadlineStats, Included, KineticCallouts, RateTable, Requirements, Section, carFaqs } from "@/components/fleet/CarParts";
import { brandName, primaryCategory, similarCars } from "@/components/fleet/facts";
import { FleetSkeleton } from "@/components/fleet/Skeleton";
import { JsonLd, absolute, breadcrumbLd, carLd, graph } from "@/components/fleet/seo";

export async function generateStaticParams({ params }: { params: { brand?: string } }) {
  return cars.filter((c) => !params?.brand || c.brand === params.brand).map((c) => ({ brand: c.brand, model: c.modelSlug }));
}

type T = (key: string, vars?: Record<string, string | number>) => string;

function metaFor(car: Car, today: string, t: T) {
  const price = formatNumber(fromPrice(car, today));
  const s = car.specs;
  const base = { name: car.name, model: car.name, hp: formatNumber(s.hp), s: formatSeconds(s.zeroTo100).replace(" s", ""), price, km: car.rates.kmPerDay };
  if (car.chauffeurFirst && car.chauffeur) {
    const hourly = formatNumber(car.chauffeur.hourly);
    return { title: t("meta.carTitleChauffeur", { ...base, price: hourly }), description: t("meta.carDescriptionChauffeur", { ...base, hourly }) };
  }
  if (car.rates.onRequest) return { title: t("meta.carTitleOnRequest", base), description: t("meta.carDescriptionOnRequest", base) };
  return { title: t("meta.carTitle", base), description: t("meta.carDescription", base) };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/cars/[brand]/[model]">): Promise<Metadata> {
  const { brand, model } = await params;
  const car = getCarByPath(brand, model);
  if (!car) notFound();
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);
  const { title, description } = metaFor(car, today, t);
  const url = href(carPath(car));
  // The template already carries the price, so the brand suffix is left off (07 §7.2).
  return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { title, description, url: absolute(url), type: "website" } };
}

export default function CarPage({ params }: PageProps<"/[lang]/cars/[brand]/[model]">) {
  // `params` are read under Suspense so client navigations get an instant shell.
  return (
    <Suspense fallback={<FleetSkeleton variant="car" />}>
      <CarDetail params={params} />
    </Suspense>
  );
}

async function CarDetail({ params }: { params: PageProps<"/[lang]/cars/[brand]/[model]">["params"] }) {
  const { brand: brandSlug, model } = await params;
  const car = getCarByPath(brandSlug, model);
  if (!car) notFound();
  const [t, href, today] = await Promise.all([getT("fleet"), getHref(), getToday()]);

  const brand = brandName(car);
  const category = primaryCategory(car);
  const copy = carCopy[car.slug];
  const paragraphs = copy?.description ? copy.description.split("\n\n") : [car.tagline];
  const highlights = copy?.highlights ?? [];
  const price = fromPrice(car, today);
  const path = carPath(car);
  const similar = similarCars(car, today);
  const faqs = carFaqs(car, today, t);
  const { description } = metaFor(car, today, t);

  const crumbs = [
    { label: t("nav.home"), href: href("/") },
    { label: t("nav.fleet"), href: href("/cars") },
    { label: brand, href: href(`/cars/${car.brand}`) },
    { label: car.model },
  ];

  const specs = specRows(car);
  if (car.chauffeur) specs.push({ label: t("car.chauffeurRow"), value: t("car.chauffeurRowValue", { price: formatAED(car.chauffeur.hourly) }) });

  // Mobile sticky bar: chauffeur-first for the Phantom, concierge for Bugatti, Reserve otherwise.
  const sticky = car.chauffeurFirst && car.chauffeur
    ? { price: t("car.stickyHour", { price: formatAED(car.chauffeur.hourly) }), note: t("car.stickyNoteHour", { hours: rules.chauffeur.minHours }), ctaLabel: t("car.stickyChauffeurCta"), ctaHref: href(`/book/trip?car=${car.slug}&service=chauffeur`) }
    : { price: t("car.stickyDay", { price: formatAED(price) }), note: car.rates.onRequest ? t("car.stickyNoteRequest") : t("car.stickyNote"), ctaLabel: car.rates.onRequest ? t("car.request") : t("car.reserve"), ctaHref: href(`/book/trip?car=${car.slug}`) };

  return (
    <>
      <div className="container-site pb-32 lg:pb-28">
        <JsonLd
          data={graph(
            breadcrumbLd([
              { name: t("nav.home"), path: href("/") },
              { name: t("nav.fleet"), path: href("/cars") },
              { name: brand, path: href(`/cars/${car.brand}`) },
              { name: car.name },
            ]),
            carLd(car, { path: href(path), price, description }),
          )}
        />

        <div className="pt-8 md:pt-10">
          <Breadcrumbs items={crumbs} />
        </div>

        <div className="mt-6 grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-x-14">
          {/* Hero, name, price and headline specs */}
          <header className="grid min-w-0 content-start gap-7 lg:col-start-1">
            <figure className="m-0 grid gap-3">
              <div className="relative overflow-hidden rounded-[24px] border border-line bg-card">
                <CarArt car={car} view="hero" priority className="aspect-video w-full" sizes="(min-width: 1024px) 66vw, 100vw" />
              </div>
              {car.images.status !== "photo" && (
                <figcaption className="fine flex items-start gap-2">
                  <Info className="mt-px h-3.5 w-3.5 flex-none text-info" aria-hidden="true" />
                  <span>{t("car.illustrative")}</span>
                </figcaption>
              )}
            </figure>

            <div className="grid gap-5">
              <div className="flex flex-wrap items-center gap-2">
                {category ? <Badge>{category.singular}</Badge> : <Badge>{t("car.chauffeurFirst")}</Badge>}
                {car.rates.onRequest && <Badge muted>{t("car.onRequestBadge")}</Badge>}
                {!car.rates.onRequest && car.heroRank && <Badge muted>{t("car.featured")}</Badge>}
              </div>
              <h1 className="grid gap-3">
                <span className="display-md">{car.name}</span>
                <span className="label text-accent">{car.chauffeurFirst ? t("car.chauffeurIn") : t("car.rentalIn")}</span>
              </h1>
              <p className="lede">{car.tagline}</p>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                {car.chauffeurFirst && car.chauffeur ? (
                  <div className="grid gap-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular">
                      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{t("car.from")}</span>
                      <span className="text-2xl font-semibold">{formatAED(car.chauffeur.hourly)}</span>
                      <span className="text-[12px] text-muted">{t("car.perHourChauffeur")}</span>
                    </p>
                    <p className="text-[13px] text-muted tabular">{t("car.selfDriveFrom", { price: formatAED(price) })}</p>
                  </div>
                ) : (
                  <PriceFrom car={car} today={today} size="lg" />
                )}
                {car.chauffeur && (
                  <p className="flex items-center gap-2 text-sm text-champagne">
                    <UserRound className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("car.chauffeurAvailable")}
                  </p>
                )}
              </div>
              <HeadlineStats car={car} t={t} />
            </div>
          </header>

          {/* Booking module: sticky right column on desktop, inline under the hero on mobile */}
          <aside aria-label={t("car.bookingLabel", { model: car.model })} className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div id="booking" className="grid scroll-mt-28 grid-cols-1 gap-4 lg:sticky lg:top-28">
              {car.rates.onRequest ? (
                <ConciergePanel car={car} today={today} t={t} href={href} />
              ) : car.chauffeurFirst ? (
                <ChauffeurPanel car={car} today={today} t={t} href={href} />
              ) : (
                <>
                  <div className="hidden min-w-0 lg:block [&_.grid>*]:min-w-0"><ReserveCard car={car} eyebrow={t("car.reserveEyebrow")} className="grid-cols-1" /></div>
                  <div className="min-w-0 lg:hidden [&_.grid>*]:min-w-0"><ReserveCard car={car} variant="inline" eyebrow={t("car.reserveEyebrow")} className="grid-cols-1" /></div>
                  {car.chauffeur && (
                    <Link href={href(`/book/trip?car=${car.slug}&service=chauffeur`)} className="card card-hover flex min-h-11 items-center justify-between gap-3 px-5 py-4 no-underline">
                      <span className="grid gap-0.5">
                        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent-hover">{t("car.bookChauffeur")}</span>
                        <span className="text-[13px] text-muted tabular">{t("car.chauffeurPanelPrice", { price: formatAED(car.chauffeur.hourly), hours: rules.chauffeur.minHours })}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 flex-none text-accent rtl:-scale-x-100" aria-hidden="true" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </aside>

          {/* Details */}
          <div className="grid min-w-0 content-start gap-16 lg:col-start-1">
            <Section id="about" title={t("car.about", { model: car.model })}>
              <div className="grid gap-4 text-[16px] leading-relaxed text-champagne">
                {paragraphs.map((p) => <p key={p.slice(0, 32)} className="max-w-[68ch]">{p}</p>)}
              </div>
              {highlights.length > 0 && (
                <div className="grid gap-3">
                  <p className="label">{t("car.highlights")}</p>
                  <ul className="m-0 grid gap-3 p-0 [list-style:none] md:grid-cols-3">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-3 rounded-[14px] border border-line bg-card/60 p-4 text-[14px] font-semibold leading-snug">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>

            <KineticCallouts id="kinetic" car={car} t={t} />

            <Section id="specs" title={t("car.specs")}>
              <SpecList car={car} rows={specs} />
            </Section>

            <Section id="this-car" title={t("car.thisCar", { model: car.model })} lede={t("car.thisCarLede")}>
              <div className="grid gap-8 md:grid-cols-2 md:gap-10">
                <dl className="spec-list">
                  <div><dt>{t("car.modelYear")}</dt><dd>{car.year}</dd></div>
                  <div>
                    <dt>{t("car.exterior")}</dt>
                    <dd className="flex items-center justify-end gap-2">
                      <span aria-hidden="true" className="h-3.5 w-3.5 flex-none rounded-full border border-fg/30" style={{ background: car.paint.hex }} />
                      {car.paint.name}
                    </dd>
                  </div>
                  <div><dt>{t("car.interior")}</dt><dd>{car.details.interior}</dd></div>
                  <div><dt>{t("car.wheels")}</dt><dd>{car.details.wheels}</dd></div>
                </dl>
                <div className="grid content-start gap-3">
                  <p className="label">{t("car.equipment")}</p>
                  <ul className="m-0 grid gap-2 p-0 [list-style:none]">
                    {car.details.equipment.map((e) => (
                      <li key={e} className="flex items-start gap-3 text-[15px] leading-snug">
                        <Check className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="included" title={t("car.included")} lede={t("car.includedLede")}>
              <Included car={car} today={today} t={t} />
            </Section>

            <Section id="requirements" title={t("car.requirements")} lede={t("car.requirementsLede")}>
              <Requirements car={car} t={t} />
              <Link href={href("/requirements")} className="btn btn-ghost btn-sm -ms-3 justify-self-start gap-2 text-accent-hover">
                {t("car.requirementsLink")}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            </Section>

            <Section id="rates" title={car.chauffeurFirst ? `${t("car.rates")} · ${t("car.selfDriveApproval")}` : t("car.rates")} lede={car.rates.onRequest ? undefined : t("car.ratesNote")}>
              <RateTable car={car} today={today} t={t} />
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                <Link href={href("/pricing")} className="btn btn-ghost btn-sm -ms-3 gap-2 text-accent-hover">
                  {t("car.pricingLink")}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
                <Link href={href("/delivery")} className="btn btn-ghost btn-sm gap-2 text-accent-hover">
                  {t("car.deliveryLink")}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              </div>
            </Section>

            {car.chauffeur && (
              <Section id="chauffeur" title={t("car.chauffeurRates")} lede={t("car.chauffeurLede", { included: rules.chauffeur.included })}>
                <ChauffeurRates car={car} t={t} />
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={href(`/book/trip?car=${car.slug}&service=chauffeur`)} className={car.chauffeurFirst ? "btn btn-primary" : "btn btn-secondary"}>{t("car.bookChauffeur")}</Link>
                  <Link href={href("/chauffeur")} className="btn btn-ghost btn-sm gap-2 text-accent-hover">
                    {t("car.chauffeurLink")}
                    <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                  </Link>
                </div>
              </Section>
            )}
          </div>
        </div>

        <div className="mt-20 grid gap-20">
          <Faqs id="faqs" title={t("car.faqs", { model: car.model })} items={faqs} className="max-w-4xl" />

          <section aria-labelledby="similar" className="grid gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="similar" className="display-sm">{t("car.similar")}</h2>
              <nav aria-label={t("car.linksTitle")} className="flex flex-wrap gap-2">
                <Link href={href(`/cars/${car.brand}`)} className="btn btn-secondary btn-sm">{t("car.moreFrom", { brand })}</Link>
                {category && <Link href={href(`/cars/type/${category.slug}`)} className="btn btn-secondary btn-sm">{t("car.allIn", { category: category.name })}</Link>}
              </nav>
            </div>
            <ul className="m-0 grid gap-4 p-0 [list-style:none] md:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {similar.map((c) => (
                <li key={c.slug} className="grid">
                  <CarCard car={c} today={today} href={href} headingLevel="h3" className="h-full" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <CarStickyBar {...sticky} watchId="booking" />
    </>
  );
}
