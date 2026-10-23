"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/i18n/client";
import { addDays, dayOfWeek, formatDayLong, monthName, weekdayName } from "@/lib/dates";
import { pickDay } from "./lib";

/**
 * The next 30 days as a horizontal rail of day buttons. Range mode: the first tap moves the
 * pickup (keeping the rental length), a later tap sets the return. Keyboard: one tab stop,
 * arrows and Home/End move between days. Scroll buttons for mouse users (no dragging needed).
 */
export function DateRail({ mode = "range", start, end, today, min, max, minDays = 1, onChange, className, count = 30 }: {
  mode?: "range" | "single";
  start?: string;
  end?: string;
  today: string;
  /** Earliest selectable day (notice period). */
  min: string;
  max?: string;
  minDays?: number;
  onChange: (range: { start: string; end?: string }) => void;
  className?: string;
  count?: number;
}) {
  const t = useT("booking");
  const scroller = useRef<HTMLDivElement>(null);
  const [awaitingEnd, setAwaitingEnd] = useState(false);
  const [focusDay, setFocusDay] = useState<string | null>(null);
  const days = Array.from({ length: count }, (_, i) => addDays(today, i));
  const off = (d: string) => d < min || (!!max && d > max);
  const firstOn = days.find((d) => !off(d)) ?? days[0];
  const tabbable = focusDay && days.includes(focusDay) ? focusDay : start && days.includes(start) ? start : firstOn;

  // Keep the pickup day in view when it changes elsewhere (chips, calendar). Scrolls the rail only, never the page.
  useEffect(() => {
    const box = scroller.current;
    const btn = start ? box?.querySelector<HTMLButtonElement>(`[data-day="${start}"]`) : null;
    if (!box || !btn) return;
    const b = btn.getBoundingClientRect(), r = box.getBoundingClientRect();
    if (b.left < r.left || b.right > r.right) box.scrollBy({ left: b.left - r.left - r.width / 2 + b.width / 2, behavior: "auto" });
  }, [start]);

  function choose(d: string) {
    if (off(d)) return;
    if (mode === "single") {
      onChange({ start: d });
      return;
    }
    const next = pickDay({ start, end }, d, awaitingEnd, minDays, max);
    setAwaitingEnd(next.awaitingEnd);
    onChange({ start: next.start, end: next.end });
  }

  function focus(d: string) {
    setFocusDay(d);
    const btn = scroller.current?.querySelector<HTMLButtonElement>(`[data-day="${d}"]`);
    btn?.focus({ preventScroll: true });
    btn?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const rtl = document.documentElement.dir === "rtl";
    let j: number | null = null;
    if (e.key === "ArrowRight") j = i + (rtl ? -1 : 1);
    else if (e.key === "ArrowLeft") j = i + (rtl ? 1 : -1);
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = days.length - 1;
    if (j === null) return;
    e.preventDefault();
    focus(days[Math.max(0, Math.min(days.length - 1, j))]);
  }

  function page(dir: 1 | -1) {
    const box = scroller.current;
    if (!box) return;
    const rtl = document.documentElement.dir === "rtl";
    box.scrollBy({ left: dir * (rtl ? -1 : 1) * box.clientWidth * 0.8, behavior: "smooth" });
  }

  const rangeEnd = mode === "range" ? end : undefined;
  const nav = "hidden h-11 w-11 flex-none items-center justify-center rounded-full border border-line text-fg hover:border-accent sm:inline-flex";

  return (
    <div className={clsx("grid gap-2", className)}>
      <div className="flex items-center gap-2">
        <button type="button" className={nav} onClick={() => page(-1)} aria-label={t("rail.prev")} tabIndex={-1}>
          <ChevronLeft className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
        <div
          ref={scroller}
          role="group"
          aria-label={mode === "range" ? t("rail.label") : t("rail.labelSingle")}
          className="flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [scrollbar-width:thin] motion-reduce:scroll-auto"
        >
          {days.map((d, i) => {
            const disabled = off(d);
            const isStart = d === start;
            const isEnd = d === rangeEnd;
            const inRange = !!start && !!rangeEnd && d > start && d < rangeEnd;
            const dom = Number(d.slice(8, 10));
            const state = [isStart ? t(mode === "range" ? "picker.pickup" : "picker.selected") : "", isEnd ? t("picker.return") : "", inRange ? t("picker.inRange") : "", d === today ? t("picker.today") : "", disabled ? t("picker.unavailable") : ""].filter(Boolean).join(", ");
            return (
              <button
                key={d}
                type="button"
                data-day={d}
                tabIndex={d === tabbable ? 0 : -1}
                aria-pressed={isStart || isEnd}
                aria-disabled={disabled || undefined}
                aria-label={`${formatDayLong(d)}${state ? `, ${state}` : ""}`}
                onClick={() => {
                  setFocusDay(d);
                  choose(d);
                }}
                onKeyDown={(e) => onKey(e, i)}
                className={clsx(
                  "grid min-h-16 w-[52px] flex-none snap-start place-items-center content-center gap-0.5 rounded-xl border text-center transition-colors duration-150",
                  isStart || isEnd ? "border-accent bg-accent text-on-accent" : inRange ? "border-accent/30 bg-accent/15 text-fg" : "border-line text-fg hover:border-accent",
                  disabled && "cursor-not-allowed border-transparent text-muted/50 hover:border-transparent",
                )}
              >
                <span className={clsx("text-[10px] font-semibold uppercase tracking-[0.1em]", isStart || isEnd ? "text-on-accent" : "text-muted")}>{weekdayName(dayOfWeek(d))}</span>
                <span className={clsx("text-base font-semibold tabular", disabled && "line-through")}>{dom}</span>
                <span className={clsx("text-[10px] uppercase tracking-[0.08em]", isStart || isEnd ? "text-on-accent" : "text-muted", !(i === 0 || dom === 1) && "invisible")}>{monthName(Number(d.slice(5, 7)), false)}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className={nav} onClick={() => page(1)} aria-label={t("rail.next")} tabIndex={-1}>
          <ChevronRight className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </div>
      {mode === "range" && (
        <p className="field-hint min-h-[1.4em]" aria-live="polite">
          {awaitingEnd ? t("rail.tapReturn") : ""}
        </p>
      )}
    </div>
  );
}
