import clsx from "clsx";
import type { Car } from "@/content/types";
import { fromPrice } from "@/lib/pricing";
import { formatAED, formatNumber, formatSeconds, formatTopSpeed } from "@/lib/format";
import { commonT } from "@/i18n/static";

// Shared car facts as text. Every helper takes the page's locale (English when omitted); the
// labels live in src/messages/{locale}/common.json under "car".

/** "From AED 4,000 / day" for today's season. Server pages get `today` from getToday(). */
export function PriceFrom({ car, today, className, size = "md", locale }: { car: Car; today: string; className?: string; size?: "md" | "lg"; locale?: string }) {
  const t = commonT(locale);
  const price = fromPrice(car, today);
  return (
    <p className={clsx("flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular", className)}>
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{car.rates.onRequest ? t("car.onRequestFrom") : t("car.from")}</span>
      <span className={clsx("font-semibold", size === "lg" ? "text-2xl" : "text-xl")}>{formatAED(price, locale)}</span>
      <span className="text-[12px] text-muted">{t("car.perDay")}</span>
    </p>
  );
}

/** "All-wheel drive" / "Rear-wheel drive". */
export const driveText = (car: Car, locale?: string) => commonT(locale)(car.specs.drivetrain === "AWD" ? "car.awd" : "car.rwd");

export function specRows(car: Car, locale?: string): { label: string; value: string }[] {
  const t = commonT(locale);
  const s = car.specs;
  return [
    { label: t("car.spec.engine"), value: s.engine },
    { label: t("car.spec.power"), value: t("car.hpPs", { hp: formatNumber(s.hp), ps: formatNumber(s.ps) }) },
    { label: t("car.spec.sprint"), value: formatSeconds(s.zeroTo100, locale) },
    { label: t("car.spec.top"), value: formatTopSpeed(s.topSpeedKmh, s.topSpeedNote, locale) },
    { label: t("car.spec.seats"), value: s.seats },
    { label: t("car.spec.body"), value: s.body },
    { label: t("car.spec.drive"), value: driveText(car, locale) },
  ];
}

export function SpecList({ car, rows, className, locale }: { car: Car; rows?: { label: string; value: string }[]; className?: string; locale?: string }) {
  const list = rows ?? specRows(car, locale);
  return (
    <dl className={clsx("spec-list", className)}>
      {list.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Short headline specs: "1,001 hp · 0–100 in 2.5 s · 2 seats". */
export function headlineSpecs(car: Car, locale?: string) {
  const t = commonT(locale);
  return [t("car.hp", { hp: formatNumber(car.specs.hp) }), t("car.sprint", { s: formatSeconds(car.specs.zeroTo100, locale) }), t("car.seats", { seats: car.specs.seats })];
}

/** Spec callouts for the Kinetic Sculpture and car pages, built from facts in the data. */
export function callouts(car: Car, locale?: string) {
  const t = commonT(locale);
  const s = car.specs;
  return [
    { part: "powertrain" as const, title: s.engine, detail: t(s.hybrid ? "car.callout.powerHybrid" : "car.hp", { hp: formatNumber(s.hp) }) },
    { part: "body" as const, title: t("car.callout.sprint", { s: formatSeconds(s.zeroTo100, locale) }), detail: t("car.callout.top", { speed: formatTopSpeed(s.topSpeedKmh, s.topSpeedNote, locale).toLowerCase() }) },
    { part: "cabin" as const, title: s.body, detail: t("car.seats", { seats: s.seats }) },
    { part: "wheels" as const, title: driveText(car, locale), detail: t("car.callout.km", { km: formatNumber(car.rates.kmPerDay) }) },
  ];
}

export { formatAED };
