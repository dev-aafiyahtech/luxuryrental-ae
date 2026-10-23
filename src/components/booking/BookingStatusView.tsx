"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Receipt, Search } from "lucide-react";
import { getCar } from "@/content/cars";
import { useHref, useT } from "@/i18n/client";
import { useBooking } from "@/lib/booking/draft";
import { updateBookingStatus } from "@/lib/booking/store";
import type { BookingRecord } from "@/lib/booking/types";
import { formatDay, nowInDubai } from "@/lib/dates";
import { formatAED } from "@/lib/format";
import { bookingMessage } from "@/lib/whatsapp";
import { Notice } from "@/components/ui";
import { BottomSheet } from "./BottomSheet";
import { Field, describedBy } from "./Field";
import { QuoteTable } from "./QuoteTable";
import { FlowSkeleton, Rows, StatusBadge, WhatsAppButton } from "./bits";
import { tripLines } from "./FlowShell";
import { useHydrated } from "./hooks";
import { canCustomerCancel, canPay, formatPhone, paymentFor } from "./lib";

/** "Fri 24 Oct, 14:05" in Dubai time for an ISO timestamp. */
export function stamp(iso: string): string {
  const n = nowInDubai(new Date(iso));
  return `${formatDay(n.date)}, ${n.time}`;
}

const REF_RE = /^LR-[0-9A-HJKMNP-TV-Z]{6}$/;

function Lookup({ initial, notFound }: { initial?: string; notFound?: boolean }) {
  const t = useT("booking");
  const href = useHref();
  const router = useRouter();
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    let v = value.trim().toUpperCase().replace(/\s+/g, "");
    if (/^[0-9A-Z]{6}$/.test(v)) v = `LR-${v}`;
    if (!REF_RE.test(v)) {
      setError(t("status.lookupError"));
      return;
    }
    setError("");
    router.push(href(`/booking?ref=${v}`));
  };
  return (
    <div className="container-narrow grid gap-8 pb-24 pt-10 md:pt-14">
      <header className="grid gap-3">
        <h1 className="display-md">{t("status.lookupTitle")}</h1>
        <p className="lede">{t("status.lookupLede")}</p>
      </header>
      {notFound && initial && <Notice tone="warning">{t("status.notFound", { ref: initial })}</Notice>}
      <form noValidate onSubmit={onSubmit} className="card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-6">
        <Field id="lookup-ref" label={t("status.lookupLabel")} error={error}>
          <input id="lookup-ref" className="input uppercase tabular" dir="ltr" autoComplete="off" spellCheck={false} value={value} placeholder="LR-7K3QZM" onChange={(e) => setValue(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={describedBy("lookup-ref", undefined, error)} />
        </Field>
        <button type="submit" className={clsx("btn btn-primary gap-2", error && "sm:mb-[26px]")}>
          <Search className="h-4 w-4" aria-hidden="true" />
          {t("status.lookupButton")}
        </button>
      </form>
      <div className="flex flex-wrap gap-3">
        <Link href={href("/cars")} className="btn btn-secondary">{t("status.browse")}</Link>
      </div>
    </div>
  );
}

function ReceiptCard({ b }: { b: BookingRecord }) {
  const t = useT("booking");
  const p = b.payment;
  const due = p ? Math.max(0, b.quote.total - p.amount) : 0;
  return (
    <section aria-labelledby="receipt-h" className="card grid gap-3 border-success/40 p-5 sm:p-6">
      <h2 id="receipt-h" className="flex items-center gap-2 text-[15px] font-semibold">
        <Receipt className="h-5 w-5 text-success" aria-hidden="true" />
        {t("status.receipt")}
      </h2>
      {p ? (
        <Rows
          rows={[
            { label: t("status.receiptRef"), value: <span className="font-semibold tabular" dir="ltr">{p.reference}</span> },
            { label: t("status.kind"), value: t(`status.kinds.${p.kind}`) },
            { label: t("status.amount"), value: <span className="font-semibold tabular">{formatAED(p.amount)}</span> },
            { label: t("status.paidAt"), value: stamp(p.paidAt) },
            { label: t("status.method"), value: t(`status.methods.${p.method}`) },
            { label: t("status.balance"), value: <span className="tabular">{formatAED(due)}</span> },
            { label: t("quote.depositShort"), value: b.quote.deposit ? <span className="tabular">{formatAED(b.quote.deposit)}</span> : "" },
          ]}
        />
      ) : (
        <p className="text-sm text-champagne">{t("status.methods.handover")}</p>
      )}
    </section>
  );
}

export function BookingStatusView() {
  const t = useT("booking");
  const href = useHref();
  const params = useSearchParams();
  const ref = (params.get("ref") ?? "").trim().toUpperCase();
  const hydrated = useHydrated();
  const b = useBooking(ref);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!hydrated) return <FlowSkeleton />;
  if (!ref || !b) return <Lookup initial={ref} notFound={!!ref} />;

  const lines = tripLines(b.trip, b.trip.service, t);
  const car = getCar(b.carSlug);
  const pay = paymentFor(b);
  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      await updateBookingStatus(b.ref, "cancelled", "customer", t("status.cancelNote"));
      setConfirmCancel(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-site grid gap-10 pb-24 pt-10 md:pt-14">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="label">{t("status.reference")}</p>
          <span className="font-semibold tabular tracking-[0.06em]" dir="ltr">{b.ref}</span>
          <StatusBadge status={b.status} />
        </div>
        <h1 className="display-md">{b.carName}</h1>
        <p className="lede text-champagne" aria-live="polite">{t(`status.text.${b.status}`)}</p>
        <div className="flex flex-wrap gap-3">
          {canPay(b.status) && (
            <Link href={href(`/pay?ref=${b.ref}`)} className="btn btn-primary">
              {pay.kind === "full" ? t("status.payFull") : t("status.pay")} · {formatAED(pay.amount)}
            </Link>
          )}
          {(b.status === "requested" || canPay(b.status)) && (
            <WhatsAppButton text={bookingMessage(b)} variant={b.status === "requested" ? "primary" : "secondary"}>{t("confirmed.whatsapp")}</WhatsAppButton>
          )}
          {canCustomerCancel(b.status) && (
            <button type="button" className="btn btn-ghost" aria-haspopup="dialog" onClick={() => setConfirmCancel(true)}>
              {b.status === "requested" ? t("status.cancel") : t("status.cancelBooking")}
            </button>
          )}
          {["declined", "cancelled", "expired"].includes(b.status) && (
            <>
              <Link href={href(`/book/trip?car=${b.carSlug}`)} className="btn btn-primary">{t("status.newRequest")}</Link>
              <Link href={href("/cars")} className="btn btn-secondary">{t("status.browse")}</Link>
            </>
          )}
        </div>
        <p className="fine">{t("status.live")}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:gap-14">
        <div className="grid content-start gap-10">
          {b.status === "paid" && <ReceiptCard b={b} />}
          <section aria-labelledby="details-h" className="grid gap-3">
            <h2 id="details-h" className="display-sm">{t("status.details")}</h2>
            <Rows
              rows={[
                { label: t("review.service"), value: b.trip.service === "chauffeur" ? t("reserve.chauffeur") : t("reserve.selfDrive") },
                { label: t("review.when"), value: <span className="tabular">{lines.when}</span> },
                { label: t("review.handover"), value: lines.where },
                { label: t("review.return"), value: lines.back.replace(`${t("review.return")}: `, "") },
                { label: t("review.name"), value: b.trip.driver.name },
                { label: t("review.phone"), value: b.trip.driver.phone ? <span dir="ltr" className="tabular">{formatPhone(b.trip.driver.phone)}</span> : "" },
              ]}
            />
          </section>
          {car && (
            <section aria-labelledby="price-h" className="grid gap-3">
              <h2 id="price-h" className="display-sm">{t("quote.breakdown")}</h2>
              <QuoteTable quote={b.quote} car={car} />
            </section>
          )}
        </div>
        <section aria-labelledby="history-h" className="card grid content-start gap-4 self-start p-5 sm:p-6">
          <h2 id="history-h" className="text-[15px] font-semibold">{t("status.timeline")}</h2>
          <ol className="m-0 grid list-none gap-0 p-0">
            {[...b.events].reverse().map((e, i) => (
              <li key={`${e.at}-${i}`} className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
                <span aria-hidden="true" className={clsx("mt-1.5 h-2.5 w-2.5 rounded-full", i === 0 ? "bg-accent" : "bg-line")} />
                <div className="grid gap-0.5">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {t(`status.labels.${e.status}`)}
                    <span className="font-normal text-muted">· {t(`status.by.${e.by}`)}</span>
                  </p>
                  {e.note && <p className="text-sm text-champagne">{e.note}</p>}
                  <p className="text-[12px] tabular text-muted">{stamp(e.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <BottomSheet
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={t("status.cancelTitle", { ref: b.ref })}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmCancel(false)}>{t("status.keep")}</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => void cancel()} aria-busy={busy || undefined}>
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
              {t("status.cancelConfirm")}
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <p className="text-champagne">{t("status.cancelText")}</p>
          {error && <p className="field-error" role="alert">{error}</p>}
        </div>
      </BottomSheet>
    </div>
  );
}
