"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import type { Car } from "@/content/types";
import { rules } from "@/content/rules";
import { site } from "@/content/site";
import { useHref, useT } from "@/i18n/client";
import type { AgreementRecord, BookingRecord } from "@/lib/booking/types";
import { formatDayLong } from "@/lib/dates";
import { formatAED, formatNumber } from "@/lib/format";
import { Rows, rich } from "@/components/booking/bits";
import { QuoteTable } from "@/components/booking/QuoteTable";
import { tripLines } from "@/components/booking/FlowShell";
import { countryName, formatPhone, packageText } from "@/components/booking/lib";
import { SignAgreementForm, excessFor } from "./SignAgreementForm";
import { SignatureImage } from "./SignaturePad";
import { DocSection, longDate, longStamp } from "./bits";

const linkClass = "font-semibold text-fg underline decoration-accent/60 underline-offset-4 hover:decoration-accent";

/**
 * The rental agreement document: parties, vehicle, rental, charges, fees, key terms and
 * signatures. Readable on screen and printable (black on white via print: variants).
 */
export function AgreementDocument({ b, agreement, car, canSign, onSigned }: { b: BookingRecord; agreement: AgreementRecord; car?: Car; canSign: boolean; onSigned: () => void }) {
  const t = useT("agreement");
  const tb = useT("booking");
  const href = useHref();
  const trip = b.trip;
  const chauffeur = trip.service === "chauffeur";
  const d = trip.driver;
  const lines = tripLines(trip, trip.service, tb);
  const tier = car ? rules.tiers[car.tier] : undefined;
  const excess = tier ? excessFor(b, tier) : 0;
  const signed = !!agreement.signedAt;

  const termsLink = <Link href={href("/legal/terms-of-rental")} className={linkClass}>{t("doc.termsLink")}</Link>;
  const cancelLink = <Link href={href("/legal/cancellation")} className={linkClass}>{t("terms.cancelLink")}</Link>;

  const extras = [
    !chauffeur && trip.extras.fullCover && t("rental.fullCover"),
    !chauffeur && trip.extras.additionalDrivers > 0 && (trip.extras.additionalDrivers === 1 ? t("rental.driverOne") : t("rental.drivers", { n: trip.extras.additionalDrivers })),
    trip.extras.childSeats > 0 && (trip.extras.childSeats === 1 ? t("rental.seatOne") : t("rental.seats", { n: trip.extras.childSeats })),
  ].filter(Boolean) as string[];

  const { tolls } = rules;
  const keyTerms = chauffeur
    ? [
        t("terms.chauffeur", { max: rules.chauffeur.maxPassengers }),
        t("terms.care", { fee: formatAED(rules.cleaningFee) }),
        rich(t("terms.cancel"), { cancellation: cancelLink }),
        t("terms.law"),
      ]
    : [
        t("terms.uae"),
        t("terms.drivers", { age: car?.minAge ?? tier?.minAge ?? 25, years: car?.licenceYears ?? tier?.licenceYears ?? 2 }),
        t("terms.accident"),
        t("terms.exclusions"),
        t("terms.damage", { pct: rules.lossOfUsePct, days: rules.lossOfUseMaxDays }),
        t("terms.care", { fee: formatAED(rules.cleaningFee) }),
        t("terms.deposit", { days: tier?.releaseDays ?? 21, bank: rules.bankReleaseWorkingDays }),
        rich(t("terms.cancel"), { cancellation: cancelLink }),
      ];

  return (
    <article aria-labelledby="ra-title" className="card grid gap-8 p-5 sm:p-8 md:p-10 print:block print:rounded-none print:border-0 print:bg-white print:p-0 print:[&>*+*]:mt-6">
      <header className="grid gap-5">
        <div className="grid gap-3">
          <p className="eyebrow">{site.businessName}</p>
          <h1 id="ra-title" className="display-md">{t("doc.title")}</h1>
        </div>
        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-4 text-sm print:grid-cols-4">
          {[
            { label: t("doc.number"), value: <span className="font-semibold tabular tracking-[0.04em]" dir="ltr">{agreement.number}</span> },
            { label: t("doc.reference"), value: <span className="tabular tracking-[0.04em]" dir="ltr">{b.ref}</span> },
            { label: t("doc.version"), value: agreement.version },
            { label: t("doc.issued"), value: longDate(agreement.issuedAt) },
          ].map((r) => (
            <div key={r.label} className="grid content-start gap-1">
              <dt className="label">{r.label}</dt>
              <dd className="m-0 text-fg">{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-[65ch] text-[15px] leading-relaxed text-champagne">{rich(t("doc.intro"), { terms: termsLink })}</p>
      </header>

      <DocSection n={1} id="ra-parties" title={t("parties.title")}>
        <div className="grid gap-8 print:break-inside-avoid print:grid-cols-2 print:gap-8">
          <div className="grid content-start gap-2">
            <h3 className="text-[15px] font-semibold text-fg">{t("parties.owner")}</h3>
            <Rows
              rows={[
                { label: t("parties.name"), value: t("parties.ownerName", { legal: site.legalName, trade: site.businessName }) },
                { label: t("parties.address"), value: [site.address.line1, site.address.area, site.address.city, site.address.country].join(", ") },
                { label: t("parties.licence"), value: <span className="tabular">{t("parties.licenceValue", { number: site.tradeLicence, authority: site.licenceAuthority })}</span> },
                { label: t("parties.rta"), value: <span className="tabular">{site.rtaPermit}</span> },
                { label: t("parties.trn"), value: <span className="tabular" dir="ltr">{site.vatTrn}</span> },
              ]}
            />
            {site.sampleDetails && <p className="fine">{t("parties.sample")}</p>}
          </div>
          <div className="grid content-start gap-2">
            <h3 className="text-[15px] font-semibold text-fg">{chauffeur ? t("parties.customer") : t("parties.hirer")}</h3>
            <Rows
              rows={[
                { label: t("parties.name"), value: d.name },
                { label: t("parties.phone"), value: d.phone ? <span dir="ltr" className="whitespace-nowrap tabular">{formatPhone(d.phone)}</span> : "" },
                { label: t("parties.email"), value: d.email ? <span className="break-all">{d.email}</span> : "" },
                { label: t("parties.licenceCountry"), value: chauffeur ? "" : countryName(d.licenceCountry) },
                { label: t("parties.residency"), value: chauffeur ? "" : d.resident ? t("parties.resident") : t("parties.visitor") },
              ]}
            />
          </div>
        </div>
      </DocSection>

      <DocSection n={2} id="ra-vehicle" title={t("vehicle.title")}>
        <Rows
          rows={[
            { label: t("vehicle.car"), value: b.carName },
            { label: t("vehicle.year"), value: car?.year },
            { label: t("vehicle.exterior"), value: car?.paint.name },
            { label: t("vehicle.interior"), value: car?.details.interior },
            { label: t("vehicle.wheels"), value: car?.details.wheels },
            { label: t("vehicle.plate"), value: t("vehicle.plateValue") },
            { label: t("vehicle.tier"), value: tier?.name },
          ]}
        />
      </DocSection>

      <DocSection n={3} id="ra-rental" title={t("rental.title")}>
        <Rows
          rows={
            chauffeur
              ? [
                  { label: t("rental.service"), value: tb("reserve.chauffeur") },
                  { label: t("rental.date"), value: trip.pickupDate ? <span className="tabular">{`${formatDayLong(trip.pickupDate)}, ${trip.pickupTime}`}</span> : "" },
                  { label: t("rental.package"), value: packageText(trip) },
                  { label: t("rental.handover"), value: lines.where },
                  { label: t("rental.flight"), value: trip.pickup.flight?.toUpperCase() },
                  { label: t("rental.extras"), value: extras.length ? extras.join(", ") : "" },
                ]
              : [
                  { label: t("rental.service"), value: tb("reserve.selfDrive") },
                  { label: t("rental.starts"), value: trip.pickupDate ? <span className="tabular">{`${formatDayLong(trip.pickupDate)}, ${trip.pickupTime}`}</span> : "" },
                  { label: t("rental.ends"), value: trip.returnDate ? <span className="tabular">{`${formatDayLong(trip.returnDate)}, ${trip.returnTime}`}</span> : "" },
                  { label: t("rental.length"), value: b.quote.days ? (b.quote.days === 1 ? t("rental.day") : t("rental.days", { n: b.quote.days })) : "" },
                  { label: t("rental.handover"), value: lines.where },
                  { label: t("rental.return"), value: lines.back ? lines.back.replace(`${tb("review.return")}: `, "") : t("rental.sameReturn") },
                  { label: t("rental.flight"), value: trip.pickup.flight?.toUpperCase() },
                  { label: t("rental.extras"), value: extras.length ? extras.join(", ") : t("rental.none") },
                ]
          }
        />
      </DocSection>

      <DocSection n={4} id="ra-charges" title={t("charges.title")} lede={chauffeur ? t("charges.ledeChauffeur") : t("charges.lede")}>
        {car && (
          <div className="print:break-inside-avoid">
            <QuoteTable quote={b.quote} car={car} showDeposit={false} showKm={false} />
          </div>
        )}
        <Rows
          rows={[
            { label: t("charges.deposit"), value: b.quote.deposit > 0 ? t("charges.depositValue", { amount: formatAED(b.quote.deposit), days: tier?.releaseDays ?? 21 }) : t("charges.noDeposit") },
            { label: t("charges.excess"), value: !chauffeur && tier ? t("charges.excessValue", { amount: formatAED(excess) }) : "" },
            {
              label: t("charges.fullCover"),
              value: !chauffeur && tier ? (trip.extras.fullCover ? t("charges.fullCoverChosen", { perDay: formatAED(tier.fullCoverPerDay), excess: formatAED(tier.fullCoverExcess) }) : t("charges.fullCoverNot", { perDay: formatAED(tier.fullCoverPerDay), excess: formatAED(tier.fullCoverExcess) })) : "",
            },
            { label: t("charges.km"), value: !chauffeur && b.quote.includedKm > 0 ? <span className="tabular">{t("charges.kmValue", { km: formatNumber(b.quote.includedKm), perDay: formatNumber(car?.rates.kmPerDay ?? 0) })}</span> : "" },
            { label: t("charges.extraKm"), value: !chauffeur && b.quote.extraKmFee > 0 ? <span className="tabular">{t("charges.extraKmValue", { fee: b.quote.extraKmFee })}</span> : "" },
          ]}
        />
      </DocSection>

      <DocSection n={5} id="ra-fees" title={t("fees.title")} lede={chauffeur ? undefined : t("fees.lede")}>
        <Rows
          rows={
            chauffeur
              ? [
                  { label: t("fees.included"), value: rules.chauffeur.included },
                  { label: t("fees.overtime"), value: car?.chauffeur ? t("fees.overtimeValue", { rate: formatAED(car.chauffeur.overtime), step: rules.chauffeur.overtimeStepMinutes }) : "" },
                ]
              : [
                  { label: t("fees.salik"), value: t("fees.salikValue", { peak: tolls.salikPeak, offPeak: tolls.salikOffPeak, free: tolls.salikFreeHours, admin: rules.tollAdminFee }) },
                  { label: t("fees.darb"), value: t("fees.darbValue", { peak: tolls.darbPeak, admin: rules.tollAdminFee }) },
                  { label: t("fees.fuel"), value: t("fees.fuelValue", { fee: formatAED(rules.refuelFee) }) },
                  { label: t("fees.fines"), value: t("fees.finesValue", { fee: formatAED(rules.fineAdminFee) }) },
                  { label: t("fees.late"), value: t("fees.lateValue", { grace: rules.graceMinutes, pct: rules.lateReturnHourPct }) },
                ]
          }
        />
      </DocSection>

      <DocSection n={6} id="ra-terms" title={t("terms.title")} lede={rich(t("terms.lede"), { terms: termsLink })}>
        <ul className="m-0 grid list-disc gap-2.5 ps-5 text-[15px] leading-relaxed text-champagne marker:text-accent">
          {keyTerms.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        {!chauffeur && <p className="text-sm text-muted">{t("terms.law")}</p>}
      </DocSection>

      <DocSection n={7} id="ra-sign" title={t("sign.title")}>
        <div className="grid gap-8 print:break-inside-avoid print:grid-cols-2">
          <div className="grid content-start gap-2">
            <h3 className="text-[15px] font-semibold text-fg">{t("signed.owner")}</h3>
            <p className="text-sm text-champagne">{t("signed.ownerValue", { name: site.legalName, date: longDate(agreement.issuedAt) })}</p>
          </div>
          <div className="grid content-start gap-3">
            <h3 className="text-[15px] font-semibold text-fg">{chauffeur ? t("parties.customer") : t("parties.hirer")}</h3>
            {signed ? (
              <>
                {agreement.signature && <SignatureImage src={agreement.signature} alt={t("signed.image", { name: agreement.signerName ?? "" })} />}
                <Rows
                  rows={[
                    { label: t("signed.by"), value: agreement.signerName },
                    { label: t("signed.at"), value: agreement.signedAt ? <span className="tabular">{longStamp(agreement.signedAt)}</span> : "" },
                    { label: t("signed.method"), value: t("signed.methodValue") },
                    {
                      label: t("signed.accepted"),
                      value: agreement.accepted ? (
                        <ul className="m-0 grid list-none gap-1 p-0">
                          {(["terms", "deposit", "damage"] as const).filter((k) => agreement.accepted?.[k]).map((k) => (
                            <li key={k} className="flex items-center gap-2">
                              <Check className="h-4 w-4 flex-none text-success" aria-hidden="true" />
                              {t(`signed.accepted${k[0].toUpperCase()}${k.slice(1)}`)}
                            </li>
                          ))}
                        </ul>
                      ) : "",
                    },
                  ]}
                />
              </>
            ) : canSign ? (
              <>
                <SignAgreementForm b={b} excess={excess} onSigned={onSigned} />
                {/* Paper fallback when the unsigned agreement is printed. */}
                <div className="hidden gap-8 pt-10 print:grid print:grid-cols-2" aria-hidden="true">
                  <p className="m-0 border-t border-neutral-500 pt-2 text-sm">{t("sign.printHirer")}</p>
                  <p className="m-0 border-t border-neutral-500 pt-2 text-sm">{t("sign.printDate")}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">{t("sign.notOpen", { status: tb(`status.labels.${b.status}`).toLowerCase() })}</p>
            )}
          </div>
        </div>
      </DocSection>
    </article>
  );
}
