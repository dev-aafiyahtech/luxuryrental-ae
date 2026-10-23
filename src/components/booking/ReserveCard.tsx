"use client";

import Link from "next/link";
import clsx from "clsx";
import { useId, useState } from "react";
import { CalendarDays, CircleAlert } from "lucide-react";
import type { Car } from "@/content/types";
import { rules } from "@/content/rules";
import { useHref, useT } from "@/i18n/client";
import { useTripDraft, type DraftPatch } from "@/lib/booking/draft";
import type { ChauffeurPackage, ServiceMode } from "@/lib/pricing";
import { formatDay, formatRange, todayInDubai } from "@/lib/dates";
import { formatAED } from "@/lib/format";
import { draftMessage, whatsappHref } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { BottomSheet } from "./BottomSheet";
import { DateChips } from "./DateChips";
import { DateRail } from "./DateRail";
import { DateRangePicker } from "./DateRangePicker";
import { Segmented } from "./Segmented";
import { Stepper } from "./Stepper";
import { TimeSelect } from "./TimeSelect";
import { TotalText } from "./QuoteTable";
import { useMediaQuery, useNow } from "./hooks";
import { bumpTime, defaultServiceFor, deliveryZones, earliestStart, maxDate, quoteFor, stepPath } from "./lib";

export interface ReserveCardProps {
  car: Car;
  /** "panel" = glass card (homepage chapter 4, car page sidebar); "inline" = flat block (mobile car page). */
  variant?: "panel" | "inline";
  className?: string;
  /** Heading shown above the car name, e.g. "Your reservation". */
  eyebrow?: string;
}

const PACKAGES: ChauffeurPackage[] = ["hourly", "half-day", "full-day", "airport"];

/**
 * The reserve card: dates (chips, a 30-day rail and a full calendar), times, handover and a
 * live total from quote(). Everything is saved in the shared trip draft, so Reserve opens
 * /book/trip with the dates already in place. Chip → Reserve is two taps.
 */
export function ReserveCard({ car, variant = "panel", className, eyebrow }: ReserveCardProps) {
  const t = useT("booking");
  const href = useHref();
  const uid = useId();
  const [trip, update, hydrated] = useTripDraft();
  const now = useNow();
  const wide = useMediaQuery("(min-width: 768px)");
  const [calendar, setCalendar] = useState(false);
  const ready = hydrated && now > 0;

  // The Phantom defaults to chauffeur; a car without chauffeur rates is always self-drive.
  const service: ServiceMode = car.chauffeur ? (trip.carSlug === car.slug ? trip.service : defaultServiceFor(car)) : "self-drive";
  const draft = { ...trip, service };
  const nowDate = new Date(now);
  const q = ready ? quoteFor(car, draft, nowDate) : null;
  const earliest = ready ? earliestStart(car, service, nowDate) : null;
  const today = ready ? todayInDubai(nowDate) : "";
  const chauffeur = service === "chauffeur";
  const onRequest = !!car.rates.onRequest;

  const pin = { carSlug: car.slug, service };
  const set = (patch: DraftPatch) => update({ ...pin, ...patch });
  const setRange = (r: { start: string; end?: string }) =>
    set({ pickupDate: r.start, ...(r.end ? { returnDate: r.end } : {}), pickupTime: earliest ? bumpTime(r.start, trip.pickupTime, earliest) : trip.pickupTime });

  const reserveHref = href(stepPath("trip", car, service));
  const reserveLabel = onRequest ? t("reserve.request") : t("reserve.reserve");
  const shell = clsx(variant === "panel" ? "glass p-5 sm:p-6" : "card p-5", "grid gap-5", className);

  const head = (
    <div className="grid gap-1.5">
      <p className="eyebrow">{eyebrow ?? t("reserve.eyebrow")}</p>
      <p className="display-sm">{car.name}</p>
    </div>
  );

  if (!ready || !earliest || !q) {
    return (
      <div className={shell} aria-busy="true">
        {head}
        <div className="grid gap-3" aria-hidden="true">
          <div className="h-11 animate-pulse rounded-full bg-elevated/70 motion-reduce:animate-none" />
          <div className="h-16 animate-pulse rounded-xl bg-elevated/70 motion-reduce:animate-none" />
          <div className="h-12 animate-pulse rounded-xl bg-elevated/70 motion-reduce:animate-none" />
        </div>
        <Link className="btn btn-primary btn-block" href={reserveHref}>
          {reserveLabel}
        </Link>
      </div>
    );
  }

  const issues = q.issues.filter((i, n, all) => all.findIndex((x) => x.message === i.message) === n);
  const range = trip.pickupDate && trip.returnDate ? formatRange(trip.pickupDate, trip.returnDate) : "";
  const when = chauffeur ? (trip.pickupDate ? `${formatDay(trip.pickupDate)}, ${trip.pickupTime}` : "") : range;
  const summary = q.total > 0 ? t("reserve.summaryLive", { car: car.model, range: when, total: `${onRequest ? `${t("reserve.from")} ` : ""}${formatAED(q.total)}` }) : "";
  const pickupZoneValue = trip.handover === "collect" ? "dso" : trip.pickup.zone;
  const lengthText = chauffeur ? (q.hours ? t("quote.hours", { n: q.hours }) : t("packages.airport")) : q.days === 1 ? t("quote.day") : q.days ? t("quote.days", { n: q.days }) : "";

  return (
    <section className={shell} aria-labelledby={`${uid}-title`}>
      <div className="grid gap-1.5">
        <p className="eyebrow">{eyebrow ?? t("reserve.eyebrow")}</p>
        <h2 id={`${uid}-title`} className="display-sm">{car.name}</h2>
      </div>

      {car.chauffeur && (
        <Segmented
          legend={t("reserve.service")}
          value={service}
          size="sm"
          options={[
            { value: "self-drive", label: t("reserve.selfDrive") },
            { value: "chauffeur", label: t("reserve.chauffeur") },
          ]}
          onChange={(v) => update({ carSlug: car.slug, service: v })}
        />
      )}

      {/* Dates */}
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="label">{chauffeur ? t("reserve.date") : t("reserve.dates")}</p>
          <button type="button" onClick={() => setCalendar(true)} className="-me-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-accent-hover hover:text-fg" aria-haspopup="dialog">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t("rail.more")}
          </button>
        </div>
        {!chauffeur && <DateChips today={today} earliest={earliest.date} start={trip.pickupDate} end={trip.returnDate} car={car} size="sm" onPick={(r) => setRange(r)} />}
        <DateRail
          mode={chauffeur ? "single" : "range"}
          today={today}
          min={earliest.date}
          max={maxDate(today)}
          start={trip.pickupDate}
          end={trip.returnDate}
          minDays={q.minDays}
          onChange={setRange}
        />
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold tabular text-fg">{when || t("reserve.chooseDates")}</span>
          {lengthText && <span className="text-muted">· {lengthText}</span>}
        </p>
      </div>

      {/* Times */}
      {chauffeur ? (
        <div className="grid gap-4">
          <TimeSelect id={`${uid}-start`} label={t("time.start")} kind="chauffeur" value={trip.pickupTime} date={trip.pickupDate} earliest={earliest} onChange={(v) => set({ pickupTime: v })} />
          <div className="field">
            <label htmlFor={`${uid}-pkg`}>{t("reserve.package")}</label>
            <select id={`${uid}-pkg`} className="input" value={trip.chauffeur.package} onChange={(e) => set({ chauffeur: { package: e.target.value as ChauffeurPackage, hours: e.target.value === "half-day" ? rules.chauffeur.halfDayHours : e.target.value === "full-day" ? rules.chauffeur.fullDayHours : Math.max(rules.chauffeur.minHours, trip.chauffeur.hours) } })}>
              {PACKAGES.map((p) => (
                <option key={p} value={p}>
                  {t(`packages.${p}`)}
                  {p === "half-day" ? ` (${rules.chauffeur.halfDayHours} h)` : p === "full-day" ? ` (${rules.chauffeur.fullDayHours} h)` : ""}
                </option>
              ))}
            </select>
          </div>
          {trip.chauffeur.package === "hourly" && (
            <Stepper label={t("packages.hours")} value={Math.max(rules.chauffeur.minHours, trip.chauffeur.hours)} min={rules.chauffeur.minHours} max={rules.chauffeur.maxHours} unit={(n) => t("packages.hoursUnit", { n })} onChange={(n) => set({ chauffeur: { hours: n } })} />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <TimeSelect id={`${uid}-pt`} label={t("time.pickup")} value={trip.pickupTime} date={trip.pickupDate} earliest={earliest} onChange={(v) => set({ pickupTime: v })} />
          <TimeSelect id={`${uid}-rt`} label={t("time.return")} value={trip.returnTime} onChange={(v) => set({ returnTime: v })} />
        </div>
      )}

      {/* Handover */}
      {chauffeur ? (
        <div className="field">
          <label htmlFor={`${uid}-zone`}>{t("trip.pickupZone")}</label>
          <select id={`${uid}-zone`} className="input" value={trip.pickup.zone === "dso" ? "dubai" : trip.pickup.zone} onChange={(e) => set({ pickup: { zone: e.target.value } })}>
            {deliveryZones.map((z) => <option key={z.slug} value={z.slug}>{z.name}</option>)}
          </select>
        </div>
      ) : (
        <div className="grid gap-3">
          <Segmented
            legend={t("reserve.handover")}
            value={trip.handover}
            size="sm"
            options={[
              { value: "delivery", label: t("reserve.delivery") },
              { value: "collect", label: t("reserve.collect") },
            ]}
            onChange={(v) => set({ handover: v, ...(v === "delivery" && trip.pickup.zone === "dso" ? { pickup: { zone: "dubai" } } : {}) })}
          />
          {trip.handover === "delivery" ? (
            <div className="field">
              <label htmlFor={`${uid}-zone`}>{t("reserve.where")}</label>
              <select id={`${uid}-zone`} className="input" value={pickupZoneValue === "dso" ? "dubai" : pickupZoneValue} onChange={(e) => set({ pickup: { zone: e.target.value } })}>
                {deliveryZones.map((z) => <option key={z.slug} value={z.slug}>{z.name}</option>)}
              </select>
            </div>
          ) : (
            <p className="text-[13px] leading-snug text-muted">{t("reserve.collectNote")}</p>
          )}
        </div>
      )}

      {/* Issues: never a dead end */}
      {issues.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0" aria-live="polite">
          {issues.map((i) => (
            <li key={i.message} className="flex items-start gap-2 rounded-xl border border-warning/40 bg-bg/40 p-3 text-[13px] leading-snug text-champagne">
              <CircleAlert className="mt-px h-4 w-4 flex-none text-warning" aria-hidden="true" />
              <span className="grid gap-1">
                <span>{i.message}</span>
                {(i.resolution === "whatsapp" || i.field === "pickupDate") && (
                  <a href={whatsappHref(draftMessage(draft, car.name))} target="_blank" rel="noopener" className="inline-flex min-h-11 w-fit items-center gap-1.5 font-semibold text-fg underline decoration-accent/60 underline-offset-4">
                    <WhatsAppIcon className="h-4 w-4" />
                    {t("reserve.askWhatsApp")}
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Total */}
      <div className="grid gap-1.5 border-t border-line pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="label">{t("reserve.total")}</span>
          <strong className="font-display text-2xl text-accent-hover">
            <TotalText quote={q} />
          </strong>
        </div>
        <p className="text-end text-[12px] text-muted">
          {t("quote.inclVat")}
          {q.offer ? ` · ${t("quote.offer", { name: q.offer.name })}` : ""}
        </p>
        {q.deposit > 0 && (
          <p className="text-[12px] leading-snug text-muted">
            {t("quote.deposit")}: <span className="font-semibold tabular text-champagne">{formatAED(q.deposit)}</span>
          </p>
        )}
        {onRequest && <p className="text-[12px] leading-snug text-champagne">{t("reserve.requestNote")}</p>}
      </div>
      <p className="sr-only" aria-live="polite">{summary}</p>

      <div className="grid gap-2">
        <Link className="btn btn-primary btn-block" href={reserveHref} onClick={() => update(pin)}>
          {reserveLabel}
        </Link>
        <p className="text-center text-[12px] text-muted">{t("reserve.noCharge")}</p>
      </div>

      <BottomSheet
        open={calendar}
        onClose={() => setCalendar(false)}
        title={chauffeur ? t("picker.labelSingle") : t("picker.label")}
        size={wide ? "lg" : "md"}
        footer={
          <div className="flex items-center justify-between gap-4">
            <p className="grid text-sm">
              <span className="font-semibold tabular">{when}</span>
              <span className="text-muted"><TotalText quote={q} /> · {t("quote.inclVat")}</span>
            </p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setCalendar(false)}>{t("dock.done")}</button>
          </div>
        }
      >
        <DateRangePicker
          mode={chauffeur ? "single" : "range"}
          label={chauffeur ? t("picker.labelSingle") : t("picker.label")}
          start={trip.pickupDate}
          end={trip.returnDate}
          min={earliest.date}
          max={maxDate(today)}
          today={today}
          months={wide && !chauffeur ? 2 : 1}
          minDays={q.minDays}
          onChange={setRange}
          announce={summary}
          disabledHint={t("picker.noticeHint", { hours: chauffeur ? rules.chauffeur.leadHours : car.leadHours })}
        />
      </BottomSheet>
    </section>
  );
}
