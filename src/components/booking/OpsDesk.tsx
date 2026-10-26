"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { CalendarX2, Mail, Phone, Plus, RotateCcw } from "lucide-react";
import { getCar } from "@/content/cars";
import { site } from "@/content/site";
import { useHref, useLocale, useT } from "@/i18n/client";
import { isolateFor } from "@/i18n/config";
import { defaultDraft, useBookings } from "@/lib/booking/draft";
import { resetDemoBookings, submitBookingRequest, updateBookingStatus } from "@/lib/booking/store";
import { transitions, type BookingRecord, type BookingStatus } from "@/lib/booking/types";
import { formatAED } from "@/lib/format";
import { quote } from "@/lib/pricing";
import { addDays, todayInDubai } from "@/lib/dates";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { ConditionReportSheet, OpsChecks } from "@/components/agreement/OpsChecks";
import { DocumentsPanel } from "@/components/account/DocumentsPanel";
import { busyRanges, clashIn, resetDemoBlocks, useBlocks, type Busy } from "@/lib/booking/availability";
import { clashMessage } from "./Availability";
import { OpsAvailability } from "./OpsAvailability";
import { documentProgress, requiredDocuments, resetDemoCustomers, useDocuments } from "@/lib/customer/store";
import { BottomSheet } from "./BottomSheet";
import { FlowSkeleton, Rows, StatusBadge } from "./bits";
import { stamp } from "./BookingStatusView";
import { tripLines } from "./FlowShell";
import { useHydrated } from "./hooks";
import { STATUS_ORDER, countText, countryName, formatPhone, listSep, needsIdp } from "./lib";
import { flightText } from "./bits";

type Action = { to: BookingStatus; key: "confirm" | "decline" | "payLink" | "paidHandover" | "cancel"; primary?: boolean };
const ACTIONS: Action[] = [
  { to: "confirmed", key: "confirm", primary: true },
  { to: "awaiting_payment", key: "payLink" },
  { to: "paid", key: "paidHandover" },
  { to: "declined", key: "decline" },
  { to: "cancelled", key: "cancel" },
];
const actionsFor = (s: BookingStatus) => ACTIONS.filter((a) => transitions[s].includes(a.to));

/** Event notes stored with ops actions (English, as the ops log); the history shows them by code in each viewer's language. */
const OPS_NOTES: Record<BookingStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed by our team",
  declined: "Declined by ops: not available on these dates",
  awaiting_payment: "Payment link sent to the customer",
  paid: "Marked paid at handover",
  cancelled: "Cancelled by ops",
  expired: "Expired",
};

/** The ops email a new request would trigger (production: one-click signed links). */
function EmailPreview({ b, onAction, pending }: { b: BookingRecord; onAction: (to: BookingStatus) => void; pending: string }) {
  const t = useT("booking");
  const locale = useLocale();
  const lines = tripLines(b.trip, b.trip.service, t, locale);
  const d = b.trip.driver;
  const lower = (s: string) => s.toLocaleLowerCase(locale);
  const extras = [b.trip.extras.fullCover && t("extras.fullCover"), b.trip.extras.additionalDrivers && `${b.trip.extras.additionalDrivers} × ${lower(t("extras.drivers"))}`, b.trip.extras.childSeats && `${b.trip.extras.childSeats} × ${lower(t("extras.seats"))}`].filter(Boolean).join(listSep(locale));
  const age = d.ageBand === "under-25" ? t("driver.ageUnder25") : d.ageBand === "25-29" ? t("driver.age25") : t("driver.age30");
  const digits = d.phone?.replace(/\D/g, "");
  return (
    <div className="grid gap-5">
      <Rows
        rows={[
          { label: t("ops.emailFrom"), value: <bdi dir="ltr">{`LuxuryRentals.ae website <no-reply@${site.domain}>`}</bdi> },
          { label: t("ops.emailTo"), value: <bdi dir="ltr">{site.email}</bdi> },
          { label: t("ops.emailSubject"), value: t("ops.emailSubjectText", { ref: isolateFor(locale)(b.ref), car: isolateFor(locale)(b.carName), when: lines.when }) },
        ]}
      />
      <div className="grid gap-4 rounded-xl border border-line bg-bg p-4 text-sm">
        <p className="text-champagne">{t("ops.emailIntro")}</p>
        <Rows
          rows={[
            { label: t("review.name"), value: d.name },
            { label: t("review.phone"), value: d.phone ? <span className="flex flex-wrap gap-3" dir="ltr"><a href={`tel:${d.phone}`} className="underline">{formatPhone(d.phone)}</a>{digits && <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener" className="underline">wa.me</a>}</span> : "" },
            { label: t("review.email"), value: d.email ? <bdi dir="ltr">{d.email}</bdi> : "" },
            { label: t("review.channel"), value: d.channel === "phone" ? t("driver.channelPhone") : d.channel === "email" ? t("driver.channelEmail") : t("driver.channelWhatsapp") },
            { label: t("review.car"), value: `${b.carName}${b.trip.service === "chauffeur" ? ` · ${t("reserve.chauffeur")}` : ""}` },
            { label: t("review.when"), value: lines.when },
            { label: t("review.handover"), value: <>{lines.where}{b.trip.pickup.flight ? <> · {flightText(b.trip.pickup.flight)}</> : null}</> },
            { label: t("review.return"), value: lines.back },
            { label: t("review.extras"), value: extras || t("review.none") },
            { label: t("review.licence"), value: b.trip.service === "self-drive" ? `${countryName(d.licenceCountry, locale, t("driver.otherCountry"))} · ${d.resident ? t("driver.residentYes") : t("driver.residentNo")} · ${age}` : "" },
            { label: t("quote.total"), value: `${b.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}${formatAED(b.quote.total, locale)} ${t("quote.inclVat")}` },
            { label: t("quote.depositShort"), value: b.quote.deposit ? formatAED(b.quote.deposit, locale) : "" },
            { label: t("review.notes"), value: d.notes },
            { label: t("review.consents"), value: `${t("ops.consentAck")}: ${d.ackTerms ? t("form.yes") : t("form.no")} · ${t("driver.channelWhatsapp")}: ${d.whatsappConsent ? t("form.yes") : t("form.no")} · ${t("ops.consentMarketing")}: ${d.marketing ? t("form.yes") : t("form.no")}` },
          ]}
        />
        <div className="grid gap-2 border-t border-line pt-4">
          <p className="label">{t("ops.emailActions")}</p>
          <div className="flex flex-wrap gap-2">
            {actionsFor(b.status).map((a) => (
              <button key={a.key} type="button" className={clsx("btn btn-sm", a.primary ? "btn-primary" : "btn-secondary")} onClick={() => onAction(a.to)} aria-busy={pending === `${b.ref}:${a.to}` || undefined}>
                {t(`ops.actionLabels.${a.key}`)}
              </button>
            ))}
          </div>
          <p className="fine">{t("ops.emailNote")}</p>
        </div>
      </div>
    </div>
  );
}

export function OpsDesk() {
  const t = useT("booking");
  const locale = useLocale();
  const href = useHref();
  const hydrated = useHydrated();
  const list = useBookings();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [pending, setPending] = useState("");
  const [live, setLive] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [creating, setCreating] = useState(false);
  const [recording, setRecording] = useState<{ ref: string; stage: "handover" | "return" } | null>(null);
  const blocks = useBlocks();

  if (!hydrated) return <FlowSkeleton />;

  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = filter === "all" ? sorted : sorted.filter((b) => b.status === filter);
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, list.filter((b) => b.status === s).length])) as Record<BookingStatus, number>;
  const previewing = preview ? list.find((b) => b.ref === preview) : undefined;
  const checking = recording ? list.find((b) => b.ref === recording.ref) : undefined;

  // A request can only be confirmed if the car is free: no confirmed booking or block overlaps it.
  const clashOf = (b: BookingRecord): Busy | null => (b.status === "requested" ? clashIn(busyRanges(b.carSlug, list, blocks, b.ref), b.trip.pickupDate, b.trip.returnDate, b.trip.service) : null);

  const act = async (b: BookingRecord, to: BookingStatus) => {
    if (pending) return;
    const clash = to === "confirmed" ? clashOf(b) : null;
    if (clash) {
      setLive(clashMessage(clash, t, b.carName, locale));
      return;
    }
    setPending(`${b.ref}:${to}`);
    try {
      await updateBookingStatus(b.ref, to, "ops", OPS_NOTES[to], `ops.${to}`);
      setLive(t("ops.done", { ref: b.ref, status: t(`status.labels.${to}`) }));
    } catch (e) {
      setLive(t("ops.failed", { ref: b.ref, error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setPending("");
    }
  };

  const sample = async () => {
    setCreating(true);
    const car = getCar("ferrari-296-gts")!;
    const today = todayInDubai();
    const trip = {
      ...defaultDraft(true),
      carSlug: car.slug,
      pickupDate: addDays(today, 3),
      returnDate: addDays(today, 6),
      pickup: { zone: "dxb", flight: "EK 202" },
      dropoff: { zone: "dxb" },
      driver: { name: "Alex Morgan", phone: "+971501234567", email: "alex.morgan@example.com", channel: "whatsapp" as const, licenceCountry: "GB", resident: false, ageBand: "30+" as const, ackTerms: true, whatsappConsent: true, marketing: false },
      updatedAt: Date.now(),
    };
    const q = quote({ car, service: "self-drive", pickupDate: trip.pickupDate, pickupTime: trip.pickupTime, returnDate: trip.returnDate, returnTime: trip.returnTime, pickupZone: "dxb", returnZone: "dxb", extras: trip.extras });
    try {
      const r = await submitBookingRequest(trip, q, car.name);
      setLive(t("ops.done", { ref: r.ref, status: t("status.labels.requested") }));
    } finally {
      setCreating(false);
    }
  };

  const chip = (value: BookingStatus | "all", label: string, n: number) => (
    <button
      key={value}
      type="button"
      aria-pressed={filter === value}
      onClick={() => setFilter(value)}
      className={clsx("inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors duration-200", filter === value ? "border-accent bg-accent text-on-accent" : "border-input text-fg hover:border-accent")}
    >
      {label}
      <span className={clsx("tabular", filter === value ? "text-on-accent" : "text-muted")}>{n}</span>
    </button>
  );

  return (
    <div className="container-site grid gap-8 pb-24 pt-10 md:pt-14">
      <header className="grid gap-4">
        <p className="eyebrow">{t("ops.eyebrow")}</p>
        <h1 className="display-md">{t("ops.title")}</h1>
        <p className="lede">{t("ops.lede")}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label={t("ops.filter")} className="flex flex-wrap gap-2">
          {chip("all", t("ops.all"), list.length)}
          {STATUS_ORDER.filter((s) => counts[s] > 0 || ["requested", "confirmed", "paid"].includes(s)).map((s) => chip(s, t(`status.labels.${s}`), counts[s]))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary btn-sm gap-2" onClick={() => void sample()} aria-busy={creating || undefined}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("ops.sample")}
          </button>
          <button type="button" className="btn btn-ghost btn-sm gap-2" onClick={() => setConfirmReset(true)} aria-haspopup="dialog" disabled={!list.length}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("ops.reset")}
          </button>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite">{live}</p>

      <OpsAvailability onSaved={setLive} />

      <p className="label">{countText(t, locale, "count.requests", shown.length, () => (shown.length === 1 ? t("ops.countOne") : t("ops.count", { n: shown.length })))}</p>

      {shown.length === 0 ? (
        <div className="card grid justify-items-start gap-3 p-6">
          <p className="font-semibold">{list.length ? t("ops.emptyFiltered") : t("ops.empty")}</p>
          {!list.length && <p className="text-sm text-muted">{t("ops.emptyHint")}</p>}
          {!list.length && <Link href={href("/cars")} className="btn btn-secondary btn-sm">{t("status.browse")}</Link>}
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {shown.map((b) => {
            const lines = tripLines(b.trip, b.trip.service, t, locale);
            const d = b.trip.driver;
            const clash = clashOf(b);
            return (
              <li key={b.ref}>
                <article aria-labelledby={`ops-${b.ref}`} className="card grid gap-4 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 id={`ops-${b.ref}`} className="font-semibold tabular tracking-[0.06em]" dir="ltr">{b.ref}</h2>
                    <StatusBadge status={b.status} />
                    <span className="text-[12px] text-muted">{t("ops.created")} {stamp(b.createdAt, locale)}</span>
                  </div>
                  <dl className="m-0 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-[1.3fr_1.6fr_1.1fr_0.9fr]">
                    <div className="grid gap-0.5">
                      <dt className="label">{t("review.car")}</dt>
                      <dd className="m-0">{b.carName}{b.trip.service === "chauffeur" && <span className="text-muted"> · {t("reserve.chauffeur")}</span>}</dd>
                    </div>
                    <div className="grid gap-0.5">
                      <dt className="label">{t("ops.dates")}</dt>
                      <dd className="m-0 tabular">{lines.when}<span className="block text-[13px] text-muted">{lines.where}</span></dd>
                    </div>
                    <div className="grid gap-0.5">
                      <dt className="label">{t("ops.customer")}</dt>
                      <dd className="m-0 grid">
                        <span>{d.name || "—"}</span>
                        {d.phone && (
                          <span className="flex flex-wrap items-center gap-3 text-[13px]" dir="ltr">
                            <a href={`tel:${d.phone}`} className="inline-flex min-h-11 items-center gap-1 text-muted underline-offset-4 hover:text-fg hover:underline"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{formatPhone(d.phone)}</a>
                            <a href={`https://wa.me/${d.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" aria-label={`WhatsApp ${formatPhone(d.phone)}`} className="inline-flex min-h-11 items-center text-muted hover:text-fg"><WhatsAppIcon className="h-4 w-4" /></a>
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="grid gap-0.5">
                      <dt className="label">{t("ops.total")}</dt>
                      <dd className="m-0 font-semibold tabular">{b.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}{formatAED(b.quote.total, locale)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    {clash && (
                      <p className="flex w-full items-start gap-2 text-[13px] text-warning">
                        <CalendarX2 className="mt-px h-4 w-4 flex-none" aria-hidden="true" />
                        <span>{clashMessage(clash, t, b.carName, locale)} {t("ops.clashHint")}</span>
                      </p>
                    )}
                    {actionsFor(b.status).map((a) => {
                      const busy = pending === `${b.ref}:${a.to}`;
                      const blocked = a.to === "confirmed" && !!clash;
                      return (
                        <button key={a.key} type="button" className={clsx("btn btn-sm", a.primary ? "btn-primary" : "btn-secondary", blocked && "opacity-50")} onClick={() => void act(b, a.to)} aria-busy={busy || undefined} aria-disabled={(!!pending && !busy) || blocked || undefined}>
                          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
                          {t(`ops.actionLabels.${a.key}`)}
                        </button>
                      );
                    })}
                    <button type="button" className="btn btn-ghost btn-sm gap-2" aria-haspopup="dialog" onClick={() => setPreview(b.ref)}>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {t("ops.emailPreview")}
                    </button>
                    <Link href={href(`/booking?ref=${b.ref}`)} className="btn btn-ghost btn-sm">{t("ops.openCustomer")}</Link>
                  </div>
                  <OpsDocuments b={b} />
                  <OpsChecks b={b} onRecord={(stage) => setRecording({ ref: b.ref, stage })} />
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet open={!!previewing} onClose={() => setPreview(null)} title={previewing ? t("ops.emailTitle", { ref: isolateFor(locale)(previewing.ref) }) : ""} size="lg">
        {previewing && <EmailPreview b={previewing} pending={pending} onAction={(to) => void act(previewing, to)} />}
      </BottomSheet>

      <ConditionReportSheet b={checking} stage={recording?.stage ?? "handover"} onClose={() => setRecording(null)} onSaved={setLive} />

      <BottomSheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title={t("ops.resetTitle")}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(false)}>{t("ops.cancel")}</button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                resetDemoBookings();
                resetDemoCustomers();
                resetDemoBlocks();
                setConfirmReset(false);
                setLive(t("ops.resetDone"));
              }}
            >
              {t("ops.resetConfirm")}
            </button>
          </div>
        }
      >
        <p className="text-champagne">{t("ops.resetText")}</p>
      </BottomSheet>
    </div>
  );
}

/** The main driver's uploaded documents, reviewed (verify or reject) from the ops desk. */
function OpsDocuments({ b }: { b: BookingRecord }) {
  const t = useT("booking");
  const driver = b.trip.driver;
  const docs = useDocuments(driver.phone);
  if (!driver.phone) return null;
  const p = documentProgress(docs, requiredDocuments(driver, needsIdp));
  return (
    <details className="group rounded-[14px] border border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <span>{t("ops.docs.title")}</span>
        <span className="font-normal text-muted tabular">
          {p.uploaded === 0 ? t("ops.docs.none") : t("ops.docs.progress", { uploaded: p.uploaded, total: p.total, verified: p.verified })}
        </span>
      </summary>
      <div className="border-t border-line p-4">
        <DocumentsPanel phone={driver.phone} driver={driver} mode="ops" headingLevel="h3" />
      </div>
    </details>
  );
}
