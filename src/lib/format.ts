const nf = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });

// Every helper takes an optional locale ("en" default). Arabic keeps Western digits, as UAE
// commerce sites do, with Arabic units: "3,500 درهم", "350 كم/س".

/** "AED 3,500" (whole dirhams, Western digits); Arabic "3,500 درهم". */
export const formatAED = (amount: number, locale?: string) => (locale === "ar" ? `${nf.format(Math.round(amount))} درهم` : `AED ${nf.format(Math.round(amount))}`);

export const formatNumber = (n: number) => nf.format(n);

/** "AED 3,500 / day"; Arabic "3,500 درهم / يوم" */
export const formatPerDay = (amount: number, locale?: string) => `${formatAED(amount, locale)} / ${locale === "ar" ? "يوم" : "day"}`;

/** "0–100 km/h in 2.5 s" helpers for spec text. */
export const formatSeconds = (s: number, locale?: string) => `${s.toFixed(1)} ${locale === "ar" ? "ث" : "s"}`;

export function formatTopSpeed(kmh: number, note?: string, locale?: string) {
  if (locale === "ar") {
    if (note === "over") return `أكثر من ${nf.format(kmh)} كم/س`;
    if (note === "limited") return `${nf.format(kmh)} كم/س (محدودة)`;
    return `${nf.format(kmh)} كم/س`;
  }
  if (note === "over") return `Over ${nf.format(kmh)} km/h`;
  if (note === "limited") return `${nf.format(kmh)} km/h (limited)`;
  return `${nf.format(kmh)} km/h`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
