"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, CircleCheck, FileSignature, Printer, Search } from "lucide-react";
import { getCar } from "@/content/cars";
import { useHref, useLocale, useT } from "@/i18n/client";
import { isolateFor } from "@/i18n/config";
import { useBooking } from "@/lib/booking/draft";
import { agreementFor, agreementOpen } from "@/lib/booking/store";
import type { BookingRecord } from "@/lib/booking/types";
import { Notice } from "@/components/ui";
import { FlowSkeleton, StatusBadge } from "@/components/booking/bits";
import { Field, describedBy } from "@/components/booking/Field";
import { useHydrated } from "@/components/booking/hooks";
import { AgreementDocument } from "./AgreementDocument";
import { ConditionReportView } from "./ConditionReportView";
import { longStamp, versionText } from "./bits";

const REF_RE = /^LR-[0-9A-HJKMNP-TV-Z]{6}$/;

function Lookup({ initial, notFound }: { initial?: string; notFound?: boolean }) {
  const t = useT("agreement");
  const locale = useLocale();
  const href = useHref();
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    let v = value.trim().toUpperCase().replace(/\s+/g, "");
    if (/^[0-9A-Z]{6}$/.test(v)) v = `LR-${v}`;
    if (!REF_RE.test(v)) {
      setError(t("lookup.error"));
      return;
    }
    setError("");
    router.push(href(`/booking/agreement?ref=${v}`));
  };
  return (
    <div className="container-narrow grid gap-8 pb-24 pt-10 md:pt-14">
      <header className="grid gap-3">
        <h1 className="display-md">{t("lookup.title")}</h1>
        <p className="lede">{t("lookup.lede")}</p>
      </header>
      {notFound && initial && <Notice tone="warning">{t("lookup.notFound", { ref: isolateFor(locale)(initial) })}</Notice>}
      <form noValidate onSubmit={onSubmit} className="card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-6">
        <Field id="agreement-ref" label={t("lookup.label")} error={error}>
          <input id="agreement-ref" className="input uppercase tabular" dir="ltr" autoComplete="off" spellCheck={false} value={value} placeholder="LR-7K3QZM" onChange={(e) => setValue(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy("agreement-ref", undefined, error)} />
        </Field>
        <button type="submit" className={clsx("btn btn-primary gap-2", error && "sm:mb-[26px]")}>
          <Search className="h-4 w-4" aria-hidden="true" />
          {t("lookup.button")}
        </button>
      </form>
      <Link href={href("/booking")} className="btn btn-secondary w-fit">{t("lookup.status")}</Link>
    </div>
  );
}

/** The request isn't confirmed (or was closed), so there is no agreement yet. */
function NotIssued({ b }: { b: BookingRecord }) {
  const t = useT("agreement");
  const tb = useT("booking");
  const locale = useLocale();
  const href = useHref();
  const waiting = b.status === "requested";
  return (
    <div className="container-narrow grid gap-8 pb-24 pt-10 md:pt-14">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold tabular tracking-[0.06em]" dir="ltr">{b.ref}</span>
          <StatusBadge status={b.status} />
        </div>
        <h1 className="display-md">{t("doc.title")}</h1>
      </header>
      <Notice tone={waiting ? "info" : "warning"} title={waiting ? t("pending.title") : t("pending.closedTitle")}>
        {waiting ? t("pending.text", { car: isolateFor(locale)(b.carName) }) : t("pending.closedText", { status: tb(`status.labels.${b.status}`).toLocaleLowerCase(locale) })}
      </Notice>
      <Link href={href(`/booking?ref=${b.ref}`)} className="btn btn-primary w-fit">{t("pending.status")}</Link>
    </div>
  );
}

/**
 * /booking/agreement?ref=: the rental agreement for a confirmed request, its e-signature, and
 * the vehicle checks at handover and return. Client-only (the demo store is in this browser).
 */
export function AgreementView() {
  const t = useT("agreement");
  const tb = useT("booking");
  const locale = useLocale();
  const href = useHref();
  const params = useSearchParams();
  const ref = (params.get("ref") ?? "").trim().toUpperCase();
  const hydrated = useHydrated();
  const b = useBooking(ref);
  const bannerRef = useRef<HTMLDivElement>(null);

  if (!hydrated) return <FlowSkeleton />;
  if (!ref || !b) return <Lookup initial={ref} notFound={!!ref} />;
  const agreement = agreementFor(b);
  if (!agreement) return <NotIssued b={b} />;

  const car = getCar(b.carSlug);
  const open = agreementOpen(b.status);
  const signed = !!agreement.signedAt;
  const signerName = agreement.signerName ?? b.trip.driver.name;

  return (
    <div className="container-narrow grid gap-8 pb-24 pt-8 md:pt-12 print:block print:max-w-none print:p-0 print:text-black print:[&>*+*]:mt-6 print:[&_*]:border-neutral-300 print:[&_*]:text-black print:[&_*]:shadow-none print:[&_dl>div]:break-inside-avoid print:[&_li]:break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={href(`/booking?ref=${b.ref}`)} className="-ms-3 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted no-underline hover:text-fg">
          <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t("toolbar.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={b.status} />
          <span className={clsx("badge", signed ? "border-success/50 text-success" : open ? "border-warning/50 text-warning" : "badge-muted")}>
            {signed ? t("state.signed") : open ? t("state.awaiting") : t("state.closed")}
          </span>
        </div>
      </div>

      <Notice tone="info" className="print:border print:p-3">{t("demo")}</Notice>

      {agreement.signedAt && (
        <div ref={bannerRef} tabIndex={-1} className="notice notice-success outline-none focus-visible:outline-2 focus-visible:outline-ring print:hidden">
          <CircleCheck className="mt-0.5 h-5 w-5 flex-none text-success" aria-hidden="true" />
          <div className="grid gap-3">
            <div className="grid gap-1">
              <p className="font-semibold text-fg">{t("signed.banner")}</p>
              <p className="text-champagne">{t("signed.bannerText", { name: agreement.signerName ?? "", time: longStamp(agreement.signedAt, locale) })}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm w-fit gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t("toolbar.print")}
            </button>
          </div>
        </div>
      )}

      <AgreementDocument
        b={b}
        agreement={agreement}
        car={car}
        canSign={open}
        onSigned={() => requestAnimationFrame(() => bannerRef.current?.focus())}
      />

      {!signed && (
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <button type="button" className="btn btn-ghost btn-sm gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t("toolbar.print")}
          </button>
        </div>
      )}

      {(b.handoverCheck || b.trip.service === "self-drive") && <ConditionReportView bookingRef={b.ref} stage="handover" report={b.handoverCheck} canSign defaultName={signerName} />}
      {b.returnCheck && <ConditionReportView bookingRef={b.ref} stage="return" report={b.returnCheck} canSign defaultName={signerName} />}

      <p className="fine flex items-center gap-2 print:hidden">
        <FileSignature className="h-4 w-4 flex-none" aria-hidden="true" />
        <span>
          <bdi dir="ltr">{agreement.number}</bdi> · {t("doc.version")} {versionText(agreement.version, tb("badge.demo"))}
        </span>
      </p>
    </div>
  );
}
