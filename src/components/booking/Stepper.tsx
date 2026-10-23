"use client";

import { useId, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { useT } from "@/i18n/client";

/** Number stepper: − value + with a polite announcement of the new value. */
export function Stepper({ label, value, onChange, min = 0, max = 10, hint, aside, unit }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: ReactNode;
  aside?: ReactNode;
  unit?: (n: number) => string;
}) {
  const t = useT("booking");
  const id = useId();
  const btn = "inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-input text-fg transition-colors hover:border-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:border-input";
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="grid min-w-0 flex-1 gap-1">
        <span id={`${id}-label`} className="font-semibold text-fg">{label}</span>
        {hint && <span id={`${id}-hint`} className="text-sm leading-snug text-muted">{hint}</span>}
      </div>
      <div className="flex items-center gap-3">
        {aside && <span className="text-sm font-semibold tabular text-muted">{aside}</span>}
        <div role="group" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined} className="flex items-center gap-2">
          <button type="button" className={btn} aria-label={t("stepper.less", { label })} aria-disabled={value <= min || undefined} onClick={() => value > min && set(value - 1)}>
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <output aria-live="polite" className="min-w-10 text-center text-lg font-semibold tabular">
            {unit ? unit(value) : value}
          </output>
          <button type="button" className={btn} aria-label={t("stepper.more", { label })} aria-disabled={value >= max || undefined} onClick={() => value < max && set(value + 1)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
