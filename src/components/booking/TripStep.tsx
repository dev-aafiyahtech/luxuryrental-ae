"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, type FormEvent } from "react";
import { ArrowRight, CircleAlert, MapPin } from "lucide-react";
import type { Car } from "@/content/types";
import { cars, carPath, heroCars } from "@/content/cars";
import { rules } from "@/content/rules";
import { getZone, zones } from "@/content/zones";
import { useHref, useT } from "@/i18n/client";
import type { DeliveryZone } from "@/content/types";
import type { ChauffeurPackage, Quote, QuoteIssue, ServiceMode } from "@/lib/pricing";
import { fromPrice } from "@/lib/pricing";
import { formatDay, formatRange } from "@/lib/dates";
import { formatAED } from "@/lib/format";
import { draftMessage, whatsappHref } from "@/lib/whatsapp";
import type { TripDraft } from "@/lib/booking/types";
import { CarArt } from "@/components/car/CarArt";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { DateChips } from "./DateChips";
import { DateRangePicker } from "./DateRangePicker";
import { Checkbox, Field, Section, describedBy } from "./Field";
import { RadioCard } from "./RadioCard";
import { Segmented } from "./Segmented";
import { Stepper } from "./Stepper";
import { TimeSelect } from "./TimeSelect";
import { FlowSkeleton, StepHeader } from "./bits";
import { FlowShell, useErrors, useFlow, zoneIsAirport } from "./FlowShell";
import { useMediaQuery } from "./hooks";
import { bumpTime, deliveryZones, maxDate, stepPath } from "./lib";
import { tripErrors, tripFieldId } from "./validate";

type T = ReturnType<typeof useT>;

function zoneHint(z: DeliveryZone | undefined, t: T) {
  if (!z) return undefined;
  if (z.fee === null) return `${t("trip.zoneOnRequest")}. ${z.note ?? ""}`.trim();
  if (z.fee === 0) return t("trip.zoneFree");
  if (z.freeFromDays) return t("trip.zoneFreeFrom", { fee: z.fee, days: z.freeFromDays });
  return `${t("trip.zoneFee", { fee: formatAED(z.fee) })}${z.note ? `. ${z.note}` : ""}`;
}

/** Inline issue from quote(): text plus a WhatsApp way out when the request can't be made online. */
function IssueList({ issues, trip, car }: { issues: QuoteIssue[]; trip: TripDraft; car: Car }) {
  const t = useT("booking");
  if (!issues.length) return null;
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {issues.map((i) => (
        <li key={i.message} className="field-error flex items-start gap-1.5">
          <CircleAlert className="mt-px h-4 w-4 flex-none" aria-hidden="true" />
          <span className="grid gap-1">
            <span>{i.message}</span>
            {(i.resolution === "whatsapp" || i.field === "pickupDate") && (
              <a href={whatsappHref(draftMessage(trip, car.name))} target="_blank" rel="noopener" className="inline-flex min-h-11 w-fit items-center gap-1.5 font-semibold text-fg underline decoration-accent/60 underline-offset-4">
                <WhatsAppIcon className="h-4 w-4" />
                {t("reserve.askWhatsApp")}
              </a>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function CarPicker({ today, onCancel }: { today: string; onCancel?: () => void }) {
  const t = useT("booking");
  const href = useHref();
  const list = [...heroCars(), ...cars.filter((c) => c.chauffeurFirst)];
  return (
    <div className="container-site pb-24">
      <StepHeader step="trip" title={t("flow.noCarTitle")} backHref="/cars" />
      <p className="lede -mt-4 mb-8">{t("flow.noCarLede")}</p>
      <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((car) => (
          <li key={car.slug}>
            <Link href={href(`/book/trip?car=${car.slug}`)} className="card card-hover grid h-full overflow-hidden no-underline">
              <CarArt car={car} view="hero" className="aspect-[16/9] w-full" />
              <span className="grid gap-1 p-5">
                <span className="font-semibold text-fg">{car.name}</span>
                <span className="text-sm tabular text-muted">
                  {car.rates.onRequest ? `${t("reserve.from")} ` : ""}
                  {formatAED(fromPrice(car, today))} / day
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={href("/cars")} className="btn btn-secondary">
          {t("flow.browseFleet")}
          <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        </Link>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {t("steps.back")}
          </button>
        )}
      </div>
    </div>
  );
}

function ZoneFields({ prefix, zone, address, flight, onZone, onAddress, onFlight, list, label, addressLabel, error, flightError, onFlightBlur, issues }: {
  prefix: "trip" | "trip-return";
  zone: string;
  address?: string;
  flight?: string;
  onZone: (v: string) => void;
  onAddress: (v: string) => void;
  onFlight: (v: string) => void;
  list: DeliveryZone[];
  label: string;
  addressLabel: string;
  error?: string;
  flightError?: string;
  onFlightBlur: () => void;
  issues?: React.ReactNode;
}) {
  const t = useT("booking");
  const z = getZone(zone);
  const hint = zoneHint(z, t);
  const zoneId = prefix === "trip" ? tripFieldId.pickupZone : tripFieldId.returnZone;
  return (
    <div className="grid gap-5">
      <Field id={zoneId} label={label} hint={hint} error={error}>
        <select id={zoneId} className="input" value={zone} onChange={(e) => onZone(e.target.value)} aria-describedby={describedBy(zoneId, hint, error)} aria-invalid={error ? true : undefined}>
          {list.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}
        </select>
      </Field>
      {issues}
      {zone !== "dso" && (
        <Field id={`${prefix}-address`} label={addressLabel} optional hint={t("trip.addressHint")}>
          <input id={`${prefix}-address`} className="input" autoComplete="street-address" value={address ?? ""} onChange={(e) => onAddress(e.target.value)} aria-describedby={`${prefix}-address-hint`} />
        </Field>
      )}
      {zoneIsAirport(zone) && (
        <Field id={`${prefix}-flight`} label={t("trip.flight")} optional hint={t("trip.flightHint")} error={flightError}>
          <input
            id={`${prefix}-flight`}
            className="input uppercase tabular"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={flight ?? ""}
            onChange={(e) => onFlight(e.target.value)}
            onBlur={onFlightBlur}
            aria-invalid={flightError ? true : undefined}
            aria-describedby={`${prefix}-flight-hint${flightError ? ` ${prefix}-flight-error` : ""}`}
          />
        </Field>
      )}
    </div>
  );
}

export function TripStep() {
  const t = useT("booking");
  const f = useFlow();
  const { car, carParam, trip, update, hydrated, today, earliest, quote: q, service, outOfHours, go, href, router } = f;
  const { touch, visible, check, submitted, summaryRef } = useErrors();
  const wide = useMediaQuery("(min-width: 768px)");
  const [pickingAt, setPickingAt] = useState<string | null | undefined>(undefined);
  const picking = pickingAt !== undefined && pickingAt === carParam;

  if (!hydrated || (car && (!earliest || !q))) return <FlowSkeleton label={t("form.loading")} />;
  if (!car || picking) return <CarPicker today={today} onCancel={car ? () => setPickingAt(undefined) : undefined} />;

  const quote = q as Quote;
  const start = earliest!;
  const errors = tripErrors(trip, quote, service, t);
  const chauffeur = service === "chauffeur";
  const issuesFor = (fields: string[]) => quote.issues.filter((i, n, all) => fields.includes(i.field) && all.findIndex((x) => x.message === i.message) === n);
  const setRange = (r: { start: string; end?: string }) => update({ pickupDate: r.start, ...(r.end ? { returnDate: r.end } : {}), pickupTime: bumpTime(r.start, trip.pickupTime, start) });
  const setService = (v: ServiceMode) => {
    update({ service: v, ...(v === "chauffeur" && trip.pickup.zone === "dso" ? { pickup: { zone: "dubai" } } : {}) });
    router.replace(href(stepPath("trip", car, v)), { scroll: false });
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (check(errors)) {
      update({});
      go("extras");
    }
  };

  const range = trip.pickupDate && trip.returnDate ? formatRange(trip.pickupDate, trip.returnDate) : "";
  const days = quote.days === 1 ? t("quote.day") : t("quote.days", { n: quote.days });
  const announce = chauffeur
    ? trip.pickupDate ? t("picker.announceSingle", { date: formatDay(trip.pickupDate), total: formatAED(quote.total) }) : ""
    : range && quote.total ? t("picker.announce", { range, days, total: formatAED(quote.total) }) : range;
  const showBanner = !carParam && trip.updatedAt > 0;
  const rates = car.chauffeur;

  const intro = (
    <>
      {showBanner && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-accent/40 p-4">
          <p className="font-semibold">{range && !chauffeur ? t("flow.continueBannerDates", { car: car.model, range }) : t("flow.continueBanner", { car: car.model })}</p>
          <button type="button" className="btn btn-ghost btn-sm -my-1 text-accent-hover" onClick={() => setPickingAt(carParam)}>{t("flow.chooseOther")}</button>
        </div>
      )}
      <div id="trip-car" tabIndex={-1} className="flex items-center gap-4 outline-none">
        <CarArt car={car} view="card" className="aspect-[4/3] w-24 flex-none rounded-xl border border-line bg-bg" sizes="96px" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="font-semibold leading-snug">{car.name}</p>
          <p className="text-[12px] text-muted">{t("flow.illustration")}</p>
        </div>
        <Link href={href(carPath(car))} className="btn btn-ghost btn-sm flex-none" onClick={(e) => { e.preventDefault(); setPickingAt(carParam); }}>
          {t("flow.changeCar")}
        </Link>
      </div>
    </>
  );

  return (
    <FlowShell
      step="trip"
      title={t("titles.trip")}
      backHref={carPath(car)}
      car={car}
      trip={trip}
      quote={quote}
      service={service}
      formId="trip-form"
      actionLabel={t("form.continue")}
      errors={errors}
      showErrors={submitted}
      summaryRef={summaryRef}
      outOfHours={outOfHours}
      intro={intro}
    >
      <form id="trip-form" noValidate onSubmit={onSubmit} className="grid gap-10">
        {rates && (
          <div className="grid gap-3">
            <Segmented
              legend={t("trip.service")}
              value={service}
              options={[
                { value: "self-drive", label: t("reserve.selfDrive") },
                { value: "chauffeur", label: t("reserve.chauffeur") },
              ]}
              onChange={setService}
            />
            {car.chauffeurFirst && !chauffeur && <p className="field-hint">{t("trip.phantomNote")}</p>}
          </div>
        )}

        {chauffeur && rates ? (
          <>
            <Section legend={t("trip.chauffeurDate")}>
              <DateRangePicker
                id="trip-dates"
                mode="single"
                label={t("picker.labelSingle")}
                start={trip.pickupDate}
                min={start.date}
                max={maxDate(today)}
                today={today}
                onChange={setRange}
                announce={announce}
                disabledHint={t("picker.noticeHint", { hours: rules.chauffeur.leadHours })}
              />
              <IssueList issues={issuesFor(["pickupDate"])} trip={trip} car={car} />
              <TimeSelect id="trip-pickup-time" label={t("time.start")} kind="chauffeur" value={trip.pickupTime} date={trip.pickupDate} earliest={start} onChange={(v) => update({ pickupTime: v })} hint={t("time.nightHint", { pct: rules.chauffeur.nightSurchargePct })} />
            </Section>

            <Section legend={t("trip.package")} id="trip-package">
              <div className="grid gap-3">
                {(["hourly", "half-day", "full-day", "airport"] as ChauffeurPackage[]).map((p) => {
                  const on = trip.chauffeur.package === p;
                  const price = p === "hourly" ? `${formatAED(rates.hourly)} / h` : formatAED(p === "half-day" ? rates.halfDay : p === "full-day" ? rates.fullDay : rates.airport);
                  const detail = p === "hourly" ? t("packages.hourlyDetail", { min: rules.chauffeur.minHours, rate: rates.hourly }) : p === "airport" ? t("packages.airportDetail") : t(`packages.${p}Detail`, { hours: p === "half-day" ? rules.chauffeur.halfDayHours : rules.chauffeur.fullDayHours });
                  return (
                    <RadioCard
                      key={p}
                      name="package"
                      value={p}
                      checked={on}
                      onChange={() => update({ chauffeur: { package: p, hours: p === "half-day" ? rules.chauffeur.halfDayHours : p === "full-day" ? rules.chauffeur.fullDayHours : Math.max(rules.chauffeur.minHours, trip.chauffeur.hours) } })}
                      title={t(`packages.${p}`)}
                      description={detail}
                      aside={price}
                    />
                  );
                })}
              </div>
              {trip.chauffeur.package === "hourly" && (
                <div className="card p-4">
                  <Stepper label={t("packages.hours")} value={Math.max(rules.chauffeur.minHours, trip.chauffeur.hours)} min={rules.chauffeur.minHours} max={rules.chauffeur.maxHours} unit={(n) => t("packages.hoursUnit", { n })} onChange={(n) => update({ chauffeur: { hours: n } })} />
                </div>
              )}
            </Section>

            <Section legend={t("trip.pickup")}>
              <ZoneFields
                prefix="trip"
                list={deliveryZones}
                label={t("trip.pickupZone")}
                addressLabel={t("trip.address")}
                zone={trip.pickup.zone === "dso" ? "dubai" : trip.pickup.zone}
                address={trip.pickup.address}
                flight={trip.pickup.flight}
                onZone={(v) => update({ pickup: { zone: v } })}
                onAddress={(v) => update({ pickup: { address: v } })}
                onFlight={(v) => update({ pickup: { flight: v } })}
                onFlightBlur={() => touch("trip-flight")}
                flightError={visible(errors, "trip-flight")}
                issues={<IssueList issues={issuesFor(["pickupZone"])} trip={trip} car={car} />}
              />
              <p className="flex items-start gap-2 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
                {t("trip.chauffeurIncluded", { included: rules.chauffeur.included })}
              </p>
            </Section>
          </>
        ) : (
          <>
            <Section legend={t("trip.dates")}>
              <DateChips today={today} earliest={start.date} start={trip.pickupDate} end={trip.returnDate} car={car} onPick={(r) => setRange(r)} />
              <div className="card p-4 sm:p-5">
                <DateRangePicker
                  id="trip-dates"
                  label={t("picker.label")}
                  start={trip.pickupDate}
                  end={trip.returnDate}
                  min={start.date}
                  max={maxDate(today)}
                  today={today}
                  months={wide ? 2 : 1}
                  minDays={quote.minDays}
                  onChange={setRange}
                  announce={announce}
                  disabledHint={t("picker.noticeHint", { hours: car.leadHours })}
                />
              </div>
              {range && (
                <p className="text-sm">
                  <span className="font-semibold tabular">{range}</span>
                  {quote.days > 0 && <span className="text-muted"> · {days}</span>}
                </p>
              )}
              <IssueList issues={issuesFor(["pickupDate", "returnDate"])} trip={trip} car={car} />
              <div className="grid grid-cols-2 gap-3">
                <TimeSelect id="trip-pickup-time" label={t("time.pickup")} value={trip.pickupTime} date={trip.pickupDate} earliest={start} onChange={(v) => update({ pickupTime: v })} />
                <TimeSelect id="trip-return-time" label={t("time.return")} value={trip.returnTime} onChange={(v) => update({ returnTime: v })} />
              </div>
              <p className="field-hint -mt-2">{t("time.oohHint", { fee: rules.outOfHoursFee })}</p>
            </Section>

            <Section legend={t("trip.handover")}>
              <Segmented
                legend={t("trip.handover")}
                legendHidden
                value={trip.handover}
                options={[
                  { value: "delivery", label: t("trip.delivery") },
                  { value: "collect", label: t("trip.collect") },
                ]}
                onChange={(v) => update({ handover: v, ...(v === "delivery" && trip.pickup.zone === "dso" ? { pickup: { zone: "dubai" } } : {}) })}
              />
              {trip.handover === "delivery" ? (
                <ZoneFields
                  prefix="trip"
                  list={deliveryZones}
                  label={t("trip.zone")}
                  addressLabel={t("trip.address")}
                  zone={trip.pickup.zone === "dso" ? "dubai" : trip.pickup.zone}
                  address={trip.pickup.address}
                  flight={trip.pickup.flight}
                  onZone={(v) => update({ pickup: { zone: v } })}
                  onAddress={(v) => update({ pickup: { address: v } })}
                  onFlight={(v) => update({ pickup: { flight: v } })}
                  onFlightBlur={() => touch("trip-flight")}
                  flightError={visible(errors, "trip-flight")}
                  issues={<IssueList issues={issuesFor(["pickupZone"])} trip={trip} car={car} />}
                />
              ) : (
                <div className="card flex items-start gap-3 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 flex-none text-accent" aria-hidden="true" />
                  <div className="grid gap-1">
                    <p className="font-semibold">{t("trip.dsoTitle")}</p>
                    <p className="text-sm text-muted">{t("trip.dsoText")}</p>
                  </div>
                </div>
              )}
              <Checkbox
                id="trip-return-elsewhere"
                checked={!trip.sameReturn}
                hint={t("trip.returnElsewhereHint")}
                onChange={(v) => update({ sameReturn: !v, ...(v ? { dropoff: { zone: trip.handover === "collect" ? "dubai" : "dso" } } : {}) })}
              >
                {t("trip.returnElsewhere")}
              </Checkbox>
              {!trip.sameReturn && (
                <ZoneFields
                  prefix="trip-return"
                  list={zones}
                  label={t("trip.returnZone")}
                  addressLabel={t("trip.returnAddress")}
                  zone={trip.dropoff.zone}
                  address={trip.dropoff.address}
                  flight={trip.dropoff.flight}
                  onZone={(v) => update({ dropoff: { zone: v } })}
                  onAddress={(v) => update({ dropoff: { address: v } })}
                  onFlight={(v) => update({ dropoff: { flight: v } })}
                  onFlightBlur={() => touch("trip-return-flight")}
                  flightError={visible(errors, "trip-return-flight")}
                />
              )}
            </Section>
          </>
        )}
        <p className={clsx("notice text-sm text-champagne")}>{t("flow.requestOnlyText")}</p>
      </form>
    </FlowShell>
  );
}
