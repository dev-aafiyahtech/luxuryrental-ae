import Link from "next/link";
import { Check } from "lucide-react";
import { rules } from "@/content/rules";
import { carPath } from "@/content/cars";
import { chauffeurIncluded } from "@/content/localize";
import { getHref, getLocale } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { formatAED } from "@/lib/format";
import { chauffeurPage as chauffeurEn } from "@/content/pages/chauffeur";
import { chauffeurPage as chauffeurAr } from "@/content/pages/ar/chauffeur";
import { contentUiFor } from "@/content/pages/ui";
import { chauffeurFleet, chauffeurFromAirport, chauffeurFromHourly } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, OfferNotice, Section, Steps, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { FaqList } from "@/components/content/Faq";
import { ChauffeurCarCard } from "@/components/content/ChauffeurCarCard";
import { JsonLd, absoluteUrl, breadcrumbLd, businessRef, faqLd, graph, langLd } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";

const pageFor = (locale: string) => (locale === "ar" ? chauffeurAr : chauffeurEn);

export async function generateMetadata() {
  const P = pageFor(await getLocale());
  return pageMetadata({ title: P.meta.title, description: P.meta.description(), path: "/chauffeur" });
}

export default async function ChauffeurPage() {
  const [href, today, locale] = await Promise.all([getHref(), getToday(), getLocale()]);
  const P = pageFor(locale);
  const U = contentUiFor(locale);
  const ui = P.ui;
  const aed = (amount: number) => formatAED(amount, locale);
  const fleet = chauffeurFleet();
  const c = rules.chauffeur;
  const faqs = P.faqs();
  const [lede1, lede2] = P.hero.lede();

  const serviceLd = {
    "@type": "Service",
    "@id": `${absoluteUrl(href("/chauffeur"))}#service`,
    name: P.hero.title,
    serviceType: ui.serviceType,
    provider: businessRef,
    areaServed: { "@type": "City", name: ui.city },
    url: absoluteUrl(href("/chauffeur")),
    ...langLd(locale),
    offers: fleet.map((car) => ({
      "@type": "Offer",
      name: ui.offerName(car.name),
      price: car.chauffeur!.hourly,
      priceCurrency: "AED",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: car.chauffeur!.hourly,
        priceCurrency: "AED",
        unitCode: "HUR",
        valueAddedTaxIncluded: true,
        eligibleQuantity: { "@type": "QuantitativeValue", minValue: c.minHours, unitCode: "HUR" },
      },
    })),
  };

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: U.home, path: href("/") }, { name: ui.crumb }]), serviceLd, faqLd(faqs, langLd(locale).inLanguage))} />

      <ContentHero
        eyebrow={P.hero.eyebrow}
        num="01"
        title={P.hero.title}
        lede={<><p>{lede1}</p><p>{lede2}</p></>}
        actions={
          <>
            <ButtonLink href="#cars">{ui.chooseCar}</ButtonLink>
            <WhatsAppButton text={ui.whatsappText}>{U.askWhatsApp}</WhatsAppButton>
          </>
        }
        aside={<KeyFacts label={ui.factsLabel} items={ui.facts(chauffeurFromHourly(), chauffeurFromAirport())} />}
      />

      <Section id="how" num="02" eyebrow={ui.howEyebrow} title={ui.howTitle}>
        <Steps label={ui.stepsLabel} steps={P.steps.map((s) => ({ title: s.title, text: s.text() }))} />
      </Section>

      <Section id="rates" num="03" eyebrow={ui.ratesEyebrow} title={ui.ratesTitle} intro={<p>{ui.ratesIntro()}</p>}>
        <FactTable
          id="chauffeur-rates"
          caption={ui.tableCaption}
          captionHidden
          minWidth={820}
          columns={[
            { label: ui.col.car },
            { label: <>{ui.col.perHour}<CellNote>{ui.col.perHourNote}</CellNote></>, short: ui.col.perHour, align: "end" },
            { label: <>{ui.col.halfDay}<CellNote>{ui.col.halfDayNote}</CellNote></>, short: ui.col.halfDay, align: "end" },
            { label: <>{ui.col.fullDay}<CellNote>{ui.col.fullDayNote}</CellNote></>, short: ui.col.fullDay, align: "end" },
            { label: <>{ui.col.airport}<CellNote>{ui.col.airportNote}</CellNote></>, short: ui.col.airport, align: "end" },
            { label: <>{ui.col.extra}<CellNote>{ui.col.extraNote}</CellNote></>, short: ui.col.extra, align: "end" },
          ]}
          rows={fleet.map((car) => ({
            key: car.slug,
            cells: [
              <Link key="n" href={href(carPath(car))} className="no-underline hover:text-accent-hover">{car.name}<CellNote>{ui.seats(car.specs.seats)}</CellNote></Link>,
              aed(car.chauffeur!.hourly),
              aed(car.chauffeur!.halfDay),
              aed(car.chauffeur!.fullDay),
              aed(car.chauffeur!.airport),
              aed(car.chauffeur!.overtime),
            ],
          }))}
          footnote={ui.tableFootnote()}
        />
        <OfferNotice id="chauffeur-intro" today={today}>{ui.offerNote}</OfferNotice>
      </Section>

      <Section id="included" num="04" eyebrow={ui.includedEyebrow} title={ui.includedTitle}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card grid content-start gap-5 p-6 md:p-8">
            <h3 className={h3Class}>{ui.inEvery}</h3>
            <p className="text-lg leading-relaxed text-fg">{chauffeurIncluded(locale)}</p>
            <ul className="grid gap-3 border-t border-line p-0 pt-5 [list-style:none]">
              {P.goodToKnow().map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-champagne">
                  <Check className="mt-1 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card grid content-start gap-5 p-6 md:p-8">
            <h3 className={h3Class}>{ui.surchargesTitle}</h3>
            <dl className="spec-list">
              {P.surcharges().map((s) => (
                <div key={s.label}>
                  <dt className="max-w-[60%] !normal-case !tracking-normal !text-[14px] !font-medium !text-champagne">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="fine leading-relaxed">{ui.surchargesNote}</p>
          </div>
        </div>
      </Section>

      <Section id="cars" num="05" eyebrow={ui.carsEyebrow} title={ui.carsTitle} intro={<p>{ui.carsIntro}</p>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fleet.map((car) => <ChauffeurCarCard key={car.slug} car={car} href={href} />)}
        </div>
        <p className="fine">{ui.imagesNote}</p>
      </Section>

      <Section id="faq" num="06" eyebrow={U.questions} title={ui.faqTitle}>
        <FaqList items={faqs} href={href} />
      </Section>

      <CtaBand
        title={ui.ctaTitle}
        text={<p>{ui.ctaText}</p>}
        actions={
          <>
            <WhatsAppButton text={ui.whatsappText}>{U.messageWhatsApp}</WhatsAppButton>
            <ButtonLink href={href(`/book/trip?car=${fleet[0].slug}&service=chauffeur`)}>{ui.request}</ButtonLink>
          </>
        }
      />
    </>
  );
}
