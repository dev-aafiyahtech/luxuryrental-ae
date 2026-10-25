"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { FileCheck2 } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import type { DriverDetails } from "@/lib/booking/types";
import { Field, Section, describedBy } from "./Field";
import { PhoneInput } from "./PhoneInput";
import { Segmented } from "./Segmented";
import { FlowSkeleton } from "./bits";
import { FlowShell, NeedsCar, useErrors, useFlow } from "./FlowShell";
import { GCC, countriesFor, needsIdp, stepPath } from "./lib";
import { driverErrors } from "./validate";

export function DriverStep() {
  const t = useT("booking");
  const locale = useLocale();
  const { car, trip, update, hydrated, quote, service, outOfHours, go, href } = useFlow();
  const { touch, visible, check, submitted, summaryRef } = useErrors();

  if (!hydrated) return <FlowSkeleton label={t("form.loading")} />;
  if (!car) return <NeedsCar />;

  const d = trip.driver;
  const selfDrive = service === "self-drive";
  const errors = driverErrors(trip, car, service, t);
  const set = (patch: Partial<DriverDetails>) => update({ driver: patch });
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (check(errors)) go("review");
  };
  const err = (id: string) => visible(errors, id);
  // Age and licence problems are shown as soon as they're chosen: they decide whether the request can go ahead.
  const ageError = errors.find((e) => e.id === "driver-age")?.message;
  const licenceError = errors.find((e) => e.id === "driver-licence")?.message;
  const licenceNote = selfDrive && !d.resident && d.licenceCountry ? (needsIdp(d.licenceCountry) ? t("driver.idp") : GCC.includes(d.licenceCountry) ? t("driver.gccOk") : t("driver.idpOk")) : undefined;
  const nameHint = selfDrive ? t("driver.nameHint") : t("driver.nameHintChauffeur");

  return (
    <FlowShell
      step="driver"
      title={selfDrive ? t("titles.driver") : t("titles.driverChauffeur")}
      backHref={stepPath("extras", car, service)}
      car={car}
      trip={trip}
      quote={quote}
      service={service}
      formId="driver-form"
      actionLabel={t("form.continue")}
      errors={errors}
      showErrors={submitted}
      summaryRef={summaryRef}
      outOfHours={outOfHours}
    >
      <form id="driver-form" noValidate onSubmit={onSubmit} className="grid gap-10">
        <Section legend={t("review.contact")}>
          <Field id="driver-name" label={t("driver.name")} hint={nameHint} error={err("driver-name")}>
            <input id="driver-name" className="input" autoComplete="name" value={d.name ?? ""} onChange={(e) => set({ name: e.target.value })} onBlur={() => touch("driver-name")} aria-invalid={err("driver-name") ? true : undefined} aria-describedby={describedBy("driver-name", nameHint, err("driver-name"))} aria-required="true" />
          </Field>
          <PhoneInput id="driver-phone" label={t("driver.phone")} value={d.phone} onChange={(v) => set({ phone: v })} onBlur={() => touch("driver-phone")} error={err("driver-phone")} hint={t("phone.hint")} />
          <Field id="driver-email" label={t("driver.email")} optional={d.channel !== "email"} hint={t("driver.emailHint")} error={err("driver-email")}>
            <input id="driver-email" type="email" inputMode="email" autoComplete="email" spellCheck={false} className="input" value={d.email ?? ""} onChange={(e) => set({ email: e.target.value })} onBlur={() => touch("driver-email")} aria-invalid={err("driver-email") ? true : undefined} aria-describedby={describedBy("driver-email", true, err("driver-email"))} />
          </Field>
          <Segmented<DriverDetails["channel"]>
            legend={t("driver.channel")}
            value={d.channel ?? "whatsapp"}
            options={[
              { value: "whatsapp", label: t("driver.channelWhatsapp") },
              { value: "phone", label: t("driver.channelPhone") },
              { value: "email", label: t("driver.channelEmail") },
            ]}
            onChange={(v) => set({ channel: v })}
          />
        </Section>

        {selfDrive && (
          <Section legend={t("review.driver")}>
            <Segmented
              legend={t("driver.resident")}
              value={d.resident ? "yes" : "no"}
              options={[
                { value: "no", label: t("driver.residentNo") },
                { value: "yes", label: t("driver.residentYes") },
              ]}
              onChange={(v) => set({ resident: v === "yes" })}
            />
            <Field id="driver-licence" label={t("driver.licence")} hint={licenceNote ?? (d.resident ? t("driver.residentLicence") : undefined)} error={licenceError}>
              <select id="driver-licence" className="input" value={d.licenceCountry ?? "AE"} onChange={(e) => set({ licenceCountry: e.target.value })} aria-invalid={licenceError ? true : undefined} aria-describedby={describedBy("driver-licence", licenceNote ?? d.resident, licenceError)}>
                {countriesFor(locale, t("driver.otherCountry")).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </Field>
            <div className="grid gap-2">
              <Segmented<DriverDetails["ageBand"]>
                id="driver-age"
                legend={t("driver.age")}
                value={d.ageBand ?? "30+"}
                options={[
                  { value: "under-25", label: t("driver.ageUnder25") },
                  { value: "25-29", label: t("driver.age25") },
                  { value: "30+", label: t("driver.age30") },
                ]}
                onChange={(v) => set({ ageBand: v })}
              />
              <p className="field-hint">{t("driver.ageHint", { years: car.licenceYears })}</p>
              {ageError && (
                <div role="alert" className="grid gap-1">
                  <p className="field-error">{ageError}</p>
                  {car.chauffeur && <Link href={href(stepPath("trip", car, "chauffeur"))} className="w-fit text-sm font-semibold text-fg underline underline-offset-4">{t("driver.selfDriveAlt")}</Link>}
                </div>
              )}
            </div>
          </Section>
        )}

        <div className="grid gap-5 border-t border-line pt-6">
          <Field id="driver-notes" label={t("driver.notes")} optional hint={t("driver.notesHint")}>
            <textarea id="driver-notes" className="input" rows={3} value={d.notes ?? ""} onChange={(e) => set({ notes: e.target.value })} aria-describedby="driver-notes-hint" maxLength={600} />
          </Field>
        </div>

        <div className="card flex items-start gap-3 p-4">
          <FileCheck2 className="mt-0.5 h-5 w-5 flex-none text-accent" aria-hidden="true" />
          <div className="grid gap-1">
            <p className="font-semibold">{t("driver.documents")}</p>
            <p className="text-sm text-muted">{t("driver.documentsText")}</p>
            <p className="text-sm text-muted">{t("driver.privacy")}</p>
          </div>
        </div>
      </form>
    </FlowShell>
  );
}
