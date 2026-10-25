"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useT } from "@/i18n/client";
import { formatDayLong, nowInDubai } from "@/lib/dates";

/** "Friday 24 October 2026, 14:05" (Arabic "الجمعة 24 أكتوبر 2026، 14:05") in Dubai time for an ISO timestamp (documents need the year). */
export function longStamp(iso: string, locale?: string): string {
  const n = nowInDubai(new Date(iso));
  return `${formatDayLong(n.date, locale)}${locale === "ar" ? "، " : ", "}${n.time}`;
}

/** "Friday 24 October 2026" in Dubai time. */
export const longDate = (iso: string, locale?: string) => formatDayLong(nowInDubai(new Date(iso)).date, locale);

/** Numbered section of the agreement document. */
export function DocSection({ n, id, title, lede, children, className }: { n: number; id: string; title: string; lede?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={clsx("grid gap-4 border-t border-line pt-6 print:block print:pt-4 print:[&>*+*]:mt-3", className)}>
      <div className="grid gap-1.5 print:break-after-avoid">
        <h2 id={id} className="flex items-baseline gap-3 font-display text-[13px] font-bold uppercase tracking-[0.14em] text-fg [&:lang(ar)]:text-[15px]">
          <span className="text-accent tabular" aria-hidden="true">{String(n).padStart(2, "0")}</span>
          {title}
        </h2>
        {lede && <p className="text-sm text-muted">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

/** Fuel level in eighths: an 8-segment bar plus the value as text (never the bar alone). */
export function FuelGauge({ eighths, className }: { eighths: number; className?: string }) {
  const t = useT("agreement");
  const n = Math.max(0, Math.min(8, Math.round(eighths)));
  const word = t(`fuel.${n}`);
  return (
    <span className={clsx("inline-flex flex-wrap items-center gap-3", className)}>
      {/* Fills from the start side: right to left in Arabic, like a progress bar. */}
      <svg viewBox="0 0 104 14" aria-hidden="true" className="h-3.5 w-[104px] flex-none rtl:-scale-x-100">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={i * 13 + 0.75} y="0.75" width="11.5" height="12.5" rx="2.5" strokeWidth="1.5" className={i < n ? "fill-accent stroke-accent print:fill-neutral-700 print:stroke-neutral-700" : "fill-none stroke-line print:stroke-neutral-400"} />
        ))}
      </svg>
      <span className="tabular">
        {t("fuel.value", { n })}
        {word !== `fuel.${n}` && <span className="text-muted"> · {word}</span>}
      </span>
    </span>
  );
}
