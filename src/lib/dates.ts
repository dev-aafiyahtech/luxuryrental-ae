// Dates are handled as plain strings in Dubai time (UTC+4, no daylight saving):
// dates as "YYYY-MM-DD", times as "HH:MM". This keeps the server and every visitor's
// browser in agreement whatever their own time zone.

const DUBAI_OFFSET_MIN = 4 * 60;
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Arabic (UAE): Gregorian month names, full weekday names, Western digits as on UAE commerce sites.
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const isAr = (locale?: string) => locale === "ar";

const pad = (n: number) => String(n).padStart(2, "0");

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

/** The current moment as Dubai wall-clock date and time. */
export function nowInDubai(now: Date = new Date()) {
  const t = new Date(now.getTime() + DUBAI_OFFSET_MIN * 60_000);
  return {
    date: `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
    time: `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`,
  };
}

export const todayInDubai = (now?: Date) => nowInDubai(now).date;

export function addDays(iso: string, n: number): string {
  const { y, m, d } = parts(iso);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Minutes since the epoch for a Dubai date and time (only used for differences). */
export function toMinutes(date: string, time = "00:00"): number {
  const { y, m, d } = parts(date);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh || 0, mm || 0) / 60_000;
}

export const minutesNow = (now?: Date) => {
  const n = nowInDubai(now);
  return toMinutes(n.date, n.time);
};

export const dayOfWeek = (iso: string) => {
  const { y, m, d } = parts(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const daysBetween = (a: string, b: string) => Math.round((toMinutes(b) - toMinutes(a)) / 1440);

export const isValidIsoDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
export const isValidTime = (v: unknown): v is string => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** "Fri 24 Oct" (Arabic: "الجمعة 24 أكتوبر") */
export function formatDay(iso: string, locale?: string): string {
  const { m, d } = parts(iso);
  if (isAr(locale)) return `${DAYS_AR[dayOfWeek(iso)]} ${d} ${MONTHS_AR[m - 1]}`;
  return `${DAYS[dayOfWeek(iso)]} ${d} ${MONTHS[m - 1]}`;
}

/** "Friday 24 October 2026" */
export function formatDayLong(iso: string, locale?: string): string {
  const { y, m, d } = parts(iso);
  if (isAr(locale)) return `${DAYS_AR[dayOfWeek(iso)]} ${d} ${MONTHS_AR[m - 1]} ${y}`;
  return `${DAYS_LONG[dayOfWeek(iso)]} ${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

/** "24/10/2026" (the site's numeric format; never US order). */
export function formatNumericDate(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${pad(d)}/${pad(m)}/${y}`;
}

/** "Fri 24 – Sun 26 Oct" or "Fri 30 Oct – Mon 2 Nov" */
export function formatRange(a: string, b: string, locale?: string): string {
  const pa = parts(a), pb = parts(b);
  if (pa.y === pb.y && pa.m === pb.m) return `${(isAr(locale) ? DAYS_AR : DAYS)[dayOfWeek(a)]} ${pa.d} – ${formatDay(b, locale)}`;
  return `${formatDay(a, locale)} – ${formatDay(b, locale)}`;
}

export const monthName = (m: number, long = true, locale?: string) => (isAr(locale) ? MONTHS_AR : long ? MONTHS_LONG : MONTHS)[m - 1];
export const weekdayName = (i: number, long = false, locale?: string) => (isAr(locale) ? DAYS_AR : long ? DAYS_LONG : DAYS)[i];

/** Half-hour slots between two times, inclusive: ["08:00", "08:30", ...]. */
export function timeSlots(from = "00:00", to = "23:30", step = 30): string[] {
  const out: string[] = [];
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  for (let t = fh * 60 + fm; t <= th * 60 + tm; t += step) out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  return out;
}

export const isWithin = (time: string, from: string, to: string) => time >= from && time <= to;
