"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { rules } from "@/content/rules";
import { useT } from "@/i18n/client";
import { formatAED } from "@/lib/format";
import { Notice } from "@/components/ui";
import { Section } from "./Field";
import { RadioCard } from "./RadioCard";
import { Stepper } from "./Stepper";
import { FlowSkeleton } from "./bits";
import { FlowShell, NeedsCar, useErrors, useFlow } from "./FlowShell";
import { stepPath } from "./lib";
import { tripErrors } from "./validate";
import { useAvailability } from "@/lib/booking/availability";

export function ExtrasStep() {
  const t = useT("booking");
  const { car, trip, update, hydrated, quote, service, outOfHours, go, href } = useFlow();
  const { check, submitted, summaryRef } = useErrors();
  const avail = useAvailability(car?.slug);

  if (!hydrated) return <FlowSkeleton label={t("form.loading")} />;
  if (!car) return <NeedsCar />;

  const tier = rules.tiers[car.tier];
  const chauffeur = service === "chauffeur";
  const tripProblems = tripErrors(trip, quote, service, t, avail.clash(trip.pickupDate, trip.returnDate, service), car.name);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (check([])) go("driver");
  };
  const skip = () => {
    update({ extras: { fullCover: false, additionalDrivers: 0, childSeats: 0 } });
    go("driver");
  };

  return (
    <FlowShell
      step="extras"
      title={t("titles.extras")}
      backHref={stepPath("trip", car, service)}
      car={car}
      trip={trip}
      quote={quote}
      service={service}
      formId="extras-form"
      actionLabel={t("form.continue")}
      errors={[]}
      showErrors={submitted}
      summaryRef={summaryRef}
      outOfHours={outOfHours}
      intro={
        tripProblems.length > 0 && (
          <Notice tone="warning" title={tripProblems[0].message}>
            <Link href={href(stepPath("trip", car, service))} className="font-semibold text-fg underline underline-offset-4">{t("form.edit")}: {t("steps.trip")}</Link>
          </Notice>
        )
      }
      after={
        <button type="button" className="btn btn-ghost -ms-3 w-fit underline decoration-line underline-offset-4" onClick={skip}>
          {t("extras.skip")}
        </button>
      }
    >
      <form id="extras-form" noValidate onSubmit={onSubmit} className="grid gap-10">
        {chauffeur ? (
          <Section legend={t("extras.otherExtras")}>
            <p className="text-sm text-muted">{t("extras.chauffeurNote")}</p>
            <div className="card p-4 sm:p-5">
              <Stepper label={t("extras.seats")} hint={t("extras.seatsHint")} value={trip.extras.childSeats} min={0} max={3} onChange={(n) => update({ extras: { childSeats: n } })} />
            </div>
          </Section>
        ) : (
          <>
            <Section legend={t("extras.cover")}>
              <div className="grid gap-3">
                <RadioCard
                  name="cover"
                  value="standard"
                  checked={!trip.extras.fullCover}
                  onChange={() => update({ extras: { fullCover: false } })}
                  title={t("extras.standard")}
                  description={t("extras.standardDetail", { excess: formatAED(tier.excess) })}
                  aside={t("extras.includedAside")}
                />
                <RadioCard
                  name="cover"
                  value="full"
                  checked={trip.extras.fullCover}
                  onChange={() => update({ extras: { fullCover: true } })}
                  title={t("extras.fullCover")}
                  description={tier.fullCoverExcess === 0 ? t("extras.fullCoverDetailZero") : t("extras.fullCoverDetail", { excess: formatAED(tier.fullCoverExcess) })}
                  aside={t("extras.perDay", { amount: formatAED(tier.fullCoverPerDay) })}
                />
              </div>
            </Section>
            <Section legend={t("extras.otherExtras")}>
              <div className="card grid gap-5 p-4 sm:p-5">
                <Stepper label={t("extras.drivers")} hint={t("extras.driversHint", { fee: rules.additionalDriverPerDay })} value={trip.extras.additionalDrivers} min={0} max={3} onChange={(n) => update({ extras: { additionalDrivers: n } })} />
                <div className="border-t border-line" />
                <Stepper label={t("extras.seats")} hint={t("extras.seatsHint")} value={trip.extras.childSeats} min={0} max={3} onChange={(n) => update({ extras: { childSeats: n } })} />
              </div>
            </Section>
          </>
        )}
      </form>
    </FlowShell>
  );
}
