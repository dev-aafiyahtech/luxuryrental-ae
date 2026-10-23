import Link from "next/link";
import { carPath, cars } from "@/content/cars";
import { getBrand } from "@/content/brands";
import { rules, seasonFor } from "@/content/rules";
import { site } from "@/content/site";
import { getHref } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { fromPrice, lowestFrom } from "@/lib/pricing";
import { formatDayLong } from "@/lib/dates";
import { formatAED, formatNumber } from "@/lib/format";
import { feeGroups, ladderRows, nextSeasonChange, pricingCars, pricingMeta, seasonRows, validOffers, dayMonth } from "@/content/pages/pricing";
import { commonKmPerDay, factsUpdated, monthStamp, tierName } from "@/content/pages/shared";
import { ContentHero, CtaBand, KeyFacts, LastUpdated, OfferNotice, Section, WhatsAppButton } from "@/components/content/blocks";
import { FactTable, CellNote } from "@/components/content/FactTable";
import { JsonLd, breadcrumbLd, graph } from "@/components/content/JsonLd";
import { pageMetadata } from "@/components/content/meta";
import { Badge, ButtonLink } from "@/components/ui";
import { Dock } from "@/components/booking/Dock";

export async function generateMetadata() {
  return pageMetadata({ title: pricingMeta.title(monthStamp(factsUpdated)), description: pricingMeta.description, path: "/pricing" });
}

const NA = ({ label }: { label: string }) => (
  <span className="text-muted">
    <span aria-hidden="true">–</span>
    <span className="sr-only">{label}</span>
  </span>
);

export default async function PricingPage() {
  const [href, today] = await Promise.all([getHref(), getToday()]);
  const season = seasonFor(today);
  const change = nextSeasonChange(today);
  const list = pricingCars();
  const selfDrive = cars.filter((c) => !c.rates.onRequest);
  const ladder = ladderRows();
  const offersNow = validOffers(today);
  const km = commonKmPerDay();
  const jump = [
    { id: "rates", label: "Car rates" },
    { id: "seasons", label: "Seasons" },
    { id: "longer", label: "Longer rentals" },
    { id: "fees", label: "Fees" },
    { id: "offers", label: "Offers" },
  ];

  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Home", path: href("/") }, { name: "Pricing" }]))} />

      <ContentHero
        eyebrow={`Pricing · Updated ${monthStamp(factsUpdated)}`}
        num="01"
        title="Luxury car rental prices"
        lede={
          <>
            <p>Every rate, deposit and fee for all {cars.length} cars on one page.</p>
            <p>Prices are in AED and include {site.vatRate}% VAT. The deposit is a refundable hold on your card, shown separately.</p>
          </>
        }
        actions={
          <nav aria-label="On this page" className="flex flex-wrap gap-2">
            {jump.map((j) => (
              <a key={j.id} href={`#${j.id}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted no-underline transition-colors hover:border-accent hover:text-fg">
                {j.label}
              </a>
            ))}
          </nav>
        }
        aside={
          <KeyFacts
            label="Prices at a glance"
            items={[
              { label: "Daily rates from", value: formatAED(lowestFrom(selfDrive, today)), note: `${season.name} season` },
              { label: "Deposits from", value: formatAED(Math.min(...cars.map((c) => c.rates.deposit))), note: "Refundable card hold" },
              { label: "Included", value: `${km} km / day`, note: "On most cars" },
              { label: "VAT", value: `${site.vatRate}% included`, note: "In every price shown" },
            ]}
          />
        }
      />

      <Section
        id="rates"
        num="02"
        eyebrow="Car rates"
        title="Rates for every car"
        intro={
          <>
            <p>
              Today, {formatDayLong(today)}, is in the <strong className="text-fg">{season.name.toLowerCase()}</strong> season
              {change ? <>; the {change.season.name.toLowerCase()} season starts on {dayMonth(change.date)}</> : null}. The &ldquo;Today&rdquo; column shows the daily rate for a pickup today.
            </p>
          </>
        }
      >
        <FactTable
          id="car-rates"
          caption={`Daily, 7-day and 30-day rates, deposit and mileage for all ${cars.length} cars`}
          captionHidden
          minWidth={1180}
          columns={[
            { label: "Car" },
            { label: <>Today<CellNote>Per day</CellNote></>, short: "Today", align: "end" },
            { label: <>Standard<CellNote>Per day</CellNote></>, short: "Standard", align: "end" },
            { label: <>Peak<CellNote>Per day</CellNote></>, short: "Peak", align: "end" },
            { label: <>7 days<CellNote>Total</CellNote></>, short: "7 days", align: "end" },
            { label: <>30 days<CellNote>Total</CellNote></>, short: "30 days", align: "end" },
            { label: <>Deposit<CellNote>Card hold</CellNote></>, short: "Deposit", align: "end" },
            { label: <>Included<CellNote>Per day</CellNote></>, short: "Included", align: "end" },
            { label: <>Extra km<CellNote>Per km</CellNote></>, short: "Extra km", align: "end" },
            { label: <>Chauffeur<CellNote>From / hour</CellNote></>, short: "Chauffeur", align: "end" },
          ]}
          rows={list.map((car) => {
            const r = car.rates;
            const from = r.onRequest ? <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">From</span> : null;
            return {
              key: car.slug,
              cells: [
                <Link key="n" href={href(carPath(car))} className="no-underline hover:text-accent-hover">
                  <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{getBrand(car.brand)?.name}</span>
                  {car.model}
                  <CellNote>{tierName(car.tier)}{car.chauffeurFirst ? " · chauffeur first" : ""}{r.onRequest ? " · on request" : ""}</CellNote>
                </Link>,
                <span key="t" className="font-semibold text-fg">{from}{formatAED(fromPrice(car, today))}</span>,
                <span key="s">{from}{formatAED(r.daily)}</span>,
                <span key="p">{from}{formatAED(r.peakDaily)}</span>,
                r.weekly ? formatAED(r.weekly) : "On request",
                r.monthly ? formatAED(r.monthly) : "Not offered",
                formatAED(r.deposit),
                `${formatNumber(r.kmPerDay)} km`,
                formatAED(r.extraKm),
                car.chauffeur ? formatAED(car.chauffeur.hourly) : <NA key="c" label="Self-drive only" />,
              ],
            };
          })}
          footnote={
            <>
              All prices in AED including {site.vatRate}% VAT. Standard rates apply in spring and autumn, peak rates from November to March; summer and the festive peak are worked out from the standard rate (see seasons below). Bugatti prices are where quotes start; we confirm the final price on WhatsApp. The 30-day rate includes {formatNumber(4500)} km ({formatNumber(cars.find((c) => c.rates.kmPerMonth)?.rates.kmPerMonth ?? 4500)} km on the {cars.find((c) => c.rates.kmPerMonth)?.model ?? ""}). Chauffeur rates are on the <Link href={href("/chauffeur")} className="text-fg">chauffeur page</Link>.
            </>
          }
        />
        <p className="fine lg:hidden">Scroll the table sideways to see every column. The car name stays in view.</p>
      </Section>

      <Section id="seasons" num="03" eyebrow="Seasons" title="Seasons and minimum rentals" intro={<p>The season is set by the pickup date, in Dubai time.</p>}>
        <FactTable
          id="season-table"
          caption="Seasons, dates and how they change the daily rate"
          captionHidden
          mode="stack"
          columns={[{ label: "Season" }, { label: "Dates" }, { label: "Daily rate" }, { label: "Also applies" }]}
          rows={seasonRows().map((s) => ({
            key: s.season.id,
            highlight: s.season.id === season.id,
            cells: [
              <span key="s">{s.season.name}{s.season.id === season.id && <> <Badge className="ms-2 align-middle">Now</Badge></>}</span>,
              s.ranges.join(" and "),
              s.rate,
              <span key="n" className="text-muted">{s.notes.join(" ") || "Nothing extra."}</span>,
            ],
          }))}
        />
      </Section>

      <Section
        id="longer"
        num="04"
        eyebrow="Longer rentals"
        title="The longer you rent, the less you pay per day"
        intro={<p>A rental day is 24 hours from handover, with {rules.graceMinutes} minutes&apos; grace at the end. The example uses the {ladder.car.name} at its standard rate of {formatAED(ladder.car.rates.daily)} a day.</p>}
      >
        <FactTable
          id="ladder-table"
          caption="Rental-length pricing"
          captionHidden
          mode="stack"
          columns={[{ label: "Rental length" }, { label: "How it is priced" }, { label: "Example", align: "end" }, { label: "Per day", align: "end" }]}
          rows={ladder.rows.map((r) => ({ key: r.key, cells: [r.length, r.how, r.example, r.perDay] }))}
          footnote={<>A long rental never costs more than the 30-day rate. You can request up to {rules.maxOnlineDays} days online; for longer rentals, message us on WhatsApp. Bugattis are priced on request.</>}
        />
      </Section>

      <Section id="fees" num="05" eyebrow="Fees" title="Every fee, in one place" intro={<p>Delivery fees and extras are added to your quote before you send a request. Charges during the rental are deducted from the deposit or charged to the card on file, with the receipt.</p>}>
        <div className="grid gap-8">
          {feeGroups().map((g) => (
            <FactTable
              key={g.id}
              id={g.id}
              caption={g.title}
              mode="stack"
              columns={[{ label: "Fee" }, { label: "Amount", align: "end" }, { label: "Details" }]}
              rows={g.rows.map((r) => ({ key: r.key, cells: [r.fee, <span key="a" className="whitespace-nowrap font-semibold text-fg">{r.amount}</span>, <span key="d" className="text-muted">{r.detail}</span>] }))}
            />
          ))}
        </div>
        <p className="text-sm text-muted">
          Excess, deposit and release timing are explained on <Link href={href("/requirements#insurance")} className="text-fg">rental requirements</Link>; delivery zones on the <Link href={href("/delivery")} className="text-fg">delivery page</Link>.
        </p>
      </Section>

      <Section id="offers" num="06" eyebrow="Launch offers" title="Offers" intro={<p>The quote applies one offer per booking, the one that saves you the most. Offers end on the date shown.</p>}>
        {offersNow.length ? (
          <div className="grid gap-3">
            {offersNow.map((o) => <OfferNotice key={o.id} id={o.id} today={today} />)}
          </div>
        ) : (
          <p className="text-muted">There are no offers running at the moment.</p>
        )}
        <LastUpdated iso={factsUpdated} extra={<span>Prices in AED including {site.vatRate}% VAT.</span>} />
      </Section>

      <CtaBand
        title="See your exact price"
        text={<p>Choose a car and your dates. The quote shows the rental, delivery and extras before you send the request, and nothing is charged on this website.</p>}
        actions={
          <>
            <WhatsAppButton text={`Hello ${site.businessName}, I have a question about prices.`}>Ask on WhatsApp</WhatsAppButton>
            <ButtonLink href={href("/cars")}>Browse the fleet</ButtonLink>
          </>
        }
      />
      <Dock />
    </>
  );
}
