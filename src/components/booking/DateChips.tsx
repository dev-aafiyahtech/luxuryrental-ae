"use client";

import clsx from "clsx";
import type { Car } from "@/content/types";
import { useLocale, useT } from "@/i18n/client";
import { addDays, formatRange } from "@/lib/dates";
import { minDaysFor } from "@/lib/pricing";
import { PRESETS, presetRange, type PresetId } from "./lib";

/** Preset ranges for a car (stretched to the car's minimum rental for that pickup day). */
export function chipRange(id: PresetId, today: string, earliest: string, car?: Car) {
  const r = presetRange(id, today, earliest);
  if (!r || !car) return r;
  const min = minDaysFor(car, r.start);
  const minEnd = addDays(r.start, min);
  return { start: r.start, end: r.end < minEnd ? minEnd : r.end };
}

/** Tomorrow · This weekend · 3 days · 7 days. Toggle buttons; one tap sets both dates. */
export function DateChips({ today, earliest, start, end, car, onPick, className, size = "md" }: {
  today: string;
  /** Earliest allowed pickup date (notice period). */
  earliest: string;
  start?: string;
  end?: string;
  car?: Car;
  onPick: (range: { start: string; end: string }, id: PresetId) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const t = useT("booking");
  const locale = useLocale();
  return (
    <div role="group" aria-label={t("chips.label")} className={clsx("flex flex-wrap gap-2", className)}>
      {PRESETS.map((id) => {
        const r = chipRange(id, today, earliest, car);
        const label = t(`chips.${id}`);
        const on = !!r && r.start === start && r.end === end;
        return (
          <button
            key={id}
            type="button"
            disabled={!r}
            aria-pressed={on}
            aria-label={r ? t("chips.rangeLabel", { label, range: formatRange(r.start, r.end, locale) }) : t("chips.unavailable", { label })}
            onClick={() => r && onPick(r, id)}
            className={clsx(
              "inline-flex items-center justify-center rounded-full border px-4 font-semibold transition-colors duration-200",
              size === "sm" ? "min-h-11 text-[12px]" : "min-h-11 text-[13px]",
              on ? "border-accent bg-accent text-on-accent" : "border-input text-fg hover:border-accent",
              "disabled:cursor-not-allowed disabled:border-line disabled:text-muted/60 disabled:line-through",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
