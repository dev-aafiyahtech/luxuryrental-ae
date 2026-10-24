"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CalendarDays, PencilLine } from "lucide-react";
import { categories } from "@/content/brands";
import { getCar } from "@/content/cars";
import { rules } from "@/content/rules";
import { useHref, useT } from "@/i18n/client";
import { useTripDraft } from "@/lib/booking/draft";
import { formatDay, formatRange, todayInDubai } from "@/lib/dates";
import { BottomSheet } from "./BottomSheet";
import { DateChips } from "./DateChips";
import { DateRangePicker } from "./DateRangePicker";
import { TimeSelect } from "./TimeSelect";
import { useDockHeight, useMediaQuery, useNow, usePortalTarget } from "./hooks";
import { bumpTime, deliveryZones, earliestAfter, isReplyOutOfHours, maxDate } from "./lib";

export interface DockProps {
  /** Hide the dock while another booking form is on screen (e.g. homepage chapter 4). */
  hidden?: boolean;
  className?: string;
}

/** Window event other components dispatch (cancelable) to ask the dock to open; the dock calls preventDefault(). */
const DOCK_OPEN_EVENT = "lr:dock:open";

/**
 * Trip dock. Desktop (≥1024 px): a bottom-centre glass panel (where · from · until · type ·
 * Check availability). Mobile: a collapsed bar "Your trip · Fri 24 – Mon 27 Oct · Edit trip"
 * that opens the same fields in a bottom sheet. Everything is saved in the shared trip draft;
 * Check availability goes to /cars (with ?category= when a type is chosen).
 */
export function Dock({ hidden, className }: DockProps) {
  const t = useT("booking");
  const href = useHref();
  const router = useRouter();
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [trip, update, hydrated] = useTripDraft();
  const now = useNow();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const wide = useMediaQuery("(min-width: 768px)");
  const [type, setType] = useState("");
  const [sheet, setSheet] = useState<null | "dates" | "trip">(null);
  const ready = hydrated && now > 0;
  const target = usePortalTarget();
  useDockHeight(ref, !hidden && !!target);

  const nowDate = new Date(now);
  const today = ready ? todayInDubai(nowDate) : "";
  const earliest = ready ? earliestAfter(rules.tiers.L.leadHours, nowDate) : null;
  const ooh = ready && isReplyOutOfHours(nowDate);

  // Let other components (e.g. the fleet trip bar) open the dock.
  const desktopRef = useRef(desktop);
  useEffect(() => {
    desktopRef.current = desktop;
  });
  useEffect(() => {
    if (hidden) return;
    const onOpen = (e: Event) => {
      e.preventDefault();
      setSheet(desktopRef.current ? "dates" : "trip");
    };
    window.addEventListener(DOCK_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(DOCK_OPEN_EVENT, onOpen);
  }, [hidden]);

  const where = trip.handover === "collect" ? "dso" : trip.pickup.zone;
  const setWhere = (v: string) => (v === "dso" ? update({ handover: "collect" }) : update({ handover: "delivery", pickup: { zone: v } }));
  const setRange = (r: { start: string; end?: string }) => update({ pickupDate: r.start, ...(r.end ? { returnDate: r.end } : {}), pickupTime: earliest ? bumpTime(r.start, trip.pickupTime, earliest) : trip.pickupTime });

  const go = () => {
    update({}); // stamps the draft so the fleet shows "Your trip"
    setSheet(null);
    router.push(href(`/cars${type ? `?category=${type}` : ""}`));
  };

  const range = ready && trip.pickupDate && trip.returnDate ? formatRange(trip.pickupDate, trip.returnDate) : "";
  const fromText = ready && trip.pickupDate ? `${formatDay(trip.pickupDate)} · ${trip.pickupTime}` : "—";
  const untilText = ready && trip.returnDate ? `${formatDay(trip.returnDate)} · ${trip.returnTime}` : "—";
  const pending = ready && trip.carSlug && trip.updatedAt > 0 ? getCar(trip.carSlug) : undefined;

  const whereSelect = (id: string, compact?: boolean) => (
    <select id={id} className={clsx("input", compact && "min-h-11 py-2.5 text-[15px]")} value={where} onChange={(e) => setWhere(e.target.value)}>
      <option value="dso">{t("dock.collectDso")}</option>
      {deliveryZones.map((z) => <option key={z.slug} value={z.slug}>{z.name}</option>)}
    </select>
  );
  const typeSelect = (id: string, compact?: boolean) => (
    <select id={id} className={clsx("input", compact && "min-h-11 py-2.5 text-[15px]")} value={type} onChange={(e) => setType(e.target.value)}>
      <option value="">{t("dock.anyType")}</option>
      {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
    </select>
  );

  const dates = earliest && (
    <div className="grid min-w-0 grid-cols-1 gap-5 [&>*]:min-w-0">
      <DateChips today={today} earliest={earliest.date} start={trip.pickupDate} end={trip.returnDate} onPick={(r) => setRange(r)} />
      <DateRangePicker
        label={t("picker.label")}
        start={trip.pickupDate}
        end={trip.returnDate}
        min={earliest.date}
        max={maxDate(today)}
        today={today}
        months={wide ? 2 : 1}
        onChange={setRange}
        announce={range}
      />
      <div className="grid grid-cols-2 gap-3">
        <TimeSelect id={`${uid}-pt`} label={t("time.pickup")} value={trip.pickupTime} date={trip.pickupDate} earliest={earliest} onChange={(v) => update({ pickupTime: v })} />
        <TimeSelect id={`${uid}-rt`} label={t("time.return")} value={trip.returnTime} onChange={(v) => update({ returnTime: v })} />
      </div>
    </div>
  );

  const continueLink = pending && (
    <Link href={href(`/book/trip?car=${pending.slug}`)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent-hover no-underline hover:text-fg">
      {t("dock.continue", { car: pending.model })}
      <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
    </Link>
  );

  const field = "grid min-w-0 gap-1";
  const fieldLabel = "ps-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted";
  const dateButton = "flex min-h-11 w-full items-center gap-2 rounded-xl border border-input bg-card px-3 text-start text-[15px] font-medium tabular hover:border-muted";

  if (!target) return null;
  return createPortal(
    <>
      <div ref={ref} hidden={hidden} className={clsx("pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-dock)] print:hidden px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-4 lg:pb-5", className)}>
        {/* Desktop panel */}
        <section aria-label={t("dock.label")} className="glass pointer-events-auto mx-auto hidden max-w-[1080px] gap-2 p-3 ps-5 lg:grid">
          {continueLink && <div className="-mb-1 -mt-1">{continueLink}</div>}
          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-3">
            <div className={field}>
              <label htmlFor={`${uid}-where`} className={fieldLabel}>{t("dock.where")}</label>
              {whereSelect(`${uid}-where`, true)}
            </div>
            <div className={field}>
              <span id={`${uid}-from`} className={fieldLabel}>{t("dock.from")}</span>
              <button type="button" className={dateButton} aria-labelledby={`${uid}-from ${uid}-from-v`} aria-haspopup="dialog" onClick={() => setSheet("dates")}>
                <CalendarDays className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
                <span id={`${uid}-from-v`} className="truncate">{fromText}</span>
              </button>
            </div>
            <div className={field}>
              <span id={`${uid}-until`} className={fieldLabel}>{t("dock.until")}</span>
              <button type="button" className={dateButton} aria-labelledby={`${uid}-until ${uid}-until-v`} aria-haspopup="dialog" onClick={() => setSheet("dates")}>
                <CalendarDays className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
                <span id={`${uid}-until-v`} className="truncate">{untilText}</span>
              </button>
            </div>
            <div className={field}>
              <label htmlFor={`${uid}-type`} className={fieldLabel}>{t("dock.type")}</label>
              {typeSelect(`${uid}-type`, true)}
            </div>
            <button type="button" className="btn btn-primary" onClick={go}>{t("dock.check")}</button>
          </div>
        </section>

        {/* Mobile bar */}
        <div className="glass pointer-events-auto mx-auto flex max-w-[560px] items-center gap-3 rounded-full py-2 pe-2 ps-5 lg:hidden">
          <p className="grid min-w-0 flex-1 leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{t("dock.yourTrip")}</span>
            <span className="truncate text-sm font-semibold tabular">{range || "—"}</span>
          </p>
          <button type="button" className="btn btn-primary btn-sm flex-none gap-2 px-4" aria-haspopup="dialog" onClick={() => setSheet("trip")}>
            <PencilLine className="h-4 w-4" aria-hidden="true" />
            {t("dock.editTrip")}
          </button>
        </div>
      </div>

      <BottomSheet
        open={sheet === "dates"}
        onClose={() => setSheet(null)}
        title={t("dock.datesTitle")}
        size="lg"
        footer={
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tabular">{range}</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setSheet(null)}>{t("dock.done")}</button>
          </div>
        }
      >
        {sheet === "dates" && dates}
      </BottomSheet>

      <BottomSheet
        open={sheet === "trip"}
        onClose={() => setSheet(null)}
        title={t("dock.yourTrip")}
        description={ooh ? t("dock.repliesOoh") : t("dock.replies")}
        footer={<button type="button" className="btn btn-primary btn-block" onClick={go}>{t("dock.showCars")}</button>}
      >
        <div className="grid min-w-0 grid-cols-1 gap-6 [&>*]:min-w-0">
          {continueLink}
          <div className="field">
            <label htmlFor={`${uid}-where-m`}>{t("dock.where")}</label>
            {whereSelect(`${uid}-where-m`)}
          </div>
          {sheet === "trip" && dates}
          <div className="field">
            <label htmlFor={`${uid}-type-m`}>{t("dock.type")}</label>
            {typeSelect(`${uid}-type-m`)}
          </div>
        </div>
      </BottomSheet>
    </>,
    target,
  );
}
