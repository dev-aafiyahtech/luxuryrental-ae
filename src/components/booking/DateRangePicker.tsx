"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/client";
import { addDays, dayOfWeek, formatDayLong, monthName, weekdayName } from "@/lib/dates";
import { pickDay } from "./lib";

// Date-range picker following the WAI-ARIA APG date grid: Monday-first, arrow keys move by
// day/week, Home/End to the start/end of the week, PageUp/PageDown by month (Shift: year),
// Enter/Space selects. Days outside [min, max] stay focusable but can't be chosen.

const pad = (n: number) => String(n).padStart(2, "0");
const ym = (iso: string) => iso.slice(0, 7);
const firstOf = (month: string) => `${month}-01`;
function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}
const daysIn = (month: string) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
function addMonths(iso: string, n: number): string {
  const month = shiftMonth(ym(iso), n);
  const day = Math.min(Number(iso.slice(8, 10)), daysIn(month));
  return `${month}-${pad(day)}`;
}
function weeks(month: string): (string | null)[][] {
  const offset = (dayOfWeek(firstOf(month)) + 6) % 7; // Monday-first
  const cells: (string | null)[] = Array.from({ length: offset }, () => null);
  for (let d = 1; d <= daysIn(month); d++) cells.push(`${month}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}
const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

export interface DateRangePickerProps {
  mode?: "range" | "single";
  start?: string;
  end?: string;
  onChange: (range: { start: string; end?: string }) => void;
  /** Earliest selectable day (notice period). */
  min: string;
  /** Latest selectable day. */
  max: string;
  /** Today: navigation never goes before this month. */
  today: string;
  months?: 1 | 2;
  minDays?: number;
  /** Polite live-region text, e.g. "Sat 24 Oct to Mon 26 Oct, 2 days, AED 15,000". */
  announce?: string;
  label: string;
  /** Shown under the grid when some days are unavailable. */
  disabledHint?: string;
  id?: string;
}

export function DateRangePicker({ mode = "range", start, end, onChange, min, max, today, months = 1, minDays = 1, announce, label, disabledHint, id }: DateRangePickerProps) {
  const t = useT("booking");
  const uid = useId();
  const gridRef = useRef<HTMLDivElement>(null);
  const wantFocus = useRef(false);
  const [view, setView] = useState(() => ym(start ?? min));
  const [focusDate, setFocusDate] = useState(() => start ?? min);
  const [awaitingEnd, setAwaitingEnd] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  // Follow selections made elsewhere (chips, rail): show the month of the new start.
  const [seenStart, setSeenStart] = useState(start);
  if (start !== seenStart) {
    setSeenStart(start);
    if (start) {
      const visible = Array.from({ length: months }, (_, i) => shiftMonth(view, i));
      if (!visible.includes(ym(start))) setView(ym(start));
      setFocusDate(start);
    }
  }

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
  });

  const visibleMonths = Array.from({ length: months }, (_, i) => shiftMonth(view, i));
  const firstNav = ym(today);
  const lastNav = ym(max);
  const canPrev = view > firstNav;
  const canNext = shiftMonth(view, months - 1) < lastNav;
  const tabbable = visibleMonths.includes(ym(focusDate)) ? focusDate : (() => {
    const first = firstOf(visibleMonths[0]);
    return first < min && ym(min) === visibleMonths[0] ? min : first;
  })();

  const disabled = (d: string) => d < min || d > max;
  const previewEnd = mode === "range" && awaitingEnd && start && hover && hover > start ? hover : undefined;
  const rangeEnd = previewEnd ?? end;

  function choose(d: string) {
    if (disabled(d)) return;
    if (mode === "single") {
      onChange({ start: d });
      return;
    }
    const next = pickDay({ start, end }, d, awaitingEnd, minDays, max);
    setAwaitingEnd(next.awaitingEnd);
    onChange({ start: next.start, end: next.end });
  }

  function moveTo(d: string) {
    const lo = firstOf(firstNav);
    const hi = max;
    const target = d < lo ? lo : d > hi ? hi : d;
    setFocusDate(target);
    const month = ym(target);
    if (!visibleMonths.includes(month)) setView(month < view ? month : shiftMonth(month, -(months - 1)));
    wantFocus.current = true;
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, d: string) {
    const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
    const col = (dayOfWeek(d) + 6) % 7;
    let next: string | null = null;
    switch (e.key) {
      case "ArrowRight": next = addDays(d, rtl ? -1 : 1); break;
      case "ArrowLeft": next = addDays(d, rtl ? 1 : -1); break;
      case "ArrowDown": next = addDays(d, 7); break;
      case "ArrowUp": next = addDays(d, -7); break;
      case "Home": next = addDays(d, -col); break;
      case "End": next = addDays(d, 6 - col); break;
      case "PageUp": next = addMonths(d, e.shiftKey ? -12 : -1); break;
      case "PageDown": next = addMonths(d, e.shiftKey ? 12 : 1); break;
      default: return;
    }
    e.preventDefault();
    moveTo(next);
  }

  function page(n: number) {
    const nextView = shiftMonth(view, n);
    setView(nextView);
    setFocusDate(firstOf(nextView) < min && ym(min) === nextView ? min : firstOf(nextView));
  }

  const hint = mode === "range" ? (awaitingEnd ? t("picker.chooseReturn") : t("picker.chooseStart")) : t("picker.chooseDay");

  return (
    <div id={id} tabIndex={id ? -1 : undefined} role="group" aria-label={label} className="grid gap-3 outline-none">
      <div ref={gridRef} className="relative">
        <button type="button" onClick={() => page(-1)} disabled={!canPrev} aria-label={t("picker.prevMonth")} className="absolute start-0 top-0 z-[1] inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fg hover:border-accent disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => page(1)} disabled={!canNext} aria-label={t("picker.nextMonth")} className="absolute end-0 top-0 z-[1] inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-fg hover:border-accent disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
        <div className={clsx("grid gap-6", months === 2 && "grid-cols-2")}>
          {visibleMonths.map((month) => {
            const [y, m] = month.split("-").map(Number);
            const headingId = `${uid}-${month}`;
            return (
              <div key={month} className="min-w-0">
                <h3 id={headingId} aria-live="polite" className="flex h-11 items-center justify-center text-sm font-semibold tracking-[0.04em]">
                  {monthName(m)} {y}
                </h3>
                <table role="grid" aria-labelledby={headingId} className="mt-2 w-full table-fixed border-collapse">
                  <thead>
                    <tr>
                      {MONDAY_FIRST.map((dow) => (
                        <th key={dow} scope="col" abbr={weekdayName(dow, true)} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
                          {weekdayName(dow).slice(0, 2)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks(month).map((week, wi) => (
                      <tr key={wi}>
                        {week.map((d, di) => {
                          if (!d) return <td key={di} role="gridcell" />;
                          const isStart = d === start;
                          const isEnd = mode === "range" && d === rangeEnd;
                          const inRange = mode === "range" && !!start && !!rangeEnd && d > start && d < rangeEnd;
                          const off = disabled(d);
                          const isToday = d === today;
                          const selected = isStart || isEnd || inRange;
                          const state = [isStart ? t(mode === "range" ? "picker.pickup" : "picker.selected") : "", isEnd ? t("picker.return") : "", inRange ? t("picker.inRange") : "", isToday ? t("picker.today") : "", off ? t("picker.unavailable") : ""].filter(Boolean).join(", ");
                          return (
                            <td
                              key={d}
                              role="gridcell"
                              aria-selected={selected}
                              className={clsx(
                                "p-0 text-center",
                                (inRange || (isStart && rangeEnd && rangeEnd > d) || (isEnd && start && start < d)) && "bg-accent/15",
                                isStart && rangeEnd && rangeEnd > d && "rounded-s-full",
                                isEnd && "rounded-e-full",
                              )}
                            >
                              <button
                                type="button"
                                data-date={d}
                                tabIndex={d === tabbable ? 0 : -1}
                                aria-label={`${formatDayLong(d)}${state ? `, ${state}` : ""}`}
                                aria-disabled={off || undefined}
                                onClick={() => {
                                  setFocusDate(d);
                                  choose(d);
                                }}
                                onKeyDown={(e) => onKey(e, d)}
                                onMouseEnter={() => setHover(d)}
                                onMouseLeave={() => setHover(null)}
                                onFocus={() => setHover(d)}
                                className={clsx(
                                  "relative mx-auto flex h-11 w-full max-w-11 items-center justify-center rounded-full text-[15px] tabular transition-colors duration-150",
                                  off ? "cursor-not-allowed text-muted/40 line-through decoration-muted/40" : "cursor-pointer text-fg hover:bg-elevated",
                                  (isStart || isEnd) && !off && "bg-accent font-semibold text-on-accent hover:bg-accent-hover",
                                  isToday && !(isStart || isEnd) && "font-semibold text-accent-hover",
                                )}
                              >
                                {Number(d.slice(8, 10))}
                                {isToday && <span aria-hidden="true" className="absolute bottom-1.5 h-1 w-1 rounded-full bg-current" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </div>
      <p className="field-hint">{hint}</p>
      {disabledHint && <p className="field-hint">{disabledHint}</p>}
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}
