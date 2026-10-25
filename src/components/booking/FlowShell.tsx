"use client";

import clsx from "clsx";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Car } from "@/content/types";
import { getZone } from "@/content/zones";
import { useHref, useLocale, useT } from "@/i18n/client";
import type { Quote, ServiceMode } from "@/lib/pricing";
import type { TripDraft } from "@/lib/booking/types";
import { formatDay } from "@/lib/dates";
import { CarArt } from "@/components/car/CarArt";
import { Notice } from "@/components/ui";
import { BottomSheet } from "./BottomSheet";
import { ErrorSummary, type FormError } from "./ErrorSummary";
import { QuoteTable, TotalText } from "./QuoteTable";
import { FinishOnWhatsApp, StepHeader } from "./bits";
import { useDockHeight, useDraftQuote, useFlowCar, usePortalTarget, useReducedMotion } from "./hooks";
import { fullDraftMessage, listSep, packageText, stepPath, zoneName, type StepId } from "./lib";

/** Short "when" and "where" lines for a draft, in `locale` (dates, zone names, package, punctuation). */
export function tripLines(trip: TripDraft, service: ServiceMode, t: (k: string, v?: Record<string, string | number>) => string, locale?: string) {
  const sep = listSep(locale);
  const arrow = locale === "ar" ? "←" : "→";
  const when =
    service === "chauffeur"
      ? trip.pickupDate ? `${formatDay(trip.pickupDate, locale)}${sep}${trip.pickupTime} · ${packageText(trip, locale)}` : ""
      : trip.pickupDate && trip.returnDate ? `${formatDay(trip.pickupDate, locale)}${sep}${trip.pickupTime} ${arrow} ${formatDay(trip.returnDate, locale)}${sep}${trip.returnTime}` : "";
  let where: string;
  if (service === "chauffeur") where = `${t("trip.pickupZone")}: ${zoneName(trip.pickup.zone, locale)}${trip.pickup.address ? `${sep}${trip.pickup.address}` : ""}`;
  else if (trip.handover === "collect") where = t("trip.dsoTitle");
  else where = `${t("trip.delivery")}: ${zoneName(trip.pickup.zone, locale)}${trip.pickup.address ? `${sep}${trip.pickup.address}` : ""}`;
  const back = service === "self-drive" && !trip.sameReturn ? `${t("review.return")}: ${zoneName(trip.dropoff.zone, locale)}${trip.dropoff.address ? `${sep}${trip.dropoff.address}` : ""}` : "";
  return { when, where, back };
}

export function QuoteSummary({ car, trip, quote, service, className }: { car: Car; trip: TripDraft; quote: Quote | null; service: ServiceMode; className?: string }) {
  const t = useT("booking");
  const locale = useLocale();
  const { when, where, back } = tripLines(trip, service, t, locale);
  return (
    <section aria-label={t("quote.summary")} className={clsx("glass grid gap-5 p-6", className)}>
      <div className="flex items-center gap-4">
        <CarArt car={car} view="card" className="aspect-[4/3] w-28 flex-none rounded-xl border border-line bg-bg" sizes="112px" locale={locale} />
        <div className="grid min-w-0 gap-1">
          <p className="label">{t("quote.summary")}</p>
          <p className="font-semibold leading-snug text-fg">{car.name}</p>
          <p className="text-[13px] text-muted">{service === "chauffeur" ? t("reserve.chauffeur") : t("reserve.selfDrive")}</p>
        </div>
      </div>
      {(when || where) && (
        <div className="grid gap-1 text-sm">
          {when && <p className="font-semibold tabular text-fg">{when}</p>}
          <p className="text-champagne">{where}</p>
          {back && <p className="text-champagne">{back}</p>}
        </div>
      )}
      <QuoteTable quote={quote} car={car} />
      <p className="fine">{t("quote.nothingCharged")}</p>
    </section>
  );
}

/** Mobile sticky bar: total (opens the breakdown) + the step's main action. */
export function ActionBar({ quote, formId, label, busy, onDetails, disabled }: { quote: Quote | null; formId: string; label: string; busy?: boolean; onDetails: () => void; disabled?: boolean }) {
  const t = useT("booking");
  const ref = useRef<HTMLDivElement>(null);
  const target = usePortalTarget();
  useDockHeight(ref, !!target);
  if (!target) return null;
  return createPortal(
    <div ref={ref} className="fixed inset-x-0 bottom-0 z-[var(--z-dock)] print:hidden border-t border-line bg-card/95 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(10,28,28,0.5)] lg:hidden">
      <div className="container-site flex items-center gap-3">
        <button type="button" onClick={onDetails} className="grid min-h-12 min-w-0 flex-1 justify-items-start rounded-xl px-1 text-start" aria-haspopup="dialog">
          <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {t("quote.showBreakdown")}
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-fg">
            <TotalText quote={quote} />
          </span>
        </button>
        <button type="submit" form={formId} className="btn btn-primary flex-none px-6" aria-busy={busy || undefined} aria-disabled={disabled || busy || undefined}>
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
          {label}
        </button>
      </div>
    </div>,
    target,
  );
}

/** Shared state for a /book step: the car (from ?car= or the draft), the priced draft and navigation. */
export function useFlow() {
  const { car, carParam } = useFlowCar();
  const dq = useDraftQuote(car);
  const router = useRouter();
  const href = useHref();
  const go = useCallback((step: StepId | "confirmed", extra?: Record<string, string>) => router.push(href(stepPath(step, car, dq.service, extra))), [router, href, car, dq.service]);
  return { ...dq, car, carParam, go, href, router };
}

/** Error-summary state: inline errors after blur, everything after a submit attempt. */
export function useErrors() {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [submitted, setSubmitted] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const touch = useCallback((id: string) => setTouched((s) => (s.has(id) ? s : new Set(s).add(id))), []);
  const visible = (errors: FormError[], id: string) => (submitted || touched.has(id) ? errors.find((e) => e.id === id)?.message : undefined);
  /** Call on submit: returns true when there are no errors; otherwise focuses the summary. */
  const check = (errors: FormError[]) => {
    setSubmitted(true);
    if (!errors.length) return true;
    requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      summaryRef.current?.focus({ preventScroll: true });
    });
    return false;
  };
  return { touch, visible, check, submitted, summaryRef };
}

/**
 * Layout for a /book step. Desktop: form on the left (max 640 px) and a sticky quote summary on
 * the right. Mobile: one column and a sticky bar "AED 13,650 · Continue" whose total opens the
 * breakdown in a bottom sheet.
 */
export function FlowShell({ step, title, backHref, car, trip, quote, service, formId, actionLabel, busy, errors, showErrors, summaryRef, children, after, outOfHours, intro }: {
  step: StepId;
  title: string;
  backHref: string;
  car: Car;
  trip: TripDraft;
  quote: Quote | null;
  service: ServiceMode;
  formId: string;
  actionLabel: string;
  busy?: boolean;
  errors: FormError[];
  showErrors: boolean;
  summaryRef: React.RefObject<HTMLDivElement | null>;
  children: ReactNode;
  after?: ReactNode;
  outOfHours?: boolean;
  intro?: ReactNode;
}) {
  const t = useT("booking");
  const locale = useLocale();
  const [sheet, setSheet] = useState(false);
  return (
    <div className="container-site pb-40 lg:pb-24">
      <StepHeader step={step} title={title} backHref={backHref} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,640px)_minmax(340px,1fr)] lg:gap-14 xl:gap-20">
        <div className="grid min-w-0 max-w-[640px] content-start gap-8">
          {intro}
          {outOfHours && <Notice tone="info">{t("flow.oohNotice")}</Notice>}
          {showErrors && errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} title={t("form.errorTitle")} />}
          {children}
          <div className="hidden lg:block">
            <button type="submit" form={formId} className="btn btn-primary" aria-busy={busy || undefined} aria-disabled={busy || undefined}>
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
              {actionLabel}
            </button>
          </div>
          {after}
          <FinishOnWhatsApp text={fullDraftMessage(trip, car, quote, locale)} className="border-t border-line pt-6" />
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+24px)]">
            <QuoteSummary car={car} trip={trip} quote={quote} service={service} />
          </div>
        </aside>
      </div>
      <ActionBar quote={quote} formId={formId} label={actionLabel} busy={busy} onDetails={() => setSheet(true)} />
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={t("quote.breakdown")}>
        <QuoteSummary car={car} trip={trip} quote={quote} service={service} className="border-0 bg-transparent p-0 shadow-none [backdrop-filter:none]" />
      </BottomSheet>
    </div>
  );
}

/** Shown on steps 2–4 when there is no car in the URL or the draft. */
export function NeedsCar() {
  const t = useT("booking");
  const href = useHref();
  return (
    <div className="container-narrow grid gap-6 pb-24 pt-12">
      <Notice tone="info" title={t("flow.needsCar")} />
      <a className="btn btn-primary w-fit" href={href("/book/trip")}>{t("flow.noCarTitle")}</a>
    </div>
  );
}

export const zoneIsAirport = (slug?: string) => !!slug && getZone(slug)?.kind === "airport";
