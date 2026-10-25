import Link from "next/link";
import { Fragment } from "react";
import { carPath, cars } from "@/content/cars";
import { getBrand } from "@/content/brands";
import { seasonFor } from "@/content/rules";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { fromPrice, lowestFrom } from "@/lib/pricing";
import { formatAED } from "@/lib/format";
import * as pricingEn from "@/content/pages/pricing";
import * as pricingAr from "@/content/pages/ar/pricing";
import { commonKmPerDay, factsUpdated, monthStamp } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, LastUpdated, OfferNotice, Section, WhatsAppButton } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { JsonLd, absoluteUrl, breadcrumbLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { Badge, ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

// Copy and data text come from content/pages/pricing.ts (English) or content/pages/ar/pricing.ts
// (Arabic), picked by locale; numbers are the same in both.
const pricingFor = (locale: string) => (locale === "ar" ? pricingAr : pricingEn);

export async function generateMetadata() {
  const locale = await getLocale();
  const { pricingMeta } = pricingFor(locale);
  return pageMetadata({ title: pricingMeta.title(monthStamp(factsUpdated, locale)), description: pricingMeta.description, path: "/pricing" });
}

/** The copy mini-markup (`**bold**`, `[label](/path)`) with this page's inline styles. */
function Inline({ text, href }: { text: string; href: (path: string) => string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
        if (!part) return null;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="text-fg">{part.slice(2, -2)}</strong>;
        const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
        if (link) return <Link key={i} href={href(link[2])} className="text-fg">{link[1]}</Link>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const NA = ({ label }: { label: string }) => (
  <span className="text-muted">
    <span aria-hidden="true">–</span>
    <span className="sr-only">{label}</span>
  </span>
);

export default async function PricingPage() {
  const [href, today, locale] = await Promise.all([getHref(), getToday(), getLocale()]);
  const M = pricingFor(locale);
  const P = M.pricingPage;
  const season = seasonFor(today);
  const change = M.nextSeasonChange(today);
  const list = M.pricingCars();
  const selfDrive = cars.filter((c) => !c.rates.onRequest);
  const ladder = M.ladderRows();
  const offersNow = M.validOffers(today);
  const km = commonKmPerDay();
  const aed = (amount: number) => formatAED(amount, locale);
  const facts = P.facts({ dailyFrom: lowestFrom(selfDrive, today), season, depositFrom: Math.min(...cars.map((c) => c.rates.deposit)), km });
  const pageLd = P.inLanguage ? [{ "@type": "WebPage", name: P.hero.title, url: absoluteUrl(href("/pricing")), description: P.hero.lede.join(" "), inLanguage: P.inLanguage }] : [];

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: P.crumbs.home, path: href("/") }, { name: P.crumbs.page }]), ...pageLd)} />

      <ContentHero
        eyebrow={P.hero.eyebrow(factsUpdated)}
        num="01"
        title={P.hero.title}
        lede={<>{P.hero.lede.map((p) => <p key={p}>{p}</p>)}</>}
        actions={
          <nav aria-label={P.jumpLabel} className="flex flex-wrap gap-2">
            {P.jump.map((j) => (
              <a key={j.id} href={`#${j.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted no-underline transition-colors hover:border-accent hover:text-fg">
                {j.label}
              </a>
            ))}
          </nav>
        }
        aside={<KeyFacts label={facts.label} items={facts.items} />}
      />

      <Section
        id="rates"
        num="02"
        eyebrow={P.rates.eyebrow}
        title={P.rates.title}
        intro={
          <>
            <p>
              <Inline text={P.rates.intro(today, season, change)} href={href} />
            </p>
          </>
        }
      >
        <FactTable
          id="car-rates"
          caption={P.rates.caption}
          captionHidden
          minWidth={1180}
          columns={P.rates.columns.map(([label, note]) => (note ? { label: <>{label}<CellNote>{note}</CellNote></>, short: label, align: "end" as const } : { label }))}
          rows={list.map((car) => {
            const r = car.rates;
            const from = r.onRequest ? <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{P.rates.from}</span> : null;
            return {
              key: car.slug,
              cells: [
                <Link key="n" href={href(carPath(car))} className="no-underline hover:text-accent-hover">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{getBrand(car.brand)?.name}</span>
                  {car.model}
                  <CellNote>{P.rates.carNote(car)}</CellNote>
                </Link>,
                <span key="t" className="font-semibold text-fg">{from}{aed(fromPrice(car, today))}</span>,
                <span key="s">{from}{aed(r.daily)}</span>,
                <span key="p">{from}{aed(r.peakDaily)}</span>,
                r.weekly ? aed(r.weekly) : P.rates.weeklyOnRequest,
                r.monthly ? aed(r.monthly) : P.rates.monthlyNotOffered,
                aed(r.deposit),
                P.rates.km(r.kmPerDay),
                aed(r.extraKm),
                car.chauffeur ? aed(car.chauffeur.hourly) : <NA key="c" label={P.rates.selfDriveOnly} />,
              ],
            };
          })}
          footnote={<Inline text={P.rates.footnote} href={href} />}
        />
        <p className="fine lg:hidden">{P.rates.scrollHint}</p>
      </Section>

      <Section id="seasons" num="03" eyebrow={P.seasons.eyebrow} title={P.seasons.title} intro={<p>{P.seasons.intro}</p>}>
        <FactTable
          id="season-table"
          caption={P.seasons.caption}
          captionHidden
          mode="stack"
          columns={P.seasons.columns.map((label) => ({ label }))}
          rows={M.seasonRows().map((s) => ({
            key: s.season.id,
            highlight: s.season.id === season.id,
            cells: [
              <span key="s">{s.season.name}{s.season.id === season.id && <> <Badge className="ms-2 align-middle">{P.seasons.now}</Badge></>}</span>,
              P.seasons.joinRanges(s.ranges),
              s.rate,
              <span key="n" className="text-muted">{s.notes.join(" ") || P.seasons.nothingExtra}</span>,
            ],
          }))}
        />
      </Section>

      <Section
        id="longer"
        num="04"
        eyebrow={P.longer.eyebrow}
        title={P.longer.title}
        intro={<p>{P.longer.intro(ladder.car)}</p>}
      >
        <FactTable
          id="ladder-table"
          caption={P.longer.caption}
          captionHidden
          mode="stack"
          columns={P.longer.columns.map((label, i) => (i >= 2 ? { label, align: "end" as const } : { label }))}
          rows={ladder.rows.map((r) => ({ key: r.key, cells: [r.length, r.how, r.example, r.perDay] }))}
          footnote={<>{P.longer.footnote}</>}
        />
      </Section>

      <Section id="fees" num="05" eyebrow={P.fees.eyebrow} title={P.fees.title} intro={<p>{P.fees.intro}</p>}>
        <div className="grid gap-8">
          {M.feeGroups().map((g) => (
            <FactTable
              key={g.id}
              id={g.id}
              caption={g.title}
              mode="stack"
              columns={P.fees.columns.map((label, i) => (i === 1 ? { label, align: "end" as const } : { label }))}
              rows={g.rows.map((r) => ({ key: r.key, cells: [r.fee, <span key="a" className="whitespace-nowrap font-semibold text-fg">{r.amount}</span>, <span key="d" className="text-muted">{r.detail}</span>] }))}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          <Inline text={P.fees.note} href={href} />
        </p>
      </Section>

      <Section id="offers" num="06" eyebrow={P.offers.eyebrow} title={P.offers.title} intro={<p>{P.offers.intro}</p>}>
        {offersNow.length ? (
          <div className="grid gap-3">
            {offersNow.map((o) => <OfferNotice key={o.id} id={o.id} today={today} />)}
          </div>
        ) : (
          <p className="text-muted">{P.offers.none}</p>
        )}
        <LastUpdated iso={factsUpdated} extra={<span>{P.offers.vat}</span>} />
      </Section>

      <CtaBand
        title={P.cta.title}
        text={<p>{P.cta.text}</p>}
        actions={
          <>
            <WhatsAppButton text={P.cta.whatsappText}>{P.cta.whatsapp}</WhatsAppButton>
            <ButtonLink href={href("/cars")}>{P.cta.fleet}</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
