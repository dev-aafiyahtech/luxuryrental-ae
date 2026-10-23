import Link from "next/link";
import { ArrowRight, Clock, IdCard, Moon, Plane, Repeat } from "lucide-react";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { zones, getZone } from "@/content/zones";
import { getHref } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { formatAED } from "@/lib/format";
import { deliveryPage as P, zoneFee, areaPages } from "@/content/pages/delivery";
import { extraRules } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, OfferNotice, Section, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { FaqList } from "@/components/content/Faq";
import { DeliveryMap } from "@/components/content/DeliveryMap";
import { JsonLd, breadcrumbLd, faqLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

export async function generateMetadata() {
  return pageMetadata({ title: P.meta.title, description: P.meta.description(), path: "/delivery" });
}

const handoverIcons = [Clock, IdCard, Repeat, Moon];

export default async function DeliveryPage() {
  const [href, today] = await Promise.all([getHref(), getToday()]);
  const faqs = P.faqs();
  const [lede1, lede2] = P.hero.lede();
  const dxb = getZone("dxb")!;
  const dwc = getZone("dwc")!;

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "Delivery" }]), faqLd(faqs))} />

      <ContentHero
        eyebrow={P.hero.eyebrow}
        num="01"
        title={P.hero.title}
        lede={<><p>{lede1}</p><p>{lede2}</p></>}
        actions={
          <>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
            <ButtonLink href={href("/delivery/dubai-airport-dxb")} variant="secondary">Airport handover</ButtonLink>
          </>
        }
        aside={<KeyFacts label="Delivery at a glance" items={P.facts()} />}
      />

      <Section
        id="zones"
        num="02"
        eyebrow="Zones and fees"
        title="Where we deliver, and what it costs"
        intro={<p>Fees are per handover, so a delivery and a collection count as two. All amounts in AED, including {site.vatRate}% VAT.</p>}
      >
        <FactTable
          id="zone-table"
          caption="Delivery and collection fees by zone"
          captionHidden
          mode="stack"
          columns={[
            { label: "Zone" },
            { label: "Areas" },
            { label: "Fee each way", align: "end", className: "md:whitespace-nowrap" },
            { label: "Good to know" },
          ]}
          rows={zones.map((z) => ({
            key: z.slug,
            highlight: z.slug === "dubai",
            cells: [
              z.name,
              <span key="a" className="md:max-w-[22rem] md:inline-block">{z.areas.join(", ")}</span>,
              <span key="f" className="font-semibold text-fg">
                {zoneFee(z.fee)}
                {z.freeFromDays && <CellNote>Free from {z.freeFromDays} days</CellNote>}
              </span>,
              <span key="n" className="text-muted">{z.note ?? (z.chauffeurSurcharge ? `Chauffeur bookings here add ${formatAED(z.chauffeurSurcharge)}.` : "Each way, any rental length.")}</span>,
            ],
          }))}
          footnote={<>Handovers outside {rules.handoverHours.from}–{rules.handoverHours.to} add {formatAED(rules.outOfHoursFee)} each. Airports in Abu Dhabi (AUH) and Sharjah (SHJ) are on request.</>}
        />
        <OfferNotice id="founding-client" today={today}>Bugattis are excluded.</OfferNotice>
      </Section>

      <Section id="base" num="03" eyebrow="Our base" title="Everything starts in Dubai Silicon Oasis">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-center">
          <DeliveryMap id="delivery-map" />
          <div className="grid content-start gap-5">
            {P.base().map((p) => <p key={p} className="text-[16px] leading-relaxed text-champagne">{p}</p>)}
            <Link href={href("/delivery/dubai-silicon-oasis")} className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-hover no-underline">
              Collect from our office <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      <Section
        id="airports"
        num="04"
        eyebrow="Airports"
        title="Meet-and-greet at DXB and DWC"
        intro={<p>We track your flight and meet you in the arrivals hall. Airport parking is included, and the first {rules.airportWaitFreeMinutes} minutes after landing are free.</p>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[dxb, dwc].map((z) => (
            <article key={z.slug} className="card grid content-start gap-4 p-6 md:p-8">
              <Plane className="h-6 w-6 text-accent rtl:-scale-x-100" aria-hidden="true" />
              <h3 className="text-lg font-semibold leading-snug">{z.name}</h3>
              <p className="text-sm text-muted">{z.areas.join(", ")}</p>
              <dl className="spec-list">
                <div><dt>Handover</dt><dd>{zoneFee(z.fee)}</dd></div>
                <div><dt>Free waiting</dt><dd>{rules.airportWaitFreeMinutes} min</dd></div>
                <div><dt>Then</dt><dd>{formatAED(extraRules.airportWaitPerHour)} / started hour</dd></div>
              </dl>
              {z.slug === "dxb" && (
                <Link href={href("/delivery/dubai-airport-dxb")} className="inline-flex min-h-11 items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-hover no-underline">
                  How a DXB handover works <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                </Link>
              )}
            </article>
          ))}
        </div>
      </Section>

      <Section id="handover" num="05" eyebrow="Hours and handover" title={`Handovers ${rules.handoverHours.from}–${rules.handoverHours.to}, every day`}>
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

      <Section id="faq" num="06" eyebrow="Questions" title="Delivery questions">
        <FaqList items={faqs} href={href} />
        <p className="text-sm text-muted">
          More on <Link href={href(`/delivery/${areaPages[0].slug}`)} className="text-fg">airport handovers at DXB</Link> and{" "}
          <Link href={href(`/delivery/${areaPages[1].slug}`)} className="text-fg">collection in Dubai Silicon Oasis</Link>.
        </p>
      </Section>

      <CtaBand
        title="Choose the car, we bring it"
        text={<p>Pick a car and your dates, add the delivery address or flight number, and send the request. The delivery fee is in the quote before you send it.</p>}
        actions={
          <>
            <WhatsAppButton text={`Hello ${site.businessName}, I have a question about delivery.`}>Ask on WhatsApp</WhatsAppButton>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
