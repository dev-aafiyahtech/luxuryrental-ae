"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, LockKeyhole } from "lucide-react";
import { useHref, useLocale, useT } from "@/i18n/client";
import { useBooking } from "@/lib/booking/draft";
import { recordDemoPayment } from "@/lib/booking/store";
import { formatAED } from "@/lib/format";
import { Notice } from "@/components/ui";
import { FlowSkeleton, Rows, StatusBadge } from "./bits";
import { tripLines } from "./FlowShell";
import { useHydrated } from "./hooks";
import { canPay, paymentFor } from "./lib";

/**
 * Checkout step (plan D-09, 05 C-12). No card fields and no card logos: until the payment
 * provider is connected, "Pay securely" records the payment and returns to the status page.
 * `?fail=1` makes the first attempt fail, to show the error state.
 */
export function PayView() {
  const t = useT("booking");
  const locale = useLocale();
  const href = useHref();
  const router = useRouter();
  const params = useSearchParams();
  const ref = (params.get("ref") ?? "").toUpperCase();
  const hydrated = useHydrated();
  const b = useBooking(ref);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [failNext, setFailNext] = useState(() => params.get("fail") === "1");
  const failRef = useRef<HTMLDivElement>(null);

  if (!hydrated) return <FlowSkeleton />;

  if (!b) {
    return (
      <div className="container-narrow grid gap-6 pb-24 pt-10">
        <h1 className="display-md">{t("status.lookupTitle")}</h1>
        <Notice tone="warning" title={t("pay.notFound")} />
        <Link href={href("/booking")} className="btn btn-secondary w-fit">{t("status.lookupTitle")}</Link>
      </div>
    );
  }

  const pay = paymentFor(b);
  const lines = tripLines(b.trip, b.trip.service, t, locale);
  const back = href(`/booking?ref=${b.ref}`);

  const payNow = async () => {
    if (busy) return;
    setFailed(false);
    setBusy(true);
    if (failNext) {
      await new Promise((r) => setTimeout(r, 900));
      setFailNext(false);
      setBusy(false);
      setFailed(true);
      requestAnimationFrame(() => failRef.current?.focus());
      return;
    }
    try {
      await recordDemoPayment(b.ref, pay.amount, pay.kind);
      router.push(back);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <div className="container-narrow grid gap-8 pb-24 pt-10 md:pt-14">
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold tabular tracking-[0.06em]" dir="ltr">{b.ref}</span>
          <StatusBadge status={b.status} />
        </div>
        <h1 className="display-md">{pay.kind === "full" ? t("pay.titleFull") : t("pay.title")}</h1>
      </header>

      {!canPay(b.status) ? (
        <div className="grid gap-4">
          <Notice tone="info" title={t("pay.notPayable")}>{t("pay.notPayableText", { status: t(`status.labels.${b.status}`) })}</Notice>
          <Link href={back} className="btn btn-secondary w-fit">{t("pay.back")}</Link>
        </div>
      ) : (
        <section aria-labelledby="due-h" className="card grid gap-6 p-5 sm:p-8">
          <div className="grid gap-1">
            <p id="due-h" className="label">{t("pay.amountDue")}</p>
            <p className="font-display text-4xl font-bold text-accent-hover tabular">{formatAED(pay.amount, locale)}</p>
            <p className="text-sm text-muted">{pay.kind === "full" ? t("pay.fullNote") : t("pay.advanceNote")}</p>
          </div>
          <Rows
            rows={[
              { label: t("review.car"), value: b.carName },
              { label: t("review.when"), value: <span className="tabular">{lines.when}</span> },
              { label: t("quote.total"), value: <span className="tabular">{b.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}{formatAED(b.quote.total, locale)} <span className="text-muted">{t("quote.inclVat")}</span></span> },
              { label: t("pay.balance"), value: <span className="tabular">{formatAED(Math.max(0, b.quote.total - pay.amount), locale)}</span> },
              { label: t("quote.depositShort"), value: b.quote.deposit ? <span className="tabular">{formatAED(b.quote.deposit, locale)}</span> : "" },
            ]}
          />
          {failed && (
            <div ref={failRef} tabIndex={-1} role="alert" className="notice notice-danger outline-none">
              <CircleAlert className="mt-0.5 h-5 w-5 flex-none text-danger" aria-hidden="true" />
              <p>{t("pay.failed")}</p>
            </div>
          )}
          <button type="button" className="btn btn-primary w-full sm:w-fit" onClick={() => void payNow()} aria-busy={busy || undefined} aria-disabled={busy || undefined}>
            {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            {busy ? t("pay.processing") : t("pay.success")}
          </button>
          <p className="sr-only" aria-live="polite">{busy ? t("pay.processing") : ""}</p>
          <Link href={back} className="w-fit text-sm font-semibold text-muted underline underline-offset-4 hover:text-fg">{t("pay.back")}</Link>
        </section>
      )}
    </div>
  );
}
