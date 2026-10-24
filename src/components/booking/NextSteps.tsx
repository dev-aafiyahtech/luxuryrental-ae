"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { useHref, useT } from "@/i18n/client";
import { agreementFor } from "@/lib/booking/store";
import type { BookingRecord } from "@/lib/booking/types";
import { documentProgress, requiredDocuments, useAccount, useDocuments } from "@/lib/customer/store";
import { formatAED } from "@/lib/format";
import { DocumentsPanel } from "@/components/account/DocumentsPanel";
import { stamp } from "./BookingStatusView";
import { canPay, needsIdp, paymentFor } from "./lib";

type State = "done" | "todo" | "locked";

/**
 * "Before your rental" checklist on the request status page: documents (any time after the
 * request), the rental agreement (after confirmation), payment and the handover vehicle check.
 */
export function NextSteps({ b }: { b: BookingRecord }) {
  const t = useT("booking");
  const href = useHref();
  const driver = b.trip.driver;
  const docs = useDocuments(driver.phone);
  const account = useAccount();
  const [showDocs, setShowDocs] = useState(false);

  const required = requiredDocuments(driver, needsIdp);
  const progress = documentProgress(docs, required);
  const agreement = agreementFor(b);
  const pay = paymentFor(b);
  const check = b.handoverCheck;

  const steps: { id: string; title: string; text: string; state: State; action?: ReactNode }[] = [
    {
      id: "documents",
      title: t("next.docsTitle"),
      state: progress.allVerified ? "done" : "todo",
      text: progress.allVerified
        ? t("next.docsVerified")
        : progress.uploaded === 0
          ? t("next.docsNone")
          : t("next.docsProgress", { uploaded: progress.uploaded, total: progress.total, verified: progress.verified }) + (progress.rejected ? ` ${t("next.docsRejected", { n: progress.rejected })}` : ""),
      action: driver.phone ? (
        <button type="button" className="btn btn-secondary btn-sm gap-2" aria-expanded={showDocs} aria-controls="next-docs" onClick={() => setShowDocs((v) => !v)}>
          {progress.uploaded === 0 ? t("next.docsUpload") : t("next.docsManage")}
          <ChevronDown className={clsx("h-4 w-4 transition-transform motion-reduce:transition-none", showDocs && "rotate-180")} aria-hidden="true" />
        </button>
      ) : undefined,
    },
    {
      id: "agreement",
      title: t("next.agreementTitle"),
      state: agreement?.signedAt ? "done" : agreement ? "todo" : "locked",
      text: agreement?.signedAt ? t("next.agreementSigned", { when: stamp(agreement.signedAt) }) : agreement ? t("next.agreementReady") : t("next.agreementLocked"),
      action: agreement ? (
        <Link href={href(`/booking/agreement?ref=${b.ref}`)} className={clsx("btn btn-sm", agreement.signedAt ? "btn-secondary" : "btn-primary")}>
          {agreement.signedAt ? t("next.agreementView") : t("next.agreementSign")}
        </Link>
      ) : undefined,
    },
    {
      id: "payment",
      title: b.trip.service === "chauffeur" ? t("next.payFullTitle") : t("next.payTitle"),
      state: b.status === "paid" ? "done" : canPay(b.status) ? "todo" : "locked",
      text: b.status === "paid" ? t("next.paid") : canPay(b.status) ? t("next.payReady", { amount: formatAED(pay.amount) }) : t("next.payLocked"),
      action: canPay(b.status) ? <Link href={href(`/pay?ref=${b.ref}`)} className="btn btn-secondary btn-sm">{t("next.payButton")}</Link> : undefined,
    },
    {
      id: "handover",
      title: t("next.checkTitle"),
      state: check?.customerSignedAt ? "done" : check ? "todo" : "locked",
      text: check?.customerSignedAt ? t("next.checkSigned") : check ? t("next.checkReady") : t("next.checkLocked"),
      action: check ? (
        <Link href={href(`/booking/agreement?ref=${b.ref}#handover-check`)} className={clsx("btn btn-sm", check.customerSignedAt ? "btn-secondary" : "btn-primary")}>
          {check.customerSignedAt ? t("next.checkView") : t("next.checkConfirm")}
        </Link>
      ) : undefined,
    },
  ];
  const done = steps.filter((s) => s.state === "done").length;

  return (
    <section id="next-steps" aria-labelledby="next-h" className="grid scroll-mt-28 gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="next-h" className="display-sm">{t("next.title")}</h2>
        <p className="text-sm text-muted tabular">{t("next.count", { done, total: steps.length })}</p>
      </div>
      <ol className="m-0 grid list-none gap-3 p-0">
        {steps.map((s, i) => (
          <li key={s.id} className={clsx("card grid gap-3 p-4 sm:p-5", s.state === "locked" && "opacity-80")}>
            <div className="grid grid-cols-[32px_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
              <span
                aria-hidden="true"
                className={clsx(
                  "grid h-8 w-8 place-items-center rounded-full border text-[13px] font-bold",
                  s.state === "done" ? "border-accent bg-accent text-on-accent" : s.state === "todo" ? "border-accent text-accent-hover" : "border-line text-muted",
                )}
              >
                {s.state === "done" ? <Check className="h-4 w-4" /> : s.state === "locked" ? <Lock className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="grid gap-0.5">
                <p className="font-semibold">
                  {s.title}
                  <span className="sr-only">, {t(`next.state.${s.state}`)}</span>
                </p>
                <p className="text-sm text-champagne">{s.text}</p>
              </div>
              {s.action && <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-3">{s.action}</div>}
            </div>
            {s.id === "documents" && showDocs && driver.phone && (
              <div id="next-docs" className="border-t border-line pt-4">
                <DocumentsPanel phone={driver.phone} driver={driver} headingLevel="h3" />
              </div>
            )}
          </li>
        ))}
      </ol>
      {!account.signedIn && (
        <p className="text-sm text-muted">
          {t("next.accountPrompt")}{" "}
          <Link href={href("/account")} className="font-semibold text-fg">{t("next.accountLink")}</Link>
        </p>
      )}
    </section>
  );
}
