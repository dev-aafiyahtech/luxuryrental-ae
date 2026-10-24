import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { getHref } from "@/i18n/dictionaries";
import { areaPages, getAreaPage } from "@/content/pages/delivery";
import { ContentHero, CtaBand, KeyFacts, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FaqList } from "@/components/content/Faq";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { JsonLd, breadcrumbLd, faqLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { Breadcrumbs, ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

export async function generateStaticParams() {
  return areaPages.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/delivery/[area]">) {
  const page = getAreaPage((await params).area);
  if (!page) return {};
  return pageMetadata({ title: page.meta.title, description: page.meta.description(), path: `/delivery/${page.slug}` });
}

// `params` is read inside <Suspense> so the route shell stays instant (Next 16 validation).
// Every area is listed in generateStaticParams, so the content is prerendered too.
export default function AreaPage({ params }: PageProps<"/[lang]/delivery/[area]">) {
  return (
    <Suspense fallback={<div className="container-site min-h-[80vh] pt-16" aria-busy="true" />}>
      <AreaContent params={params} />
    </Suspense>
  );
}

async function AreaContent({ params }: { params: PageProps<"/[lang]/delivery/[area]">["params"] }) {
  const page = getAreaPage((await params).area);
  if (!page) notFound();
  const href = await getHref();
  const faqs = page.faqs();
  const zone = getZone(page.zone)!;
  const isAirport = zone.kind === "airport";
  const other = areaPages.find((a) => a.slug !== page.slug)!;
  const crumbs = [
    { label: "Home", href: href("/") },
    { label: "Delivery", href: href("/delivery") },
    { label: page.name },
  ];

  return (
    <>
      <JsonLd data={graph(breadcrumbLd(crumbs.map((c) => ({ name: c.label, path: c.href }))), faqLd(faqs))} />

      <ContentHero
        top={<Breadcrumbs items={crumbs} />}
        eyebrow={page.eyebrow}
        num="01"
        title={page.title}
        lede={<>{page.lede().map((p) => <p key={p}>{p}</p>)}</>}
        actions={
          <>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
            <WhatsAppButton text={`Hello ${site.businessName}, I have a question about ${isAirport ? "an airport handover at DXB" : "collecting a car in Dubai Silicon Oasis"}.`}>Ask on WhatsApp</WhatsAppButton>
          </>
        }
        aside={<KeyFacts label={`${page.name} at a glance`} items={page.facts()} />}
      />

      <Section id="how" num="02" eyebrow={isAirport ? "The handover" : "Collection"} title={isAirport ? "From the plane to the driver's seat" : "How office collection works"}>
        <ol className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line p-0 [list-style:none] md:grid-cols-2 lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr">
          {page.steps.map((s, i) => (
            <li key={s.title} className="grid content-start gap-3 bg-card p-6">
              <span aria-hidden="true" className="font-display text-2xl font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[16px] font-semibold leading-snug">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{s.text()}</p>
            </li>
          ))}
        </ol>
      </Section>

      {isAirport ? (
        <Section
          id="terminals"
          num="03"
          eyebrow="Terminals"
          title="Which terminal, and where we meet"
          intro={<p>Your ticket or the airline&apos;s app shows the terminal. Add it to your request and we meet you in that terminal&apos;s arrivals hall.</p>}
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line p-0 [list-style:none]">
              {[
                { t: "Terminal 1", a: "Most international airlines" },
                { t: "Terminal 2", a: "flydubai and some regional airlines" },
                { t: "Terminal 3", a: "Emirates, and some flydubai flights" },
              ].map((row) => (
                <li key={row.t} className="flex items-center justify-between gap-4 bg-card px-5 py-4">
                  <span className="font-semibold">{row.t}</span>
                  <span className="text-end text-sm text-muted">{row.a}</span>
                </li>
              ))}
            </ul>
            <DeliveryMap id="dxb-map" focus="dxb" />
          </div>
        </Section>
      ) : (
        <Section id="location" num="03" eyebrow="Location" title="Find the office">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
            <div className="card grid content-start gap-5 p-6 md:p-8">
              <MapPin className="h-6 w-6 text-accent" aria-hidden="true" />
              <h3 className={h3Class}>{site.businessName}</h3>
              <address className="not-italic text-lg leading-relaxed text-fg">
                {site.address.line1}<br />
                {site.address.area}<br />
                {site.address.city}, {site.address.country}
              </address>
              <dl className="spec-list">
                <div><dt>Open</dt><dd>{site.hours}</dd></div>
                <div><dt>Roads</dt><dd>E66 Dubai–Al Ain Rd, E311</dd></div>
                <div><dt>Parking</dt><dd>Free visitor parking in front of the building</dd></div>
              </dl>
              <p className="fine">{site.address.directions}</p>
              <a href={site.address.mapUrl} target="_blank" rel="noopener" className="btn btn-secondary btn-sm w-fit">Open in Google Maps</a>
            </div>
            <DeliveryMap id="dso-map" focus="dso" />
          </div>
        </Section>
      )}

      <Section id="faq" num="04" eyebrow="Questions" title={isAirport ? "DXB questions" : "Collection questions"}>
        <FaqList items={faqs} href={href} />
        <p className="text-sm text-muted">
          All zones and fees are on our <Link href={href("/delivery")} className="text-fg">delivery page</Link>. See also{" "}
          <Link href={href(`/delivery/${other.slug}`)} className="text-fg">{other.name}</Link>.
        </p>
      </Section>

      <CtaBand
        title={isAirport ? "Land and drive" : "Collect when it suits you"}
        text={<p>{isAirport ? "Choose a car, pick DXB as the handover place and add your flight number. The airport fee is in the quote before you send the request." : "Choose a car, pick collection at Dubai Silicon Oasis and set a time. We confirm the slot on WhatsApp."}</p>}
        actions={
          <>
            <ButtonLink href={href("/delivery")} variant="secondary">All delivery zones <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /></ButtonLink>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
