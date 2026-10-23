import Link from "next/link";
import { Check } from "lucide-react";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { carPath } from "@/content/cars";
import { getHref } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { formatAED } from "@/lib/format";
import { chauffeurPage as P } from "@/content/pages/chauffeur";
import { chauffeurFleet, chauffeurFromAirport, chauffeurFromHourly, extraRules } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, OfferNotice, Section, Steps, WhatsAppButton, h3Class } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { FaqList } from "@/components/content/Faq";
import { ChauffeurCarCard } from "@/components/content/ChauffeurCarCard";
import { JsonLd, absoluteUrl, breadcrumbLd, businessRef, faqLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { ButtonLink } from "@/components/ui";

export async function generateMetadata() {
  return pageMetadata({ title: P.meta.title, description: P.meta.description(), path: "/chauffeur" });
}

export default async function ChauffeurPage() {
  const [href, today] = await Promise.all([getHref(), getToday()]);
  const fleet = chauffeurFleet();
  const c = rules.chauffeur;
  const faqs = P.faqs();
  const [lede1, lede2] = P.hero.lede();

  const serviceLd = {
    "@type": "Service",
    "@id": `${absoluteUrl(href("/chauffeur"))}#service`,
    name: P.hero.title,
    serviceType: "Chauffeur-driven luxury car hire",
    provider: businessRef,
    areaServed: { "@type": "City", name: "Dubai" },
    url: absoluteUrl(href("/chauffeur")),
    offers: fleet.map((car) => ({
      "@type": "Offer",
      name: `${car.name} with chauffeur`,
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
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "Chauffeur service" }]), serviceLd, faqLd(faqs))} />

      <ContentHero
        eyebrow={P.hero.eyebrow}
        num="01"
        title={P.hero.title}
        lede={<><p>{lede1}</p><p>{lede2}</p></>}
        actions={
          <>
            <ButtonLink href="#cars">Choose your car</ButtonLink>
            <WhatsAppButton text={`Hello ${site.businessName}, I'd like to book a chauffeur.`}>Ask on WhatsApp</WhatsAppButton>
          </>
        }
        aside={
          <KeyFacts
            label="Chauffeur service at a glance"
            items={[
              { label: "From", value: `${formatAED(chauffeurFromHourly())} / hour`, note: `${c.minHours}-hour minimum` },
              { label: "Airport transfer", value: `From ${formatAED(chauffeurFromAirport())}`, note: "DXB or DWC, one way within Dubai" },
              { label: "Notice", value: `${c.leadHours} hours`, note: "Sooner? Ask on WhatsApp" },
              { label: "Passengers", value: `Up to ${extraRules.chauffeurMaxPassengers}`, note: "Child seats free on request" },
            ]}
          />
        }
      />

      <Section id="how" num="02" eyebrow="How it works" title="Three steps to the back seat">
        <Steps label="How chauffeur booking works" steps={P.steps.map((s) => ({ title: s.title, text: s.text() }))} />
      </Section>

      <Section
        id="rates"
        num="03"
        eyebrow="Rates"
        title="Chauffeur rates"
        intro={<p>Fixed prices in AED, including {site.vatRate}% VAT, for journeys within Dubai. Hourly bookings run from {c.minHours} to {c.maxHours} hours.</p>}
      >
        <FactTable
          id="chauffeur-rates"
          caption="Chauffeur rates by car"
          captionHidden
          minWidth={820}
          columns={[
            { label: "Car" },
            { label: <>Per hour<CellNote>{c.minHours} h minimum</CellNote></>, short: "Per hour", align: "end" },
            { label: <>Half day<CellNote>{c.halfDayHours} hours</CellNote></>, short: "Half day", align: "end" },
            { label: <>Full day<CellNote>{c.fullDayHours} hours</CellNote></>, short: "Full day", align: "end" },
            { label: <>Airport transfer<CellNote>One way</CellNote></>, short: "Airport transfer", align: "end" },
            { label: <>Extra hour<CellNote>Per started 30 min</CellNote></>, short: "Extra hour", align: "end" },
          ]}
          rows={fleet.map((car) => ({
            key: car.slug,
            cells: [
              <Link key="n" href={href(carPath(car))} className="no-underline hover:text-accent-hover">{car.name}<CellNote>{car.specs.seats} seats</CellNote></Link>,
              formatAED(car.chauffeur!.hourly),
              formatAED(car.chauffeur!.halfDay),
              formatAED(car.chauffeur!.fullDay),
              formatAED(car.chauffeur!.airport),
              formatAED(car.chauffeur!.overtime),
            ],
          }))}
          footnote={<>Airport transfers run between DXB or DWC and anywhere in Dubai, with {rules.airportWaitFreeMinutes} minutes&apos; free waiting after landing. Surcharges for night starts, the festive peak and other emirates are listed below.</>}
        />
        <OfferNotice id="chauffeur-intro" today={today}>
          It applies to half-day and full-day bookings outside the festive peak, and the free hour is taken off at the car&apos;s hourly rate.
        </OfferNotice>
      </Section>

      <Section id="included" num="04" eyebrow="What you get" title="Included, and what costs extra">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card grid content-start gap-5 p-6 md:p-8">
            <h3 className={h3Class}>In every booking</h3>
            <p className="text-lg leading-relaxed text-fg">{c.included}</p>
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
            <h3 className={h3Class}>Surcharges</h3>
            <dl className="spec-list">
              {P.surcharges().map((s) => (
                <div key={s.label}>
                  <dt className="max-w-[60%] !normal-case !tracking-normal !text-[14px] !font-medium !text-champagne">{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="fine leading-relaxed">Percentage surcharges apply to the booking price. Outside-Dubai surcharges apply to bookings that start in that area.</p>
          </div>
        </div>
      </Section>

      <Section id="cars" num="05" eyebrow="The cars" title="Choose your car" intro={<p>The Phantom is offered with a chauffeur first. The Cullinan and the Bentayga can also be rented self-drive from the fleet pages.</p>}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fleet.map((car) => <ChauffeurCarCard key={car.slug} car={car} href={href} />)}
        </div>
        <p className="fine">Car images are illustrations until photos of our own cars are ready.</p>
      </Section>

      <Section id="faq" num="06" eyebrow="Questions" title="Chauffeur questions">
        <FaqList items={faqs} href={href} />
      </Section>

      <CtaBand
        title="Plan the day with us"
        text={<p>Send us the date, the pickup point and where you need to be. We suggest the car and the package, and confirm the price on WhatsApp.</p>}
        actions={
          <>
            <WhatsAppButton text={`Hello ${site.businessName}, I'd like to book a chauffeur.`}>Message us on WhatsApp</WhatsAppButton>
            <ButtonLink href={href(`/book/trip?car=${fleet[0].slug}&service=chauffeur`)}>Request a chauffeur</ButtonLink>
          </>
        }
      />
    </>
  );
}
