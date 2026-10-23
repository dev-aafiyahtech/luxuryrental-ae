import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { ArrowRight, Check, CircleDollarSign, Fuel, Gauge, Receipt, ShieldCheck, Truck, UserCheck } from "lucide-react";
import type { Car } from "@/content/types";
import { rules, seasonFor, seasons } from "@/content/rules";
import { getZone } from "@/content/zones";
import { site } from "@/content/site";
import { fromPrice, seasonalDaily } from "@/lib/pricing";
import { formatAED, formatNumber, formatSeconds } from "@/lib/format";
import { whatsappHref } from "@/lib/whatsapp";
import { CarArt } from "@/components/car/CarArt";
import { callouts } from "@/components/car/CarBits";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";
import { profiles } from "@/scene/car/profiles";
import { activeOffer, shortDate } from "./facts";

type T = (key: string, vars?: Record<string, string | number>) => string;
type Href = (path: string) => string;

const dubaiFee = () => getZone("dubai")?.fee ?? 150;
const airportFee = () => getZone("dxb")?.fee ?? 250;
const kmMonth = (car: Car) => car.rates.kmPerMonth ?? 4500;

/** Section wrapper with an h2 and optional lede. */
export function Section({ id, title, lede, children, className, eyebrow }: { id: string; title: string; lede?: ReactNode; children: ReactNode; className?: string; eyebrow?: ReactNode }) {
  return (
    <section aria-labelledby={id} className={clsx("grid scroll-mt-28 gap-6", className)}>
      <div className="grid gap-2">
        {eyebrow}
        <h2 id={id} className="display-sm">{title}</h2>
        {lede && <p className="max-w-[62ch] text-muted">{lede}</p>}
      </div>
      {children}
    </section>
  );
}

/** Three headline numbers under the car name: power, 0–100 and seats. */
export function HeadlineStats({ car, t }: { car: Car; t: T }) {
  const stats = [
    { value: formatNumber(car.specs.hp), unit: t("car.hpUnit"), label: t("car.statPower") },
    { value: formatSeconds(car.specs.zeroTo100).replace(" s", ""), unit: t("car.secondsUnit"), label: t("car.statSprint") },
    { value: car.specs.seats, unit: "", label: t("car.statSeats") },
  ];
  return (
    <dl className="grid grid-cols-3 divide-x divide-line rounded-[16px] border border-line bg-card/60 rtl:divide-x-reverse">
      {stats.map((s) => (
        <div key={s.label} className="grid content-start gap-1 px-3 py-4 sm:px-5">
          <dt className="label order-2 text-[10px] sm:text-[11px]">{s.label}</dt>
          <dd className="order-1 flex items-baseline gap-1.5 tabular">
            <span className="font-display text-[clamp(1.1rem,0.8rem+1.6vw,1.9rem)] font-bold leading-none tracking-[0.02em]">{s.value}</span>
            {s.unit && <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-accent">{s.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Interpolated y on a polyline at x (profile points run tail → nose). */
function yAt(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/**
 * Marker positions (in % of the art box) for each callout part, from the car's body profile.
 * The art box uses the line-art viewBox aspect (6.2 × 2.75), so the mapping is exact.
 */
function partMarkers(car: Car): Record<"powertrain" | "body" | "cabin" | "wheels", { x: number; y: number }> {
  const p = profiles[car.body];
  const nose = p.top[p.top.length - 1][0];
  const toPct = (x: number, y: number) => ({ x: ((x + 3.1) / 6.2) * 100, y: ((2.25 - y) / 2.75) * 100 });
  const mid = (x: number) => (yAt(p.top, x) + yAt(p.bottom, x)) / 2;
  const tail = p.top[0][0];
  const engineX = (p.engine ?? "mid") === "mid" ? p.glass.from - 0.45 : (p.glass.to + nose) / 2 + 0.1;
  const cabinX = (p.glass.from + p.glass.to) / 2;
  const front = p.wheels.reduce((a, b) => (b[0] > a[0] ? b : a));
  return {
    powertrain: toPct(engineX, mid(engineX) + 0.15),
    body: toPct(tail + 0.35, mid(tail + 0.35)),
    cabin: toPct(cabinX, (yAt(p.top, cabinX) + p.glass.belt) / 2),
    wheels: toPct(front[0], front[1]),
  };
}

/** "Kinetic sculpture" block: the car's side view with numbered markers on four parts. */
export function KineticCallouts({ car, t, id }: { car: Car; t: T; id: string }) {
  const items = callouts(car);
  const markers = partMarkers(car);
  return (
    <section aria-labelledby={id} className="relative grid gap-6 overflow-hidden rounded-[24px] border border-line bg-[radial-gradient(90%_60%_at_50%_45%,rgba(214,211,209,0.07),transparent_70%)] p-5 md:p-8">
      <div className="grid gap-2">
        <p className="eyebrow"><span className="num">03</span>{t("car.kineticEyebrow")}</p>
        <h2 id={id} className="display-sm">{t("car.kineticTitle")}</h2>
        <p className="text-muted">{t("car.kineticLede", { model: car.model })}</p>
      </div>
      <div className="relative -mx-2 md:mx-0">
        <CarArt car={car} view="side" className="aspect-[124/55] w-full" alt="" />
        {items.map((c, i) => {
          const m = markers[c.part as keyof typeof markers];
          return (
            <span
              key={c.part}
              aria-hidden="true"
              className="absolute grid h-6 w-6 -translate-x-1/2 sm:h-7 sm:w-7 -translate-y-1/2 place-items-center rounded-full border border-accent bg-bg/85 font-display text-[9px] font-bold text-accent-hover shadow-[0_0_0_5px_rgba(202,138,4,0.14),0_0_24px_rgba(234,179,8,0.35)] rtl:translate-x-1/2"
              style={{ insetInlineStart: `${m.x}%`, top: `${m.y}%` }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          );
        })}
      </div>
      <ol className="m-0 grid gap-3 p-0 [list-style:none] sm:grid-cols-2">
        {items.map((c, i) => (
          <li key={c.part} className="grid gap-1 rounded-[14px] border border-line bg-bg/70 p-4">
            <span className="flex items-center gap-2">
              <span className="font-display text-[11px] font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span className="label">{t(`car.parts.${c.part}`)}</span>
            </span>
            <span className="text-[15px] font-semibold leading-snug">{c.title}</span>
            <span className="text-[13px] text-muted">{c.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FactItem({ icon: Icon, title, children }: { icon: typeof Check; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 border-b border-line py-4">
      <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-accent/40 text-accent" aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span className="grid gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-[14px] leading-relaxed text-muted">{children}</span>
      </span>
    </li>
  );
}

/** What the daily rate includes, then what is charged as used. */
export function Included({ car, today, t }: { car: Car; today: string; t: T }) {
  const tier = rules.tiers[car.tier];
  const founding = !car.rates.onRequest ? activeOffer("founding-client", today) : undefined;
  const until = founding ? shortDate(founding.validUntil) : "";
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      <ul className="m-0 border-t border-line p-0 [list-style:none]">
        <FactItem icon={ShieldCheck} title={t("car.inc.insuranceTitle")}>
          {t("car.inc.insurance", { excess: formatAED(tier.excess), fcExcess: formatAED(tier.fullCoverExcess), fc: formatAED(tier.fullCoverPerDay) })}
        </FactItem>
        <FactItem icon={Gauge} title={t("car.inc.kmTitle", { km: formatNumber(car.rates.kmPerDay) })}>
          {t("car.inc.km", { extra: formatAED(car.rates.extraKm), month: formatNumber(kmMonth(car)) })}
          {founding && <> {t("car.inc.kmOffer", { until })}</>}
        </FactItem>
        {car.rates.onRequest ? (
          <FactItem icon={UserCheck} title={t("car.inc.escortTitle")}>{t("car.inc.escort")}</FactItem>
        ) : founding ? (
          <FactItem icon={Truck} title={t("car.inc.deliveryOfferTitle")}>{t("car.inc.deliveryOffer", { until, airport: formatAED(airportFee()) })}</FactItem>
        ) : (
          <FactItem icon={Truck} title={t("car.inc.deliveryTitle")}>{t("car.inc.delivery", { fee: formatAED(dubaiFee()), airport: formatAED(airportFee()) })}</FactItem>
        )}
        <FactItem icon={Receipt} title={t("car.inc.vatTitle")}>{t("car.inc.vat")}</FactItem>
      </ul>
      <div className="grid content-start gap-3">
        <p className="label">{t("car.usage")}</p>
        <ul className="m-0 border-t border-line p-0 [list-style:none]">
          <FactItem icon={CircleDollarSign} title={t("car.use.salikTitle")}>{t("car.use.salik", { admin: formatAED(rules.tollAdminFee) })}</FactItem>
          <FactItem icon={Fuel} title={t("car.use.fuelTitle")}>{t("car.use.fuel", { fee: formatAED(rules.refuelFee) })}</FactItem>
          <FactItem icon={Receipt} title={t("car.use.finesTitle")}>{t("car.use.fines", { fee: formatAED(rules.fineAdminFee) })}</FactItem>
        </ul>
      </div>
    </div>
  );
}

/** Driver requirements for this car as a definition list. */
export function Requirements({ car, t }: { car: Car; t: T }) {
  const tier = rules.tiers[car.tier];
  const rows: { label: string; value: string }[] = [
    { label: t("car.req.age"), value: car.chauffeurFirst ? t("car.req.ageApproval", { age: car.minAge }) : t("car.req.ageValue", { age: car.minAge }) },
    { label: t("car.req.licence"), value: t("car.req.licenceValue", { years: car.licenceYears }) },
    { label: t("car.req.deposit"), value: t("car.req.depositValue", { amount: formatAED(car.rates.deposit), days: tier.releaseDays }) },
    { label: t("car.req.notice"), value: car.leadHours >= 24 ? t("car.req.noticeDays", { days: car.leadHours / 24, hours: car.leadHours }) : t("car.req.noticeHours", { hours: car.leadHours }) },
    { label: t("car.req.minimum"), value: car.minDays > 1 ? t("car.req.minimumValue", { days: car.minDays }) : t("car.req.minimumOne") },
  ];
  if (car.tier === "H") rows.push({ label: t("car.req.approval"), value: t("car.req.approvalValue") });
  rows.push({ label: t("car.req.documents"), value: t("car.req.documentsValue") });
  return (
    <dl className="m-0 grid border-t border-line">
      {rows.map((r) => (
        <div key={r.label} className="grid gap-1 border-b border-line py-3.5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:gap-6">
          <dt className="label pt-0.5">{r.label}</dt>
          <dd className="m-0 text-[15px] font-semibold leading-snug">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Rate card: today's daily, standard, peak and festive daily, 7 and 30 days, deposit and km. */
export function RateTable({ car, today, t }: { car: Car; today: string; t: T }) {
  const season = seasonFor(today);
  const onReq = (n: number | null) => (n === null ? t("car.rate.onRequest") : formatAED(n));
  const from = (n: number) => (car.rates.onRequest ? t("car.rate.fromDay", { price: formatAED(n) }) : formatAED(n));
  const rows: { label: string; note?: string; value: string; strong?: boolean }[] = [
    { label: t("car.rate.today"), note: t("car.rate.todaySeason", { season: season.name }), value: from(fromPrice(car, today)), strong: true },
    { label: t("car.rate.standard"), value: from(car.rates.daily) },
    { label: t("car.rate.peak"), note: t("car.rate.peakDates"), value: from(car.rates.peakDaily) },
    { label: t("car.rate.festive"), note: t("car.rate.festiveDates"), value: from(seasonalDaily(car, seasons["super-peak"])) },
    { label: t("car.rate.weekly"), value: onReq(car.rates.weekly) },
    { label: t("car.rate.monthly"), value: onReq(car.rates.monthly) },
    { label: t("car.rate.deposit"), note: t("car.rate.depositNote", { days: rules.tiers[car.tier].releaseDays }), value: formatAED(car.rates.deposit) },
    { label: t("car.rate.km"), value: car.rates.monthly ? t("car.rate.kmValue", { day: formatNumber(car.rates.kmPerDay), month: formatNumber(kmMonth(car)) }) : t("car.rate.kmDay", { day: formatNumber(car.rates.kmPerDay) }) },
    { label: t("car.rate.extraKm"), value: t("car.rate.extraKmValue", { amount: formatAED(car.rates.extraKm) }) },
    { label: t("car.rate.minimum"), value: car.minDays > 1 ? t("car.req.minimumValue", { days: car.minDays }) : t("car.req.minimumOne") },
  ];
  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">{t("car.ratesCaption", { car: car.name })}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("car.rate.item")}</th>
          <th scope="col">{t("car.rate.amount")}</th>
        </tr>
      </thead>
      <tbody className="border-t border-line">
        {rows.map((r) => (
          <tr key={r.label} className={clsx("border-b border-line", r.strong && "bg-accent/[0.06]")}>
            <th scope="row" className="py-3.5 pe-4 ps-0 text-start align-top font-normal">
              <span className={clsx("block", r.strong ? "font-semibold text-fg" : "text-champagne")}>{r.label}</span>
              {r.note && <span className="block text-[12px] text-muted">{r.note}</span>}
            </th>
            <td className={clsx("py-3.5 text-end align-top tabular", r.strong ? "font-display text-[15px] font-bold tracking-[0.02em] text-accent-hover" : "font-semibold")}>{r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Chauffeur rates for cars that offer them. */
export function ChauffeurRates({ car, t }: { car: Car; t: T }) {
  const c = car.chauffeur;
  if (!c) return null;
  const r = rules.chauffeur;
  const rows = [
    { label: t("car.ch.hourly"), note: t("car.ch.hourlyNote", { hours: r.minHours }), value: formatAED(c.hourly) },
    { label: t("car.ch.halfDay"), note: t("car.ch.hoursNote", { hours: r.halfDayHours }), value: formatAED(c.halfDay) },
    { label: t("car.ch.fullDay"), note: t("car.ch.hoursNote", { hours: r.fullDayHours }), value: formatAED(c.fullDay) },
    { label: t("car.ch.airport"), note: t("car.ch.airportNote"), value: formatAED(c.airport) },
    { label: t("car.ch.overtime"), value: formatAED(c.overtime) },
  ];
  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">{t("car.chauffeurCaption", { car: car.name })}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">{t("car.rate.item")}</th>
          <th scope="col">{t("car.rate.amount")}</th>
        </tr>
      </thead>
      <tbody className="border-t border-line">
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-line">
            <th scope="row" className="py-3.5 pe-4 text-start align-top font-normal">
              <span className="block text-champagne">{row.label}</span>
              {row.note && <span className="block text-[12px] text-muted">{row.note}</span>}
            </th>
            <td className="py-3.5 text-end align-top font-semibold tabular">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Bugatti booking module: price on request, the rules that apply, WhatsApp concierge first. */
export function ConciergePanel({ car, today, t, href, className }: { car: Car; today: string; t: T; href: Href; className?: string }) {
  const price = formatAED(fromPrice(car, today));
  const message = t("car.conciergeMessage", { business: site.businessName, car: car.name, price });
  const list = [
    t("car.conciergeRules.escort"),
    t("car.conciergeRules.notice", { hours: car.leadHours }),
    t("car.conciergeRules.age", { age: car.minAge, years: car.licenceYears }),
    t("car.conciergeRules.minimum", { days: car.minDays }),
    t("car.conciergeRules.deposit", { amount: formatAED(car.rates.deposit) }),
  ];
  return (
    <div className={clsx("glass grid gap-5 p-6", className)}>
      <div className="grid gap-2">
        <p className="eyebrow">{t("car.conciergeEyebrow")}</p>
        <p className="display-sm">{t("car.conciergeTitle")}</p>
        <p className="font-semibold tabular text-accent-hover">{t("car.conciergePrice", { price })}</p>
        <p className="text-[14px] text-muted">{t("car.conciergeBody")}</p>
      </div>
      <ul className="m-0 grid gap-2 border-y border-line py-4 [list-style:none] ps-0">
        {list.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[14px]">
            <Check className="mt-0.5 h-4 w-4 flex-none text-accent" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-block gap-2.5">
        <WhatsAppIcon className="h-5 w-5 text-white" />
        {t("car.concierge")}
      </a>
      <Link href={href(`/book/trip?car=${car.slug}`)} className="btn btn-ghost btn-sm justify-self-center gap-2">
        {t("car.orRequest")}
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
      </Link>
      <p className="fine text-center">{site.replyPromise}</p>
    </div>
  );
}

/** Phantom booking module: chauffeur first, self-drive on approval. */
export function ChauffeurPanel({ car, today, t, href, className }: { car: Car; today: string; t: T; href: Href; className?: string }) {
  const c = car.chauffeur;
  if (!c) return null;
  const r = rules.chauffeur;
  const packages = [
    { label: `${t("car.ch.halfDay")} · ${t("car.ch.hoursNote", { hours: r.halfDayHours })}`, value: formatAED(c.halfDay) },
    { label: `${t("car.ch.fullDay")} · ${t("car.ch.hoursNote", { hours: r.fullDayHours })}`, value: formatAED(c.fullDay) },
    { label: t("car.ch.airport"), value: formatAED(c.airport) },
  ];
  return (
    <div className={clsx("glass grid gap-5 p-6", className)}>
      <div className="grid gap-2">
        <p className="eyebrow"><span className="num">VIP</span>{t("car.chauffeurPanelEyebrow")}</p>
        <p className="display-sm">{t("car.chauffeurPanelTitle")}</p>
        <p className="font-semibold tabular text-accent-hover">{t("car.chauffeurPanelPrice", { price: formatAED(c.hourly), hours: r.minHours })}</p>
      </div>
      <dl className="m-0 grid border-t border-line">
        {packages.map((p) => (
          <div key={p.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-[14px]">
            <dt className="text-champagne">{p.label}</dt>
            <dd className="m-0 font-semibold tabular">{p.value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[13px] text-muted">{r.included}</p>
      <Link href={href(`/book/trip?car=${car.slug}&service=chauffeur`)} className="btn btn-primary btn-block">{t("car.bookChauffeur")}</Link>
      <div className="grid gap-2 border-t border-line pt-4">
        <p className="label">{t("car.selfDriveApproval")}</p>
        <p className="text-[14px] text-muted">{t("car.selfDriveText", { price: formatAED(fromPrice(car, today)), age: car.minAge })}</p>
        <Link href={href(`/book/trip?car=${car.slug}`)} className="btn btn-secondary btn-sm justify-self-start">{t("car.selfDriveCta")}</Link>
      </div>
      <p className="fine">{t("car.replyPromise")} {site.replyPromise}</p>
    </div>
  );
}

/** Three data-driven FAQs for a car page. */
export function carFaqs(car: Car, today: string, t: T): { q: string; a: string }[] {
  const model = car.model;
  const deposit = formatAED(car.rates.deposit);
  const out: { q: string; a: string }[] = [];
  const c = car.chauffeur;
  const ch = rules.chauffeur;

  if (car.chauffeurFirst && c) {
    out.push({
      q: t("carFaq.priceChauffeurQ", { model }),
      a: t("carFaq.priceChauffeurA", { hourly: formatAED(c.hourly), hours: ch.minHours, halfDay: formatAED(c.halfDay), halfHours: ch.halfDayHours, fullDay: formatAED(c.fullDay), fullHours: ch.fullDayHours, airport: formatAED(c.airport) }),
    });
    out.push({ q: t("carFaq.selfDriveQ", { model }), a: t("carFaq.selfDriveA", { model, age: car.minAge, years: car.licenceYears, price: formatAED(fromPrice(car, today)) }) });
  } else if (car.rates.onRequest) {
    out.push({ q: t("carFaq.priceOnRequestQ", { model }), a: t("carFaq.priceOnRequestA", { model, today: formatAED(fromPrice(car, today)), days: car.minDays, deposit }) });
  } else {
    out.push({
      q: t("carFaq.priceQ", { model }),
      a: t("carFaq.priceA", { today: formatAED(fromPrice(car, today)), standard: formatAED(car.rates.daily), peak: formatAED(car.rates.peakDaily), weekly: car.rates.weekly ? formatAED(car.rates.weekly) : t("car.rate.onRequest"), monthly: car.rates.monthly ? formatAED(car.rates.monthly) : t("car.rate.onRequest"), deposit }),
    });
  }

  out.push({ q: t("carFaq.needQ", { model }), a: t("carFaq.needA", { age: car.minAge, years: car.licenceYears, deposit }) });

  if (out.length < 3) {
    if (car.rates.onRequest) {
      out.push({ q: t("carFaq.escortQ", { model }), a: t("carFaq.escortA", { hours: car.leadHours }) });
    } else {
      const founding = activeOffer("founding-client", today);
      out.push({
        q: t("carFaq.deliveryQ", { model }),
        a: founding
          ? t("carFaq.deliveryOfferA", { until: shortDate(founding.validUntil), airport: formatAED(airportFee()) })
          : t("carFaq.deliveryA", { fee: formatAED(dubaiFee()), airport: formatAED(airportFee()) }),
      });
    }
  }
  return out.slice(0, 3);
}
