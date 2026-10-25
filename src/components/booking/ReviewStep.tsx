"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { cancellationSummary } from "@/content/localize";
import { useLocale, useT } from "@/i18n/client";
import { submitBookingRequest } from "@/lib/booking/store";
import { Notice } from "@/components/ui";
import { Checkbox, Section } from "./Field";
import { QuoteTable } from "./QuoteTable";
import { FlowSkeleton, Rows, WhatsAppButton, rich } from "./bits";
import { FlowShell, NeedsCar, tripLines, useErrors, useFlow } from "./FlowShell";
import { countryName, formatPhone, fullDraftMessage, markSent, stepPath, type StepId } from "./lib";
import { flightText } from "./bits";
import { consentErrors, driverErrors, tripErrors } from "./validate";
import { useAvailability } from "@/lib/booking/availability";

function ReviewSection({ title, editHref, editLabel, id, children }: { title: string; editHref: string; editLabel: string; id: string; children: ReactNode }) {
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-h`} className="grid gap-2 border-t border-line pt-6 outline-none">
      <div className="flex items-center justify-between gap-4">
        <h2 id={`${id}-h`} className="text-[15px] font-semibold">{title}</h2>
        <Link href={editHref} className="btn btn-ghost btn-sm -me-3 text-accent-hover">
          {editLabel}
          <span className="sr-only">: {title}</span>
        </Link>
      </div>
      {children}
    </section>
  );
}

export function ReviewStep() {
  const t = useT("booking");
  const locale = useLocale();
  const params = useSearchParams();
  const failMode = params.get("fail") === "1";
  const { car, trip, update, hydrated, quote, service, outOfHours, href, router } = useFlow();
  const { touch, visible, check, submitted, summaryRef } = useErrors();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [nudge, setNudge] = useState(false);
  const attempts = useRef(0);
  const failRef = useRef<HTMLDivElement>(null);

  // Consent boxes start unticked (05 §3): until the visitor has ticked the acknowledgement once,
  // the WhatsApp consent default from the shared draft is cleared.
  const consentReset = useRef(false);
  const avail = useAvailability(car?.slug);
  useEffect(() => {
    if (!hydrated || consentReset.current) return;
    consentReset.current = true;
    if (!trip.driver.ackTerms && trip.driver.whatsappConsent) update({ driver: { whatsappConsent: false } });
  }, [hydrated, trip.driver.ackTerms, trip.driver.whatsappConsent, update]);

  // A quiet inline nudge after 60 s on this step (no modal, no exit intent).
  useEffect(() => {
    const id = setTimeout(() => setNudge(true), 60_000);
    return () => clearTimeout(id);
  }, []);

  if (!hydrated) return <FlowSkeleton label={t("form.loading")} />;
  if (!car || !quote) return <NeedsCar />;

  const d = trip.driver;
  const selfDrive = service === "self-drive";
  const errors = [
    ...tripErrors(trip, quote, service, t, avail.clash(trip.pickupDate, trip.returnDate, service), car.name, locale).map((e) => ({ id: "review-trip", message: e.message })),
    ...driverErrors(trip, car, service, t).map((e) => ({ id: "review-driver", message: e.message })),
    ...consentErrors(trip, t),
  ];
  const stepHref = (s: StepId) => href(stepPath(s, car, service));
  const { when, where, back } = tripLines(trip, service, t, locale);
  const waText = fullDraftMessage(trip, car, quote, locale);

  const send = async () => {
    if (busy) return;
    if (!check(errors)) return;
    setBusy(true);
    setFailed(false);
    attempts.current += 1;
    try {
      // ?fail=1 simulates a network error on the first attempt, so "Try again" can be shown working.
      const record = await submitBookingRequest(trip, quote, car.name, { fail: failMode && attempts.current === 1 });
      markSent(record.ref);
      router.push(href(`/book/confirmed?ref=${record.ref}`));
    } catch {
      setBusy(false);
      setFailed(true);
      requestAnimationFrame(() => failRef.current?.focus());
    }
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send();
  };

  const coverText = trip.extras.fullCover ? t("extras.fullCover") : t("extras.standard");

  return (
    <FlowShell
      step="review"
      title={t("titles.review")}
      backHref={stepPath("driver", car, service)}
      car={car}
      trip={trip}
      quote={quote}
      service={service}
      formId="review-form"
      actionLabel={busy ? t("review.sending") : t("review.send")}
      busy={busy}
      errors={errors}
      showErrors={submitted}
      summaryRef={summaryRef}
      outOfHours={outOfHours}
      intro={failMode && <Notice tone="info">{t("review.demoFail")}</Notice>}
      after={
        nudge && !failed ? (
          <div className="notice notice-info" role="status">
            <div className="grid gap-3">
              <p className="text-champagne">{t("review.nudge")}</p>
              <WhatsAppButton text={waText} size="sm" className="w-fit">{t("flow.finishWhatsApp")}</WhatsAppButton>
            </div>
          </div>
        ) : undefined
      }
    >
      <form id="review-form" noValidate onSubmit={onSubmit} className="grid gap-8">
        {failed && (
          <div ref={failRef} tabIndex={-1} role="alert" className="notice notice-danger outline-none">
            <CircleAlert className="mt-0.5 h-5 w-5 flex-none text-danger" aria-hidden="true" />
            <div className="grid gap-3">
              <p className="font-semibold">{t("review.failTitle")}</p>
              <p className="text-champagne">{t("review.failText")}</p>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => void send()} aria-busy={busy || undefined}>
                  {t("review.retry")}
                </button>
                <WhatsAppButton text={waText} size="sm">{t("review.sendWhatsApp")}</WhatsAppButton>
              </div>
            </div>
          </div>
        )}

        <ReviewSection id="review-trip" title={t("review.trip")} editHref={stepHref("trip")} editLabel={t("form.edit")}>
          <Rows
            rows={[
              { label: t("review.car"), value: car.name },
              { label: t("review.service"), value: selfDrive ? t("reserve.selfDrive") : t("reserve.chauffeur") },
              { label: t("review.when"), value: <span className="tabular">{when}</span> },
              { label: t("review.handover"), value: where },
              { label: t("review.return"), value: back ? back.replace(`${t("review.return")}: `, "") : "" },
              { label: t("trip.flight"), value: flightText(trip.pickup.flight) },
            ]}
          />
        </ReviewSection>

        <ReviewSection id="review-extras" title={t("review.extras")} editHref={stepHref("extras")} editLabel={t("form.edit")}>
          <Rows
            rows={[
              ...(selfDrive ? [{ label: t("review.cover"), value: coverText }, { label: t("review.drivers"), value: trip.extras.additionalDrivers ? String(trip.extras.additionalDrivers) : t("review.none") }] : []),
              { label: t("review.seats"), value: trip.extras.childSeats ? String(trip.extras.childSeats) : t("review.none") },
            ]}
          />
        </ReviewSection>

        <ReviewSection id="review-driver" title={t("review.driver")} editHref={stepHref("driver")} editLabel={t("form.edit")}>
          <Rows
            rows={[
              { label: t("review.name"), value: d.name },
              { label: t("review.phone"), value: d.phone ? <span dir="ltr" className="tabular">{formatPhone(d.phone)}</span> : "" },
              { label: t("review.email"), value: d.email },
              ...(selfDrive
                ? [
                    { label: t("review.licence"), value: `${countryName(d.licenceCountry, locale, t("driver.otherCountry"))}${d.resident ? ` · ${t("driver.residentYes")}` : ""}` },
                    { label: t("review.age"), value: d.ageBand === "under-25" ? t("driver.ageUnder25") : d.ageBand === "25-29" ? t("driver.age25") : t("driver.age30") },
                  ]
                : []),
              { label: t("review.channel"), value: d.channel === "phone" ? t("driver.channelPhone") : d.channel === "email" ? t("driver.channelEmail") : t("driver.channelWhatsapp") },
              { label: t("review.notes"), value: d.notes },
            ]}
          />
        </ReviewSection>

        <section className="grid gap-4 border-t border-line pt-6" aria-labelledby="review-price-h">
          <h2 id="review-price-h" className="text-[15px] font-semibold">{t("quote.breakdown")}</h2>
          <QuoteTable quote={quote} car={car} />
        </section>

        <section className="grid gap-3 border-t border-line pt-6" aria-labelledby="review-cancel-h">
          <h2 id="review-cancel-h" className="text-[15px] font-semibold">{t("review.cancellation")}</h2>
          <p className="text-sm text-champagne">{cancellationSummary(locale)}</p>
          <p className="text-sm text-muted">{t("review.fees")}</p>
        </section>

        <section className="grid gap-3 border-t border-line pt-6" aria-labelledby="review-next-h">
          <h2 id="review-next-h" className="text-[15px] font-semibold">{t("review.nextTitle")}</h2>
          <ol className="m-0 grid list-none gap-3 p-0">
            {[t("review.next1"), t("review.next2"), t("review.next3")].map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-champagne">
                <span className="grid h-6 w-6 flex-none place-items-center rounded-full border border-accent/50 text-[12px] font-bold text-accent-hover">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <Section legend={t("review.consents")}>
          <div className="grid gap-1">
            <Checkbox id="review-ack" required checked={!!d.ackTerms} onChange={(v) => update({ driver: { ackTerms: v } })} onBlur={() => touch("review-ack")} error={visible(errors, "review-ack")}>
              {rich(t("review.ack"), {
                privacy: <Link href={href("/legal/privacy")} target="_blank" className="text-fg underline underline-offset-2">{t("review.privacy")}</Link>,
                requirements: <Link href={href("/requirements")} target="_blank" className="text-fg underline underline-offset-2">{t("review.requirements")}</Link>,
              })}
            </Checkbox>
            {d.channel === "whatsapp" && (
              <Checkbox id="review-wa" required checked={!!d.whatsappConsent} onChange={(v) => update({ driver: { whatsappConsent: v } })} onBlur={() => touch("review-wa")} error={visible(errors, "review-wa")}>
                {t("review.whatsappConsent")}
              </Checkbox>
            )}
            <Checkbox id="review-marketing" checked={!!d.marketing} onChange={(v) => update({ driver: { marketing: v } })}>
              {t("review.marketing")} <span className="text-muted">{t("form.optional")}</span>
            </Checkbox>
          </div>
        </Section>
      </form>
    </FlowShell>
  );
}
