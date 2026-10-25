"use client";

import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useHref, useT } from "@/i18n/client";
import type { BookingStatus } from "@/lib/booking/types";
import { whatsappHref } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { STEPS, type StepId } from "./lib";

/** "Step 2 of 4" + title + Back, with a 4-part progress list. */
export function StepHeader({ step, title, backHref, children }: { step: StepId; title: string; backHref: string; children?: ReactNode }) {
  const t = useT("booking");
  const href = useHref();
  const n = STEPS.indexOf(step) + 1;
  return (
    <header className="grid gap-4 pb-8 pt-6 md:pt-10">
      <Link href={href(backHref)} className="-ms-3 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted no-underline hover:text-fg">
        <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        {t("steps.back")}
      </Link>
      <ol aria-label={t("steps.progress")} className="m-0 grid list-none grid-cols-4 gap-2 p-0">
        {STEPS.map((s, i) => {
          const state = i + 1 < n ? "done" : i + 1 === n ? "current" : "todo";
          return (
            <li key={s} aria-current={state === "current" ? "step" : undefined} className="grid gap-2">
              <span aria-hidden="true" className={clsx("h-1 rounded-full", state === "todo" ? "bg-line" : "bg-accent")} />
              <span className={clsx("text-[11px] font-semibold uppercase tracking-[0.14em]", state === "current" ? "text-fg" : "text-muted")}>
                {t(`steps.${s}`)}
                {state !== "todo" && <span className="sr-only">, {t(state === "done" ? "steps.done" : "steps.current")}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="grid gap-2">
        <p className="label">{t("steps.of", { n, total: STEPS.length })}</p>
        <h1 className="display-sm md:text-[1.75rem]">{title}</h1>
      </div>
      {children}
    </header>
  );
}

/** WhatsApp hand-off button: secondary style, glyph in currentColor (never gold). */
export function WhatsAppButton({ text, children, className, variant = "secondary", block, size }: { text: string; children: ReactNode; className?: string; variant?: "primary" | "secondary"; block?: boolean; size?: "sm" }) {
  return (
    <a href={whatsappHref(text)} target="_blank" rel="noopener" className={clsx("btn", `btn-${variant}`, block && "btn-block", size === "sm" && "btn-sm", className)}>
      <WhatsAppIcon className="h-5 w-5 flex-none" />
      {children}
    </a>
  );
}

/** Quiet "Finish on WhatsApp" link with what has been entered so far. */
export function FinishOnWhatsApp({ text, className }: { text: string; className?: string }) {
  const t = useT("booking");
  return (
    <p className={clsx("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted", className)}>
      <span>{t("flow.finishWhatsAppHint")}</span>
      <a href={whatsappHref(text)} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-fg underline decoration-accent/60 underline-offset-4 hover:decoration-accent">
        <WhatsAppIcon className="h-4 w-4" />
        {t("flow.finishWhatsApp")}
      </a>
    </p>
  );
}

const toneClass: Record<BookingStatus, string> = {
  requested: "border-warning/50 text-warning",
  confirmed: "border-success/50 text-success",
  awaiting_payment: "border-info/50 text-info",
  paid: "border-success/50 text-success",
  declined: "border-line text-muted",
  cancelled: "border-line text-muted",
  expired: "border-line text-muted",
};

/** Status as text in a badge (never colour alone). */
export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const t = useT("booking");
  return <span className={clsx("badge", toneClass[status], className)}>{t(`status.labels.${status}`)}</span>;
}

/** Definition rows for summaries. */
export function Rows({ rows, className }: { rows: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={clsx("m-0 grid gap-0", className)}>
      {rows
        .filter((r) => r.value !== undefined && r.value !== null && r.value !== "")
        .map((r) => (
          <div key={r.label} className="grid gap-1 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted sm:pt-0.5">{r.label}</dt>
            <dd className="m-0 min-w-0 break-words text-[15px] text-fg">{r.value}</dd>
          </div>
        ))}
    </dl>
  );
}

/** Loading placeholder for client-only booking views (static under reduced motion). */
export function FlowSkeleton({ label }: { label?: string }) {
  return (
    <div className="container-site grid gap-6 pb-24 pt-10" aria-busy="true">
      {label && <p className="sr-only" role="status">{label}</p>}
      <div className="h-4 w-24 animate-pulse rounded bg-card motion-reduce:animate-none" />
      <div className="h-8 w-64 max-w-full animate-pulse rounded bg-card motion-reduce:animate-none" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,640px)_1fr] lg:gap-16">
        <div className="h-[420px] animate-pulse rounded-2xl bg-card motion-reduce:animate-none" />
        <div className="hidden h-[360px] animate-pulse rounded-3xl bg-card motion-reduce:animate-none lg:block" />
      </div>
    </div>
  );
}

/** A flight number ("EK 202"), kept left to right inside Arabic text. */
export const flightText = (flight?: string) => (flight ? <span dir="ltr" className="tabular">{flight.toUpperCase()}</span> : undefined);

/** Fill {placeholders} in a translated template with React nodes (e.g. links inside a label). */
export function rich(template: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return template.split(/\{(\w+)\}/g).map((part, i) => (i % 2 ? <span key={i}>{nodes[part] ?? `{${part}}`}</span> : part));
}
