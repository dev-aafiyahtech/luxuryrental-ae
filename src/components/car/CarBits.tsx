import clsx from "clsx";
import type { Car } from "@/content/types";
import { fromPrice } from "@/lib/pricing";
import { formatAED, formatNumber, formatSeconds, formatTopSpeed } from "@/lib/format";

/** "From AED 4,000 / day" for today's season. Server pages get `today` from getToday(). */
export function PriceFrom({ car, today, className, size = "md" }: { car: Car; today: string; className?: string; size?: "md" | "lg" }) {
  const price = fromPrice(car, today);
  return (
    <p className={clsx("flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular", className)}>
      <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">{car.rates.onRequest ? "On request · from" : "From"}</span>
      <span className={clsx("font-semibold", size === "lg" ? "text-2xl" : "text-xl")}>{formatAED(price)}</span>
      <span className="text-[12px] text-muted">/ day</span>
    </p>
  );
}

export function specRows(car: Car): { label: string; value: string }[] {
  const s = car.specs;
  return [
    { label: "Engine", value: s.engine },
    { label: "Power", value: `${formatNumber(s.hp)} hp (${formatNumber(s.ps)} PS)` },
    { label: "0–100 km/h", value: formatSeconds(s.zeroTo100) },
    { label: "Top speed", value: formatTopSpeed(s.topSpeedKmh, s.topSpeedNote) },
    { label: "Seats", value: s.seats },
    { label: "Body", value: s.body },
    { label: "Drive", value: s.drivetrain === "AWD" ? "All-wheel drive" : "Rear-wheel drive" },
  ];
}

export function SpecList({ car, rows, className }: { car: Car; rows?: { label: string; value: string }[]; className?: string }) {
  const list = rows ?? specRows(car);
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
export function headlineSpecs(car: Car) {
  return [`${formatNumber(car.specs.hp)} hp`, `0–100 in ${formatSeconds(car.specs.zeroTo100)}`, `${car.specs.seats} seats`];
}

/** Spec callouts for the Kinetic Sculpture and car pages, built from facts in the data. */
export function callouts(car: Car) {
  const s = car.specs;
  return [
    { part: "powertrain" as const, title: s.engine, detail: `${formatNumber(s.hp)} hp${s.hybrid ? " combined" : ""}` },
    { part: "body" as const, title: `0–100 km/h in ${formatSeconds(s.zeroTo100)}`, detail: `Top speed ${formatTopSpeed(s.topSpeedKmh, s.topSpeedNote).toLowerCase()}` },
    { part: "cabin" as const, title: s.body, detail: `${s.seats} seats` },
    { part: "wheels" as const, title: s.drivetrain === "AWD" ? "All-wheel drive" : "Rear-wheel drive", detail: `${formatNumber(car.rates.kmPerDay)} km a day included` },
  ];
}

export { formatAED };
