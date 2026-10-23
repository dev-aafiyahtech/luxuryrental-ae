"use client";

import clsx from "clsx";
import type { Car } from "@/content/types";
import { rules } from "@/content/rules";
import { useT } from "@/i18n/client";
import type { Quote, QuoteLine } from "@/lib/pricing";
import { formatAED, formatNumber } from "@/lib/format";

function amountText(l: QuoteLine, t: (k: string) => string) {
  if (l.amount < 0) return `−${formatAED(-l.amount)}`;
  if (l.amount === 0) return l.kind === "rate" ? t("quote.included") : t("quote.free");
  return formatAED(l.amount);
}

/** Total line: "AED 13,650" or "From AED 120,000" (Bugatti, price on request). */
export function TotalText({ quote, className }: { quote: Quote | null; className?: string }) {
  const t = useT("booking");
  if (!quote || quote.total <= 0) return <span className={clsx("inline-block h-[1em] w-28 animate-pulse rounded bg-elevated motion-reduce:animate-none", className)} aria-hidden="true" />;
  return (
    <span className={clsx("tabular", className)}>
      {quote.onRequest && <span className="me-1.5 text-[0.6em] font-semibold uppercase tracking-[0.1em] text-muted">{t("quote.totalFrom")}</span>}
      {formatAED(quote.total)}
    </span>
  );
}

/**
 * Quote lines from lib/pricing quote(), the total incl. VAT, the VAT share, and the
 * refundable deposit shown separately (never part of the total, never charged online).
 */
export function QuoteTable({ quote, car, className, showDeposit = true, showKm = true }: { quote: Quote | null; car: Car; className?: string; showDeposit?: boolean; showKm?: boolean }) {
  const t = useT("booking");
  if (!quote || !quote.lines.length) {
    return <p className={clsx("text-sm text-muted", className)}>{t("quote.pending")}</p>;
  }
  const releaseDays = rules.tiers[car.tier].releaseDays;
  return (
    <div className={clsx("grid gap-4", className)}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{t("quote.caption")}</caption>
        <tbody>
          {quote.lines.map((l) => (
            <tr key={l.id} className="border-b border-line align-top">
              <th scope="row" className="py-2.5 pe-4 text-start font-normal">
                <span className="block text-fg">{l.label}</span>
                {l.detail && <span className="block text-[13px] leading-snug text-muted">{l.detail}</span>}
              </th>
              <td className={clsx("whitespace-nowrap py-2.5 text-end font-semibold tabular", l.amount < 0 ? "text-success" : "text-fg")}>{amountText(l, t)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pb-1 pt-3 text-start font-semibold text-fg">
              {quote.onRequest ? `${t("quote.total")} (${t("quote.totalFrom").toLowerCase()})` : t("quote.total")}
              <span className="ms-1.5 text-[13px] font-normal text-muted">{t("quote.inclVat")}</span>
            </th>
            <td className="whitespace-nowrap pb-1 pt-3 text-end text-lg font-bold tabular text-accent-hover">{formatAED(quote.total)}</td>
          </tr>
          <tr>
            <th scope="row" className="text-start text-[13px] font-normal text-muted">{t("quote.vat")}</th>
            <td className="text-end text-[13px] tabular text-muted">{formatAED(quote.vat)}</td>
          </tr>
        </tfoot>
      </table>
      {quote.onRequest && <p className="text-[13px] text-champagne">{t("quote.onRequest")}</p>}
      {showKm && quote.includedKm > 0 && <p className="text-[13px] text-muted">{t("quote.km", { km: formatNumber(quote.includedKm), fee: quote.extraKmFee })}</p>}
      {showDeposit &&
        (quote.deposit > 0 ? (
          <div className="grid gap-1 rounded-xl border border-line bg-bg/40 p-3.5">
            <p className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-champagne">{t("quote.deposit")}</span>
              <span className="whitespace-nowrap font-semibold tabular">{formatAED(quote.deposit)}</span>
            </p>
            <p className="text-[12px] leading-snug text-muted">{t("quote.depositNote", { days: releaseDays })}</p>
          </div>
        ) : (
          quote.service === "chauffeur" && <p className="text-[13px] text-muted">{t("quote.noDeposit")}</p>
        ))}
    </div>
  );
}
