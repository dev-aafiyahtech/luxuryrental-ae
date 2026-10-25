"use client";

import clsx from "clsx";
import { useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { signConditionReport } from "@/lib/booking/store";
import type { ConditionReport } from "@/lib/booking/types";
import { formatNumber } from "@/lib/format";
import { Rows } from "@/components/booking/bits";
import { ErrorSummary, type FormError } from "@/components/booking/ErrorSummary";
import { Field, describedBy } from "@/components/booking/Field";
import { useErrors } from "@/components/booking/FlowShell";
import { CarDiagram } from "./CarDiagram";
import { SignaturePad, SignatureImage } from "./SignaturePad";
import { FuelGauge, longStamp } from "./bits";

/** Customer acknowledgement of a condition report: typed name + signature. */
function SignCheckForm({ bookingRef, stage, defaultName }: { bookingRef: string; stage: ConditionReport["stage"]; defaultName?: string }) {
  const t = useT("agreement");
  const [name, setName] = useState(defaultName ?? "");
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  const { touch, visible, check, submitted, summaryRef } = useErrors();
  const id = (k: string) => `${stage}-check-${k}`;

  const errors: FormError[] = [];
  if (name.trim().length < 2) errors.push({ id: id("name"), message: t("checks.errors.name") });
  if (!signature) errors.push({ id: id("signature"), message: t("checks.errors.signature") });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !check(errors) || !signature) return;
    setBusy(true);
    setFailed("");
    try {
      await signConditionReport(bookingRef, stage, { name: name.trim(), signature });
    } catch (err) {
      setFailed(t("checks.errors.failed", { error: err instanceof Error ? err.message : String(err) }));
      setBusy(false);
    }
  };

  const nameError = visible(errors, id("name"));
  return (
    <form noValidate onSubmit={submit} aria-labelledby={id("title")} className="grid gap-5 border-t border-line pt-6 print:hidden">
      <div className="grid gap-1">
        <h3 id={id("title")} className="text-[15px] font-semibold text-fg">{t("checks.signTitle")}</h3>
        <p className="text-sm text-muted">{t("checks.signLede")}</p>
      </div>
      {submitted && errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} title={t("sign.errorTitle")} />}
      <Field id={id("name")} label={t("checks.name")} error={nameError} className="max-w-[420px]">
        <input id={id("name")} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch(id("name"))} aria-invalid={nameError ? true : undefined} aria-describedby={describedBy(id("name"), undefined, nameError)} aria-required="true" />
      </Field>
      <SignaturePad id={id("signature")} label={t("checks.signature")} name={name} onChange={setSignature} error={visible(errors, id("signature"))} />
      {failed && <p role="alert" className="field-error">{failed}</p>}
      <button type="submit" className="btn btn-primary w-fit" aria-busy={busy || undefined} aria-disabled={busy || undefined}>
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
        {busy ? t("checks.submitting") : t("checks.submit")}
      </button>
    </form>
  );
}

/**
 * A condition report (vehicle check) on the agreement page: who checked, km, fuel, photos,
 * damage marks and notes, then the customer's confirmation (or the form to give it).
 */
export function ConditionReportView({ bookingRef, stage, report, canSign, defaultName }: { bookingRef: string; stage: ConditionReport["stage"]; report?: ConditionReport; canSign: boolean; defaultName?: string }) {
  const t = useT("agreement");
  const locale = useLocale();
  const titleId = `${stage}-check-h`;
  return (
    <section id={`${stage}-check`} aria-labelledby={titleId} className={clsx("card grid scroll-mt-28 gap-6 p-5 sm:p-8 print:block print:rounded-none print:border-0 print:bg-white print:p-0 print:[&>*+*]:mt-5", report && "print:break-before-page")}>
      <div className="grid gap-1.5">
        <h2 id={titleId} className="display-sm">{t(stage === "handover" ? "checks.handover" : "checks.return")}</h2>
        {report && <p className="text-sm text-muted">{t("checks.lede")}</p>}
      </div>
      {!report ? (
        <p className="text-champagne">{t("checks.none")}</p>
      ) : (
        <>
          <Rows
            rows={[
              { label: t("checks.by"), value: <bdi>{report.recordedBy}</bdi> },
              { label: t("checks.at"), value: <span className="tabular">{longStamp(report.recordedAt, locale)}</span> },
              { label: t("checks.odometer"), value: <span className="tabular">{t("checks.km", { km: formatNumber(report.odometerKm) })}</span> },
              { label: t("checks.fuel"), value: <FuelGauge eighths={report.fuelEighths} /> },
              { label: t("checks.photos"), value: <span className="tabular">{report.photos}</span> },
              { label: t("checks.notes"), value: report.notes },
            ]}
          />
          <div className="grid gap-3 print:break-inside-avoid">
            <h3 className="label">{t("checks.damage")}</h3>
            <CarDiagram marks={report.damages} />
          </div>
          {report.customerSignedAt && report.customerSignature ? (
            <div className="grid gap-3 border-t border-line pt-6">
              <p className="flex items-start gap-2 text-sm font-semibold text-fg">
                <CircleCheck className="mt-px h-4 w-4 flex-none text-success" aria-hidden="true" />
                {t("checks.confirmed", { name: report.customerName ?? "", time: longStamp(report.customerSignedAt, locale) })}
              </p>
              <SignatureImage src={report.customerSignature} alt={t("signed.image", { name: report.customerName ?? "" })} />
            </div>
          ) : canSign ? (
            <SignCheckForm bookingRef={bookingRef} stage={stage} defaultName={defaultName} />
          ) : (
            <p className="border-t border-line pt-6 text-sm text-muted">{t("checks.unsigned")}</p>
          )}
        </>
      )}
    </section>
  );
}
