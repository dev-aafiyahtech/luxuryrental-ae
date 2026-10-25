import Link from "next/link";
import { ArrowRight, Clock, IdCard, Moon, Plane, Repeat } from "lucide-react";
import { zones, getZone } from "@/content/zones";
import { localizeZone } from "@/content/localize";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { deliveryPage as deliveryEn, areaPages } from "@/content/pages/delivery";
import { deliveryPage as deliveryAr } from "@/content/pages/ar/delivery";
import { contentUiFor } from "@/content/pages/ui";
import { ContentHero, CtaBand, KeyFacts, OfferNotice, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { FaqList } from "@/components/content/Faq";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { Rich } from "@/components/content/Rich";
import { JsonLd, breadcrumbLd, faqLd, graph, langLd } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

const pageFor = (locale: string) => (locale === "ar" ? deliveryAr : deliveryEn);

export async function generateMetadata() {
  const P = pageFor(await getLocale());
  return pageMetadata({ title: P.meta.title, description: P.meta.description(), path: "/delivery" });
}

const handoverIcons = [Clock, IdCard, Repeat, Moon];

export default async function DeliveryPage() {
  const [href, today, locale] = await Promise.all([getHref(), getToday(), getLocale()]);
  const P = pageFor(locale);
  const U = contentUiFor(locale);
  const ui = P.ui;
  const faqs = P.faqs();
  const [lede1, lede2] = P.hero.lede();
  const dxb = localizeZone(getZone("dxb")!, locale);
  const dwc = localizeZone(getZone("dwc")!, locale);
  const list = locale === "ar" ? "، " : ", ";

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: U.home, path: href("/") }, { name: ui.crumb }]), faqLd(faqs, langLd(locale).inLanguage))} />

      <ContentHero
        eyebrow={P.hero.eyebrow}
        num="01"
        title={P.hero.title}
        lede={<><p>{lede1}</p><p>{lede2}</p></>}
        actions={
          <>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
            <ButtonLink href={href("/delivery/dubai-airport-dxb")} variant="secondary">{ui.airportHandover}</ButtonLink>
          </>
        }
        aside={<KeyFacts label={ui.factsLabel} items={P.facts()} />}
      />

      <Section id="zones" num="02" eyebrow={ui.zonesEyebrow} title={ui.zonesTitle} intro={<p>{ui.zonesIntro()}</p>}>
        <FactTable
          id="zone-table"
          caption={ui.zonesCaption}
          captionHidden
          mode="stack"
          columns={[
            { label: ui.col.zone },
            { label: ui.col.areas },
            { label: ui.col.fee, align: "end", className: "md:whitespace-nowrap" },
            { label: ui.col.note },
          ]}
          rows={zones.map((zone) => {
            const z = localizeZone(zone, locale);
            return {
              key: z.slug,
              highlight: z.slug === "dubai",
              cells: [
                z.name,
                <span key="a" className="md:max-w-[22rem] md:inline-block">{z.areas.join(list)}</span>,
                <span key="f" className="font-semibold text-fg">
                  {P.zoneFee(z.fee)}
                  {z.freeFromDays && <CellNote>{ui.freeFrom(z.freeFromDays)}</CellNote>}
                </span>,
                <span key="n" className="text-muted">{z.note ?? (z.chauffeurSurcharge ? ui.chauffeurAdds(z.chauffeurSurcharge) : ui.anyLength)}</span>,
              ],
            };
          })}
          footnote={ui.zonesFootnote()}
        />
        <OfferNotice id="founding-client" today={today}>{ui.offerNote}</OfferNotice>
      </Section>

      <Section id="base" num="03" eyebrow={ui.baseEyebrow} title={ui.baseTitle}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center">
          <DeliveryMap id="delivery-map" />
          <div className="grid content-start gap-5">
            {P.base().map((p) => <p key={p} className="text-[16px] leading-relaxed text-champagne">{p}</p>)}
            <Link href={href("/delivery/dubai-silicon-oasis")} className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-hover no-underline">
              {ui.collectLink} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      <Section id="airports" num="04" eyebrow={ui.airportsEyebrow} title={ui.airportsTitle} intro={<p>{ui.airportsIntro()}</p>}>
        <div className="grid gap-4 md:grid-cols-2">
          {[dxb, dwc].map((z) => (
            <article key={z.slug} className="card grid content-start gap-4 p-6 md:p-8">
              <Plane className="h-6 w-6 text-accent rtl:-scale-x-100" aria-hidden="true" />
              <h3 className="text-lg font-semibold leading-snug">{z.name}</h3>
              <p className="text-sm text-muted">{z.areas.join(list)}</p>
              <dl className="spec-list">
                <div><dt>{ui.airportHandoverLabel}</dt><dd>{P.zoneFee(z.fee)}</dd></div>
                <div><dt>{ui.freeWaiting}</dt><dd>{ui.freeWaitingValue()}</dd></div>
                <div><dt>{ui.then}</dt><dd>{ui.perStartedHour()}</dd></div>
              </dl>
              {z.slug === "dxb" && (
                <Link href={href("/delivery/dubai-airport-dxb")} className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-hover no-underline">
                  {ui.dxbLink} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </Section>

      <Section id="handover" num="05" eyebrow={ui.handoverEyebrow} title={ui.handoverTitle()}>
        <ul className="grid gap-4 p-0 [list-style:none] sm:grid-cols-2 lg:grid-cols-4">
          {P.handover().map((h, i) => {
            const Icon = handoverIcons[i];
            return (
              <li key={h.title} className="card grid content-start gap-3 p-6">
                <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                <h3 className={h3Class}>{h.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted">{h.text}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section id="faq" num="06" eyebrow={U.questions} title={ui.faqTitle}>
        <FaqList items={faqs} href={href} />
        <p className="text-sm text-muted">
          <Rich text={ui.more(areaPages[0].slug, areaPages[1].slug)} href={href} linkClassName="text-fg" />
        </p>
      </Section>

      <CtaBand
        title={ui.ctaTitle}
        text={<p>{ui.ctaText}</p>}
        actions={
          <>
            <WhatsAppButton text={ui.whatsappText}>{U.askWhatsApp}</WhatsAppButton>
            <ButtonLink href={href("/cars")}>{U.browseFleet}</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
