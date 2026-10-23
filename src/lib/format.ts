const nf = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });

/** "AED 3,500" (whole dirhams, Western digits). */
export const formatAED = (amount: number) => `AED ${nf.format(Math.round(amount))}`;

export const formatNumber = (n: number) => nf.format(n);

/** "AED 3,500 / day" */
export const formatPerDay = (amount: number) => `${formatAED(amount)} / day`;

/** "0–100 km/h in 2.5 s" helpers for spec text. */
export const formatSeconds = (s: number) => `${s.toFixed(1)} s`;

export function formatTopSpeed(kmh: number, note?: string) {
  if (note === "over") return `Over ${nf.format(kmh)} km/h`;
  if (note === "limited") return `${nf.format(kmh)} km/h (limited)`;
  return `${nf.format(kmh)} km/h`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
