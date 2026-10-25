import Link from "next/link";
import { Building2, ChevronDown, MapPinned, PlaneLanding, CarFront, Send } from "lucide-react";
import { cars } from "@/content/cars";
import { brands } from "@/content/brands";
import { rules } from "@/content/rules";
import { siteFor } from "@/content/localize";
import { getZone } from "@/content/zones";
import { getHref, getLocale, getT } from "@/i18n/dictionaries";
import { formatAED } from "@/lib/format";
import { CarCard } from "@/components/car/CarCard";
import { ButtonLink, Eyebrow } from "@/components/ui";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { FleetStrip } from "./Islands";

// Normal-scrolling sections after the four chapters: the whole fleet by marque, how a
// request works, the delivery teaser, the trust row and four FAQs. Every figure here is
// read from the shared data modules, never typed in.

export async function AfterChapters({ today }: { today: string }) {
  const [t, href, locale] = await Promise.all([getT("home"), getHref(), getLocale()]);
  const site = siteFor(locale);
  const aed = (n: number) => formatAED(n, locale);
  const groups = [...brands].sort((a, b) => a.order - b.order).map((brand) => ({ brand, list: cars.filter((c) => c.brand === brand.slug) })).filter((g) => g.list.length);

  const city = getZone("dubai")!;
  const dxb = getZone("dxb")!;
  const selfDrive = cars.filter((c) => c.tier !== "H");
  const hyper = cars.filter((c) => c.tier === "H");
  const deposits = selfDrive.map((c) => c.rates.deposit);
  const km = selfDrive.map((c) => c.rates.kmPerDay);
  const { L, S, H } = rules.tiers;

  const faqs = [
    { id: "age", q: t("faq.age.q"), a: t("faq.age.a", { age: Math.min(L.minAge, S.minAge), years: L.licenceYears, supercarYears: S.licenceYears, hyperAge: H.minAge, hyperYears: H.licenceYears }) },
    { id: "deposit", q: t("faq.deposit.q"), a: t("faq.deposit.a", { from: aed(Math.min(...deposits)), to: aed(Math.max(...deposits)), days: L.releaseDays }) + (hyper.length ? ` ${t("faq.deposit.hyper", { amount: aed(Math.min(...hyper.map((c) => c.rates.deposit))), days: H.releaseDays })}` : "") },
    { id: "airport", q: t("faq.airport.q"), a: t("faq.airport.a", { fee: aed(dxb.fee ?? 0) }) },
    { id: "included", q: t("faq.included.q"), a: t("faq.included.a", { kmFrom: Math.min(...km), kmTo: Math.max(...km), salik: rules.tollAdminFee }) },
  ];

  const steps = [
    { icon: CarFront, tone: "text-accent-hover", title: t("how.steps.pick.title"), body: t("how.steps.pick.body", { cars: cars.length }) },
    { icon: Send, tone: "text-accent-hover", title: t("how.steps.request.title"), body: t("how.steps.request.body") },
    // The WhatsApp glyph is never recoloured gold.
    { icon: WhatsAppIcon, tone: "text-fg", title: t("how.steps.confirm.title"), body: t("how.steps.confirm.body", { reply: site.replyPromise }) },
  ];

  const delivery = [
    { icon: Building2, title: t("delivery.base.title"), body: t("delivery.base.body") },
    { icon: MapPinned, title: t("delivery.city.title"), body: t("delivery.city.body", { days: city.freeFromDays ?? 2, fee: aed(city.fee ?? 0) }) },
    { icon: PlaneLanding, title: t("delivery.airport.title"), body: t("delivery.airport.body", { fee: aed(dxb.fee ?? 0) }) },
  ];

  return (
    <div className="relative z-[2] bg-bg">
      {/* The whole fleet, grouped by marque */}
      <section aria-labelledby="h-all-cars" className="border-t border-line py-20 lg:py-28">
        <div className="container-site grid gap-8">
          <header className="flex flex-wrap items-end justify-between gap-6">
            <div className="grid max-w-3xl gap-4">
              <Eyebrow>{t("fleet.eyebrow")}</Eyebrow>
              <h2 id="h-all-cars" className="display-md">
                {t("fleet.title", { cars: cars.length, brands: groups.length })}
              </h2>
              <p className="lede">{t("fleet.lede")}</p>
            </div>
            <ButtonLink variant="secondary" href={href("/cars")}>
              {t("fleet.all")}
            </ButtonLink>
          </header>
          <FleetStrip labels={{ region: t("fleet.region"), prev: t("fleet.prev"), next: t("fleet.next") }}>
            {groups.map(({ brand, list }) => (
              <div key={brand.slug} role="group" aria-label={brand.name} className="grid flex-none content-start gap-3">
                <p className="label">
                  <Link href={href(`/cars/${brand.slug}`)} className="inline-flex min-h-8 items-center no-underline hover:text-fg" aria-label={t("fleet.brand", { brand: brand.name })}>
                    {brand.name}
                  </Link>
                </p>
                <div className="flex gap-4">
                  {list.map((car) => (
                    <CarCard key={car.slug} car={car} today={today} href={href} className="w-[min(78vw,300px)] flex-none snap-start" />
                  ))}
                </div>
              </div>
            ))}
          </FleetStrip>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="h-how" className="border-t border-line py-20 lg:py-28">
        <div className="container-site grid gap-10">
          <header className="grid max-w-3xl gap-4">
            <Eyebrow>{t("how.eyebrow")}</Eyebrow>
            <h2 id="h-how" className="display-md">
              {t("how.title")}
            </h2>
          </header>
          <ol className="grid gap-4 p-0 [list-style:none] md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card grid content-start gap-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-display text-sm font-bold tracking-[0.08em] text-accent-hover">{String(i + 1).padStart(2, "0")}</span>
                  <s.icon className={`size-5 ${s.tone}`} />
                </div>
                <h3 className="display-sm">{s.title}</h3>
                <p className="text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <div>
            <ButtonLink href={href("/cars")}>{t("how.cta")}</ButtonLink>
          </div>
        </div>
      </section>

      {/* Delivery teaser */}
      <section aria-labelledby="h-delivery" className="border-t border-line py-20 lg:py-28">
        <div className="container-site grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-center">
          <div className="grid content-start gap-5">
            <Eyebrow>{t("delivery.eyebrow")}</Eyebrow>
            <h2 id="h-delivery" className="display-md">
              {t("delivery.title")}
            </h2>
            <p className="lede">{t("delivery.lede")}</p>
            <div>
              <ButtonLink variant="secondary" href={href("/delivery")}>
                {t("delivery.cta")}
              </ButtonLink>
            </div>
          </div>
          <ul className="grid gap-3 p-0 [list-style:none] sm:grid-cols-3 lg:grid-cols-1">
            {delivery.map((d) => (
              <li key={d.title} className="card flex items-start gap-4 p-5">
                <span className="flex size-11 flex-none items-center justify-center rounded-full border border-line text-accent-hover">
                  <d.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="grid gap-1">
                  <h3 className="text-base font-semibold">{d.title}</h3>
                  <p className="text-sm text-muted">{d.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Trust row */}
      <section aria-label={t("trust.label")} className="border-y border-line bg-card/40 py-8">
        <ul className="trust container-site justify-center">
          <li>{t("reserve.trust.insurance")}</li>
          <li>{t("reserve.trust.vat")}</li>
          <li>{t("reserve.trust.delivery")}</li>
          <li>{t("trust.base")}</li>
        </ul>
      </section>

      {/* FAQs */}
      <section aria-labelledby="h-faq" className="py-20 lg:py-28">
        <div className="container-narrow grid gap-8">
          <header className="grid gap-4">
            <Eyebrow>{t("faq.eyebrow")}</Eyebrow>
            <h2 id="h-faq" className="display-md">
              {t("faq.title")}
            </h2>
          </header>
          <div className="grid gap-3">
            {faqs.map((f) => (
              <details key={f.id} className="card group transition-colors open:border-[rgba(235,218,176,.5)]">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="size-5 flex-none text-accent-hover transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-5 pb-5 leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
          <div>
            <ButtonLink variant="secondary" href={href("/faq")}>
              {t("faq.all")}
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
