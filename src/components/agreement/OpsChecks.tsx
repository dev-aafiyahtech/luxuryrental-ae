"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, type FormEvent, type ReactNode } from "react";
import { CircleCheck, ClipboardCheck, Clock, FileSignature } from "lucide-react";
import { useHref, useT } from "@/i18n/client";
import { agreementFor, agreementOpen, recordConditionReport } from "@/lib/booking/store";
import type { BookingRecord, ConditionReport, DamageMark } from "@/lib/booking/types";
import { formatNumber } from "@/lib/format";
import { BottomSheet } from "@/components/booking/BottomSheet";
import { ErrorSummary, type FormError } from "@/components/booking/ErrorSummary";
import { Field, describedBy } from "@/components/booking/Field";
import { stamp } from "@/components/booking/BookingStatusView";
import { useErrors } from "@/components/booking/FlowShell";
import { CarDiagram } from "./CarDiagram";

type Stage = ConditionReport["stage"];

function Cell({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <p className="label flex items-center gap-2">
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function CheckSummary({ r }: { r: ConditionReport }) {
  const t = useT("agreement");
  const marks = r.damages.length === 1 ? t("ops.markOne") : t("ops.marks", { n: r.damages.length });
  return (
    <div className="grid gap-0.5 text-sm">
      <p className="m-0 tabular text-fg">{t("ops.summary", { km: formatNumber(r.odometerKm), fuel: r.fuelEighths, marks })}</p>
      <p className="m-0 text-[13px] text-muted">
        {r.recordedBy} · {stamp(r.recordedAt)} · {t("ops.photos", { n: r.photos })}
      </p>
      <p className={clsx("m-0 flex items-center gap-1.5 text-[13px]", r.customerSignedAt ? "text-success" : "text-warning")}>
        {r.customerSignedAt ? <CircleCheck className="h-3.5 w-3.5 flex-none" aria-hidden="true" /> : <Clock className="h-3.5 w-3.5 flex-none" aria-hidden="true" />}
        {r.customerSignedAt ? t("ops.customerSigned") : t("ops.customerUnsigned")}
      </p>
    </div>
  );
}

/**
 * Ops desk row: the agreement state (not issued / awaiting signature / signed) with a link to
 * it, and the handover and return checks (recorded summary, or the action to record one).
 */
export function OpsChecks({ b, onRecord }: { b: BookingRecord; onRecord: (stage: Stage) => void }) {
  const t = useT("agreement");
  const href = useHref();
  const agreement = agreementFor(b);
  const open = agreementOpen(b.status);
  const iconClass = "h-3.5 w-3.5 flex-none";
  return (
    <div className="grid gap-5 border-t border-line pt-4 sm:grid-cols-3 sm:gap-6">
      <Cell icon={<FileSignature className={iconClass} aria-hidden="true" />} label={t("ops.agreement")}>
        {!agreement ? (
          <>
            <p className="m-0 text-sm text-muted">{t("ops.notIssued")}</p>
            <p className="m-0 text-[13px] text-muted">{t("ops.notIssuedHint")}</p>
          </>
        ) : (
          <>
            <p className={clsx("m-0 flex items-center gap-1.5 text-sm", agreement.signedAt ? "text-success" : "text-warning")}>
              {agreement.signedAt ? <CircleCheck className={iconClass} aria-hidden="true" /> : <Clock className={iconClass} aria-hidden="true" />}
              {agreement.signedAt ? t("ops.signed", { time: stamp(agreement.signedAt) }) : t("ops.awaiting")}
            </p>
            <p className="m-0 text-[13px] tabular text-muted" dir="ltr">{agreement.number}</p>
            <Link href={href(`/booking/agreement?ref=${b.ref}`)} className="-ms-1 inline-flex min-h-11 w-fit items-center px-1 text-sm font-semibold text-fg underline decoration-accent/60 underline-offset-4 hover:decoration-accent">
              {t("ops.open")}
            </Link>
          </>
        )}
      </Cell>
      <Cell icon={<ClipboardCheck className={iconClass} aria-hidden="true" />} label={t("ops.handover")}>
        {b.handoverCheck ? (
          <CheckSummary r={b.handoverCheck} />
        ) : open ? (
          <button type="button" className="btn btn-secondary btn-sm w-fit" aria-haspopup="dialog" onClick={() => onRecord("handover")}>{t("ops.record")}</button>
        ) : (
          <p className="m-0 text-sm text-muted">{t("ops.notRecorded")}{b.status === "requested" ? ` · ${t("ops.afterConfirm")}` : ""}</p>
        )}
      </Cell>
      <Cell icon={<ClipboardCheck className={iconClass} aria-hidden="true" />} label={t("ops.return")}>
        {b.returnCheck ? (
          <CheckSummary r={b.returnCheck} />
        ) : b.handoverCheck && open ? (
          <button type="button" className="btn btn-secondary btn-sm w-fit" aria-haspopup="dialog" onClick={() => onRecord("return")}>{t("ops.recordReturn")}</button>
        ) : (
          <p className="m-0 text-sm text-muted">{t("ops.notRecorded")}{b.handoverCheck ? "" : ` · ${t("ops.afterHandover")}`}</p>
        )}
      </Cell>
    </div>
  );
}

const FUEL = Array.from({ length: 9 }, (_, i) => i);

function CheckForm({ b, stage, formId, onBusy, onDone }: { b: BookingRecord; stage: Stage; formId: string; onBusy: (v: boolean) => void; onDone: (message: string) => void }) {
  const t = useT("agreement");
  const before = stage === "return" ? b.handoverCheck : undefined;
  const [staff, setStaff] = useState(before?.recordedBy ?? "");
  const [odometer, setOdometer] = useState("");
  const [fuel, setFuel] = useState(before?.fuelEighths ?? 8);
  const [photos, setPhotos] = useState("0");
  const [notes, setNotes] = useState("");
  // Return checks start from the handover marks (new ids), so ops only add what's new.
  const [marks, setMarks] = useState<DamageMark[]>(() => (before ? before.damages.map((m, i) => ({ ...m, id: `${m.id}-r${i}` })) : []));
  const [failed, setFailed] = useState("");
  const [busy, setBusy] = useState(false);
  const { touch, visible, check, submitted, summaryRef } = useErrors();
  const id = (k: string) => `check-${k}`;

  const km = Number(odometer);
  const photosN = Number(photos);
  const errors: FormError[] = [];
  if (!staff.trim()) errors.push({ id: id("staff"), message: t("ops.form.errors.staff") });
  if (odometer.trim() === "" || !Number.isInteger(km) || km < 0) errors.push({ id: id("odometer"), message: t("ops.form.errors.odometer") });
  else if (before && km < before.odometerKm) errors.push({ id: id("odometer"), message: t("ops.form.errors.odometerLow", { km: formatNumber(before.odometerKm) }) });
  if (photos.trim() === "" || !Number.isInteger(photosN) || photosN < 0) errors.push({ id: id("photos"), message: t("ops.form.errors.photos") });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !check(errors)) return;
    setBusy(true);
    onBusy(true);
    setFailed("");
    try {
      await recordConditionReport(b.ref, {
        stage,
        recordedBy: staff.trim(),
        odometerKm: km,
        fuelEighths: fuel,
        damages: marks.map((m) => ({ ...m, note: m.note?.trim() || undefined })),
        photos: photosN,
        notes: notes.trim() || undefined,
      });
      onDone(t("ops.saved", { stage: t(stage === "handover" ? "ops.stageHandover" : "ops.stageReturn"), ref: b.ref }));
    } catch (err) {
      setFailed(t("ops.failed", { ref: b.ref, error: err instanceof Error ? err.message : String(err) }));
    } finally {
      setBusy(false);
      onBusy(false);
    }
  };

  const err = (k: string) => visible(errors, id(k));
  const odoHint = before ? t("ops.form.odometerHint", { km: formatNumber(before.odometerKm) }) : undefined;

  return (
    <form id={formId} noValidate onSubmit={submit} className="grid gap-6">
      {submitted && errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} title={t("ops.form.errorTitle")} />}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={id("staff")} label={t("ops.form.staff")} error={err("staff")}>
          <input id={id("staff")} className="input" autoComplete="off" value={staff} onChange={(e) => setStaff(e.target.value)} onBlur={() => touch(id("staff"))} aria-invalid={err("staff") ? true : undefined} aria-describedby={describedBy(id("staff"), undefined, err("staff"))} aria-required="true" />
        </Field>
        <Field id={id("odometer")} label={t("ops.form.odometer")} hint={odoHint} error={err("odometer")}>
          <input id={id("odometer")} className="input tabular" inputMode="numeric" pattern="[0-9]*" autoComplete="off" dir="ltr" value={odometer} onChange={(e) => setOdometer(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => touch(id("odometer"))} aria-invalid={err("odometer") ? true : undefined} aria-describedby={describedBy(id("odometer"), odoHint, err("odometer"))} aria-required="true" />
        </Field>
        <Field id={id("fuel")} label={t("ops.form.fuel")}>
          <select id={id("fuel")} className="input" value={fuel} onChange={(e) => setFuel(Number(e.target.value))}>
            {FUEL.map((n) => {
              const word = t(`fuel.${n}`);
              return <option key={n} value={n}>{t("fuel.value", { n })}{word !== `fuel.${n}` ? ` · ${word}` : ""}</option>;
            })}
          </select>
        </Field>
        <Field id={id("photos")} label={t("ops.form.photos")} hint={t("ops.form.photosHint")} error={err("photos")}>
          <input id={id("photos")} className="input tabular" inputMode="numeric" pattern="[0-9]*" autoComplete="off" dir="ltr" value={photos} onChange={(e) => setPhotos(e.target.value.replace(/[^\d]/g, ""))} onBlur={() => touch(id("photos"))} aria-invalid={err("photos") ? true : undefined} aria-describedby={describedBy(id("photos"), t("ops.form.photosHint"), err("photos"))} aria-required="true" />
        </Field>
      </div>
      <fieldset className="m-0 grid min-w-0 gap-3 border-0 border-t border-line p-0 pt-5">
        <legend className="float-start mb-1 w-full p-0 text-[15px] font-semibold text-fg">{t("ops.form.damage")}</legend>
        {before && before.damages.length > 0 && <p className="field-hint">{t("ops.form.damageHint")}</p>}
        <CarDiagram marks={marks} onChange={setMarks} />
      </fieldset>
      <Field id={id("notes")} label={t("ops.form.notes")} optional>
        <textarea id={id("notes")} className="input min-h-24 py-3" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
      </Field>
      {failed && <p role="alert" className="field-error">{failed}</p>}
    </form>
  );
}

/** Ops: record the handover or return check in a sheet (staff, km, fuel, photos, damage marks, notes). */
export function ConditionReportSheet({ b, stage, onClose, onSaved }: { b?: BookingRecord; stage: Stage; onClose: () => void; onSaved: (message: string) => void }) {
  const t = useT("agreement");
  const [busy, setBusy] = useState(false);
  const formId = "condition-report-form";
  const title = b ? t(stage === "handover" ? "ops.form.title" : "ops.form.titleReturn", { ref: b.ref }) : "";
  return (
    <BottomSheet
      open={!!b}
      onClose={onClose}
      title={title}
      description={b ? t("ops.form.description", { car: b.carName }) : undefined}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>{t("ops.form.cancel")}</button>
          <button type="submit" form={formId} className="btn btn-primary btn-sm" aria-busy={busy || undefined} aria-disabled={busy || undefined}>
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
            {busy ? t("ops.form.saving") : t(stage === "handover" ? "ops.form.save" : "ops.form.saveReturn")}
          </button>
        </div>
      }
    >
      {b && (
        <CheckForm
          key={`${b.ref}-${stage}`}
          b={b}
          stage={stage}
          formId={formId}
          onBusy={setBusy}
          onDone={(message) => {
            onSaved(message);
            onClose();
          }}
        />
      )}
    </BottomSheet>
  );
}
