"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPlus, Check, Copy, ListChecks, MessageSquareText } from "lucide-react";
import { getCar } from "@/content/cars";
import { site } from "@/content/site";
import { useHref, useT } from "@/i18n/client";
import { resetDraft, useBooking, useTripDraft } from "@/lib/booking/draft";
import { bookingMessage, whatsappHref } from "@/lib/whatsapp";
import { formatAED } from "@/lib/format";
import { Notice } from "@/components/ui";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { FlowSkeleton, Rows, StatusBadge } from "./bits";
import { tripLines } from "./FlowShell";
import { useHydrated, useNow } from "./hooks";
import { buildIcs, consumeSent, downloadFile, isReplyOutOfHours } from "./lib";

/** Copy to the clipboard, with a textarea fallback for browsers without the async API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function ConfirmedView() {
  const t = useT("booking");
  const href = useHref();
  const params = useSearchParams();
  const ref = (params.get("ref") ?? "").toUpperCase();
  const hydrated = useHydrated();
  const record = useBooking(ref);
  const [trip] = useTripDraft();
  const now = useNow();
  const [copied, setCopied] = useState<"" | "ref" | "msg">("");

  // A request sent from this tab: clear the trip, keep the contact details for next time.
  useEffect(() => {
    if (!record || !consumeSent(record.ref)) return;
    resetDraft({ driver: { ...trip.driver, ackTerms: false, whatsappConsent: false, marketing: false, notes: undefined } });
  }, [record, trip.driver]);

  if (!hydrated) return <FlowSkeleton />;

  const ooh = now > 0 && isReplyOutOfHours(new Date(now));
  const message = record ? bookingMessage(record) : `Hello ${site.businessName}, I'd like to confirm booking request ${ref}.`;
  const copy = async (what: "ref" | "msg") => {
    if (await copyText(what === "ref" ? ref : message)) {
      setCopied(what);
      setTimeout(() => setCopied(""), 2500);
    }
  };
  const car = record ? getCar(record.carSlug) : undefined;
  const lines = record ? tripLines(record.trip, record.trip.service, t) : null;
  const steps = [
    { title: t("confirmed.t1"), text: t("confirmed.t1Text"), state: "done" },
    { title: t("confirmed.t2"), text: ooh ? t("confirmed.t2TextOoh") : t("confirmed.t2Text"), state: "current" },
    { title: t("confirmed.t3"), text: t("confirmed.t3Text"), state: "todo" },
  ];

  if (!ref) {
    return (
      <div className="container-narrow grid gap-6 pb-24 pt-12">
        <h1 className="display-md">{t("status.lookupTitle")}</h1>
        <Notice tone="info" title={t("confirmed.noRef")} />
        <Link href={href("/booking")} className="btn btn-secondary w-fit">{t("status.lookupTitle")}</Link>
      </div>
    );
  }

  return (
    <div className="container-narrow grid gap-10 pb-24 pt-10 md:pt-14">
      <header className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">{t("confirmed.eyebrow")}</p>
          <StatusBadge status={record?.status ?? "requested"} />
        </div>
        <h1 className="display-md">{t("confirmed.title")}</h1>
        <p className="lede">{t("confirmed.reply")}</p>
      </header>

      <section aria-labelledby="ref-label" className="glass grid gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-1">
            <p id="ref-label" className="label">{t("confirmed.reference")}</p>
            <p className="font-display text-3xl font-bold tracking-[0.06em] text-accent-hover sm:text-4xl" dir="ltr">{ref}</p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm -me-3 gap-2" onClick={() => void copy("ref")}>
            {copied === "ref" ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied === "ref" ? t("confirmed.copied") : t("confirmed.copy")}
          </button>
        </div>
        <div className="grid gap-2">
          <a href={whatsappHref(message)} target="_blank" rel="noopener" className="btn btn-primary btn-block">
            <WhatsAppIcon className="h-5 w-5" />
            {t("confirmed.whatsapp")}
          </a>
          <p className="text-center text-[13px] text-muted">{t("confirmed.whatsappHint", { number: site.whatsappDisplay })}</p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <button type="button" className="btn btn-secondary btn-sm gap-2" onClick={() => void copy("msg")}>
            {copied === "msg" ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <MessageSquareText className="h-4 w-4" aria-hidden="true" />}
            {copied === "msg" ? t("confirmed.messageCopied") : t("confirmed.copyMessage")}
          </button>
          {record && (
            <button type="button" className="btn btn-secondary btn-sm gap-2" onClick={() => downloadFile(`${record.ref}.ics`, buildIcs(record, new Date()), "text/calendar")}>
              <CalendarPlus className="h-4 w-4" aria-hidden="true" />
              {t("confirmed.calendar")}
            </button>
          )}
          <Link href={href(`/booking?ref=${ref}`)} className="btn btn-secondary btn-sm gap-2">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            {t("confirmed.track")}
          </Link>
        </div>
        <p className="sr-only" aria-live="polite">{copied === "ref" ? t("confirmed.copied") : copied === "msg" ? t("confirmed.messageCopied") : ""}</p>
      </section>

      <section aria-labelledby="timeline-h" className="grid gap-5">
        <h2 id="timeline-h" className="display-sm">{t("confirmed.timeline")}</h2>
        <ol className="m-0 grid list-none gap-0 p-0">
          {steps.map((s, i) => (
            <li key={s.title} aria-current={s.state === "current" ? "step" : undefined} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden="true" className={clsx("absolute start-[15px] top-8 h-[calc(100%-32px)] w-px", s.state === "done" ? "bg-accent" : "bg-line")} />}
              <span aria-hidden="true" className={clsx("grid h-8 w-8 place-items-center rounded-full border text-[13px] font-bold", s.state === "done" ? "border-accent bg-accent text-on-accent" : s.state === "current" ? "border-accent text-accent-hover" : "border-line text-muted")}>
                {s.state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <div className="grid gap-1 pt-1">
                <p className={clsx("font-semibold", s.state === "todo" ? "text-muted" : "text-fg")}>{s.title}</p>
                <p className="text-sm text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {record && lines ? (
        <section aria-labelledby="summary-h" className="card grid gap-3 p-5 sm:p-6">
          <h2 id="summary-h" className="text-[15px] font-semibold">{t("confirmed.summary")}</h2>
          <Rows
            rows={[
              { label: t("review.car"), value: `${record.carName}${record.trip.service === "chauffeur" ? ` · ${t("reserve.chauffeur")}` : ""}` },
              { label: t("review.when"), value: <span className="tabular">{lines.when}</span> },
              { label: t("review.handover"), value: lines.where },
              { label: t("quote.total"), value: <span className="font-semibold tabular">{record.quote.onRequest ? `${t("quote.totalFrom")} ` : ""}{formatAED(record.quote.total)} <span className="font-normal text-muted">{t("quote.inclVat")}</span></span> },
              { label: t("quote.depositShort"), value: record.quote.deposit ? <span className="tabular">{formatAED(record.quote.deposit)}</span> : "" },
            ]}
          />
          {car && <p className="fine">{t("quote.nothingCharged")}</p>}
        </section>
      ) : (
        <Notice tone="info">{t("confirmed.unknown")}</Notice>
      )}

      {site.demo && (
        <Notice tone="info" title={t("confirmed.demoHint")}>
          <Link href={href("/demo/ops")} className="font-semibold text-fg underline underline-offset-4">{t("confirmed.openOps")}</Link>
        </Notice>
      )}
    </div>
  );
}
