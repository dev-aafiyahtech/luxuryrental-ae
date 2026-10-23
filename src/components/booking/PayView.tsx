"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, FlaskConical } from "lucide-react";
import { useHref, useT } from "@/i18n/client";
import { useBooking } from "@/lib/booking/draft";
import { recordDemoPayment } from "@/lib/booking/store";
import { formatAED } from "@/lib/format";
import { Notice } from "@/components/ui";
import { FlowSkeleton, Rows, StatusBadge } from "./bits";
import { tripLines } from "./FlowShell";
import { useHydrated } from "./hooks";
import { canPay, paymentFor } from "./lib";

/**
 * Mock checkout (plan D-09, 05 C-12). No card fields and no card logos: two buttons simulate
 * the payment provider's result. Success records a DEMO- payment and returns to the status page.
 */
export function PayView() {
  const t = useT("booking");
  const href = useHref();
  const router = useRouter();
  const params = useSearchParams();
  const ref = (params.get("ref") ?? "").toUpperCase();
  const hydrated = useHydrated();
  const b = useBooking(ref);
  const [busy, setBusy] = useState<"" | "ok" | "fail">("");
  const [failed, setFailed] = useState(false);
  const failRef = useRef<HTMLDivElement>(null);

  if (!hydrated) return <FlowSkeleton />;

  const banner = (
    <div role="note" className="flex items-start gap-3 rounded-2xl border-2 border-warning/70 bg-card p-5">
      <FlaskConical className="mt-0.5 h-6 w-6 flex-none text-warning" aria-hidden="true" />
      <div className="grid gap-1">
        <p className="text-lg font-semibold text-fg">{t("pay.banner")}</p>
        <p className="text-sm text-champagne">{t("pay.bannerText")}</p>
      </div>
    </div>
  );

  if (!b) {
    return (
      <div className="container-narrow grid gap-6 pb-24 pt-10">
        {banner}
        <Notice tone="warning" title={t("pay.notFound")} />
        <Link href={href("/booking")} className="btn btn-secondary w-fit">{t("status.lookupTitle")}</Link>
      </div>
    );
  }

  const pay = paymentFor(b);
  const lines = tripLines(b.trip, b.trip.service, t);
  const back = href(`/booking?ref=${b.ref}`);

  const simulate = async (ok: boolean) => {
    if (busy) return;
    setFailed(false);
    if (!ok) {
      setBusy("fail");
      await new Promise((r) => setTimeout(r, 900));
      setBusy("");
      setFailed(true);
      requestAnimationFrame(() => failRef.current?.focus());
      return;
    }
    setBusy("ok");
    try {
      await recordDemoPayment(b.ref, pay.amount, pay.kind);
      router.push(back);
    } catch {
      setBusy("");
      setFailed(true);
    }
  };

  return (
    <div className="container-narrow grid gap-8 pb-24 pt-10 md:pt-14">
      {banner}
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
            <p className="font-display text-4xl font-bold text-accent-hover tabular">{formatAED(pay.amount)}</p>
            <p className="text-sm text-muted">{pay.kind === "full" ? t("pay.fullNote") : t("pay.advanceNote")}</p>
          </div>
          <Rows
            rows={[
              { label: t("review.car"), value: b.carName },
              { label: t("review.when"), value: <span className="tabular">{lines.when}</span> },
              { label: t("quote.total"), value: <span className="tabular">{b.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}{formatAED(b.quote.total)} <span className="text-muted">{t("quote.inclVat")}</span></span> },
              { label: t("pay.balance"), value: <span className="tabular">{formatAED(Math.max(0, b.quote.total - pay.amount))}</span> },
              { label: t("quote.depositShort"), value: b.quote.deposit ? <span className="tabular">{formatAED(b.quote.deposit)}</span> : "" },
            ]}
          />
          {failed && (
            <div ref={failRef} tabIndex={-1} role="alert" className="notice notice-danger outline-none">
              <CircleAlert className="mt-0.5 h-5 w-5 flex-none text-danger" aria-hidden="true" />
              <p>{t("pay.failed")}</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn btn-primary" onClick={() => void simulate(true)} aria-busy={busy === "ok" || undefined} aria-disabled={!!busy || undefined}>
              {busy === "ok" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
              {busy === "ok" ? t("pay.processing") : t("pay.success")}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => void simulate(false)} aria-busy={busy === "fail" || undefined} aria-disabled={!!busy || undefined}>
              {busy === "fail" && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
              {t("pay.fail")}
            </button>
          </div>
          <p className="sr-only" aria-live="polite">{busy === "ok" ? t("pay.processing") : ""}</p>
          <Link href={back} className="w-fit text-sm font-semibold text-muted underline underline-offset-4 hover:text-fg">{t("pay.back")}</Link>
        </section>
      )}
    </div>
  );
}
