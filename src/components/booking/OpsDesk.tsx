"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { Mail, Phone, Plus, RotateCcw } from "lucide-react";
import { getCar } from "@/content/cars";
import { site } from "@/content/site";
import { useHref, useT } from "@/i18n/client";
import { defaultDraft, useBookings } from "@/lib/booking/draft";
import { resetDemoBookings, submitBookingRequest, updateBookingStatus } from "@/lib/booking/store";
import { transitions, type BookingRecord, type BookingStatus } from "@/lib/booking/types";
import { formatAED } from "@/lib/format";
import { quote } from "@/lib/pricing";
import { addDays, todayInDubai } from "@/lib/dates";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { ConditionReportSheet, OpsChecks } from "@/components/agreement/OpsChecks";
import { BottomSheet } from "./BottomSheet";
import { FlowSkeleton, Rows, StatusBadge } from "./bits";
import { stamp } from "./BookingStatusView";
import { tripLines } from "./FlowShell";
import { useHydrated } from "./hooks";
import { STATUS_ORDER, countryName, formatPhone } from "./lib";

type Action = { to: BookingStatus; key: "confirm" | "decline" | "payLink" | "paidHandover" | "cancel"; primary?: boolean };
const ACTIONS: Action[] = [
  { to: "confirmed", key: "confirm", primary: true },
  { to: "awaiting_payment", key: "payLink" },
  { to: "paid", key: "paidHandover" },
  { to: "declined", key: "decline" },
  { to: "cancelled", key: "cancel" },
];
const actionsFor = (s: BookingStatus) => ACTIONS.filter((a) => transitions[s].includes(a.to));

/** The ops email a new request would trigger (production: one-click signed links). */
function EmailPreview({ b, onAction, pending }: { b: BookingRecord; onAction: (to: BookingStatus) => void; pending: string }) {
  const t = useT("booking");
  const lines = tripLines(b.trip, b.trip.service, t);
  const d = b.trip.driver;
  const extras = [b.trip.extras.fullCover && t("extras.fullCover"), b.trip.extras.additionalDrivers && `${b.trip.extras.additionalDrivers} × ${t("extras.drivers").toLowerCase()}`, b.trip.extras.childSeats && `${b.trip.extras.childSeats} × ${t("extras.seats").toLowerCase()}`].filter(Boolean).join(", ");
  const digits = d.phone?.replace(/\D/g, "");
  return (
    <div className="grid gap-5">
      <Rows
        rows={[
          { label: t("ops.emailFrom"), value: `Luxuryrental.ae website <no-reply@${site.domain}>` },
          { label: t("ops.emailTo"), value: site.email },
          { label: t("ops.emailSubject"), value: t("ops.emailSubjectText", { ref: b.ref, car: b.carName, when: lines.when }) },
        ]}
      />
      <div className="grid gap-4 rounded-xl border border-line bg-bg p-4 text-sm">
        <p className="text-champagne">{t("ops.emailIntro")}</p>
        <Rows
          rows={[
            { label: t("review.name"), value: d.name },
            { label: t("review.phone"), value: d.phone ? <span className="flex flex-wrap gap-3" dir="ltr"><a href={`tel:${d.phone}`} className="underline">{formatPhone(d.phone)}</a>{digits && <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener" className="underline">wa.me</a>}</span> : "" },
            { label: t("review.email"), value: d.email },
            { label: t("review.channel"), value: d.channel === "phone" ? t("driver.channelPhone") : d.channel === "email" ? t("driver.channelEmail") : t("driver.channelWhatsapp") },
            { label: t("review.car"), value: `${b.carName}${b.trip.service === "chauffeur" ? ` · ${t("reserve.chauffeur")}` : ""}` },
            { label: t("review.when"), value: lines.when },
            { label: t("review.handover"), value: `${lines.where}${b.trip.pickup.flight ? ` · ${b.trip.pickup.flight.toUpperCase()}` : ""}` },
            { label: t("review.return"), value: lines.back },
            { label: t("review.extras"), value: extras || t("review.none") },
            { label: t("review.licence"), value: b.trip.service === "self-drive" ? `${countryName(d.licenceCountry)} · ${d.resident ? t("driver.residentYes") : t("driver.residentNo")} · ${d.ageBand}` : "" },
            { label: t("quote.total"), value: `${b.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}${formatAED(b.quote.total)} ${t("quote.inclVat")}` },
            { label: t("quote.depositShort"), value: b.quote.deposit ? formatAED(b.quote.deposit) : "" },
            { label: t("review.notes"), value: d.notes },
            { label: t("review.consents"), value: `${t("ops.consentAck")}: ${d.ackTerms ? t("form.yes") : t("form.no")} · WhatsApp: ${d.whatsappConsent ? t("form.yes") : t("form.no")} · ${t("ops.consentMarketing")}: ${d.marketing ? t("form.yes") : t("form.no")}` },
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

  if (!hydrated) return <FlowSkeleton />;

  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = filter === "all" ? sorted : sorted.filter((b) => b.status === filter);
  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, list.filter((b) => b.status === s).length])) as Record<BookingStatus, number>;
  const previewing = preview ? list.find((b) => b.ref === preview) : undefined;
  const checking = recording ? list.find((b) => b.ref === recording.ref) : undefined;

  const act = async (b: BookingRecord, to: BookingStatus) => {
    if (pending) return;
    setPending(`${b.ref}:${to}`);
    try {
      await updateBookingStatus(b.ref, to, "ops", t(`ops.notes.${to}`));
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
      driver: { name: "Sample Customer", phone: "+971501234567", email: "sample@example.com", channel: "whatsapp" as const, licenceCountry: "GB", resident: false, ageBand: "30+" as const, ackTerms: true, whatsappConsent: true, marketing: false },
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
        <p className="eyebrow"><span className="badge">{t("badge.demo")}</span>{t("ops.eyebrow")}</p>
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

      <p className="label">{shown.length === 1 ? t("ops.countOne") : t("ops.count", { n: shown.length })}</p>

      {shown.length === 0 ? (
        <div className="card grid justify-items-start gap-3 p-6">
          <p className="font-semibold">{list.length ? t("ops.emptyFiltered") : t("ops.empty")}</p>
          {!list.length && <p className="text-sm text-muted">{t("ops.emptyHint")}</p>}
          {!list.length && <Link href={href("/cars")} className="btn btn-secondary btn-sm">{t("status.browse")}</Link>}
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {shown.map((b) => {
            const lines = tripLines(b.trip, b.trip.service, t);
            const d = b.trip.driver;
            return (
              <li key={b.ref}>
                <article aria-labelledby={`ops-${b.ref}`} className="card grid gap-4 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 id={`ops-${b.ref}`} className="font-semibold tabular tracking-[0.06em]" dir="ltr">{b.ref}</h2>
                    <StatusBadge status={b.status} />
                    <span className="text-[12px] text-muted">{t("ops.created")} {stamp(b.createdAt)}</span>
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
                      <dd className="m-0 font-semibold tabular">{b.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}{formatAED(b.quote.total)}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    {actionsFor(b.status).map((a) => {
                      const busy = pending === `${b.ref}:${a.to}`;
                      return (
                        <button key={a.key} type="button" className={clsx("btn btn-sm", a.primary ? "btn-primary" : "btn-secondary")} onClick={() => void act(b, a.to)} aria-busy={busy || undefined} aria-disabled={(!!pending && !busy) || undefined}>
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
                  <OpsChecks b={b} onRecord={(stage) => setRecording({ ref: b.ref, stage })} />
                </article>
              </li>
            );
          })}
        </ul>
      )}

      <BottomSheet open={!!previewing} onClose={() => setPreview(null)} title={previewing ? t("ops.emailTitle", { ref: previewing.ref }) : ""} size="lg">
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
