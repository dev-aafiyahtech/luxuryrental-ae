import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { site } from "@/content/site";
import { getZone } from "@/content/zones";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { areaPages, deliveryPage as deliveryEn, getAreaPage as getAreaEn } from "@/content/pages/delivery";
import { deliveryPage as deliveryAr, getAreaPage as getAreaAr, areaPages as areaPagesAr } from "@/content/pages/ar/delivery";
import { contentUiFor } from "@/content/pages/ui";
import { ContentHero, CtaBand, KeyFacts, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FaqList } from "@/components/content/Faq";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { Rich } from "@/components/content/Rich";
import { JsonLd, breadcrumbLd, faqLd, graph, langLd } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { Breadcrumbs, ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

const areaFor = (locale: string, slug: string) => (locale === "ar" ? getAreaAr(slug) : getAreaEn(slug));

export async function generateStaticParams() {
  return areaPages.map((a) => ({ area: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/delivery/[area]">) {
  const page = areaFor(await getLocale(), (await params).area);
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
  const [{ area }, locale, href] = await Promise.all([params, getLocale(), getHref()]);
  const page = areaFor(locale, area);
  if (!page) notFound();
  const D = locale === "ar" ? deliveryAr : deliveryEn;
  const U = contentUiFor(locale);
  const faqs = page.faqs();
  const zone = getZone(page.zone)!;
  const isAirport = zone.kind === "airport";
  const other = (locale === "ar" ? areaPagesAr : areaPages).find((a) => a.slug !== page.slug)!;
  const crumbs = [
    { label: U.home, href: href("/") },
    { label: D.ui.crumb, href: href("/delivery") },
    { label: page.name },
  ];

  return (
    <>
      <JsonLd data={graph(breadcrumbLd(crumbs.map((c) => ({ name: c.label, path: c.href }))), faqLd(faqs, langLd(locale).inLanguage))} />

      <ContentHero
        top={<Breadcrumbs items={crumbs} />}
        eyebrow={page.eyebrow}
        num="01"
        title={page.title}
        lede={<>{page.lede().map((p) => <p key={p}>{p}</p>)}</>}
        actions={
          <>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
            <WhatsAppButton text={page.whatsappText}>{U.askWhatsApp}</WhatsAppButton>
          </>
        }
        aside={<KeyFacts label={D.ui.glance(page.name)} items={page.facts()} />}
      />

      <Section id="how" num="02" eyebrow={page.howEyebrow} title={page.howTitle}>
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

      {isAirport && page.terminals ? (
        <Section id="terminals" num="03" eyebrow={page.terminals.eyebrow} title={page.terminals.title} intro={<p>{page.terminals.intro}</p>}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line p-0 [list-style:none]">
              {page.terminals.rows.map((row) => (
                <li key={row.t} className="flex items-center justify-between gap-4 bg-card px-5 py-4">
                  <span className="font-semibold">{row.t}</span>
                  <span className="text-end text-sm text-muted">{row.a}</span>
                </li>
              ))}
            </ul>
            <DeliveryMap id="dxb-map" focus="dxb" />
          </div>
        </Section>
      ) : page.location ? (
        <Section id="location" num="03" eyebrow={page.location.eyebrow} title={page.location.title}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
            <div className="card grid content-start gap-5 p-6 md:p-8">
              <MapPin className="h-6 w-6 text-accent" aria-hidden="true" />
              <h3 className={h3Class}>{site.businessName}</h3>
              <address className="not-italic text-lg leading-relaxed text-fg">
                {page.location.address().map((line, i, all) => (
                  <span key={line}>{line}{i < all.length - 1 && <br />}</span>
                ))}
              </address>
              <dl className="spec-list">
                {page.location.rows().map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
              </dl>
              <p className="fine">{page.location.directions()}</p>
              <a href={site.address.mapUrl} target="_blank" rel="noopener" className="btn btn-secondary btn-sm w-fit">{page.location.openMaps}</a>
            </div>
            <DeliveryMap id="dso-map" focus="dso" />
          </div>
        </Section>
      ) : null}

      <Section id="faq" num="04" eyebrow={U.questions} title={page.faqTitle}>
        <FaqList items={faqs} href={href} />
        <p className="text-sm text-muted">
          <Rich text={D.ui.seeAlso(other.name, other.slug)} href={href} linkClassName="text-fg" />
        </p>
      </Section>

      <CtaBand
        title={page.cta.title}
        text={<p>{page.cta.text}</p>}
        actions={
          <>
            <ButtonLink href={href("/delivery")} variant="secondary">{D.ui.allZones} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /></ButtonLink>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
