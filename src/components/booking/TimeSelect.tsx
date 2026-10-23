"use client";

import { useT } from "@/i18n/client";
import { rules } from "@/content/rules";
import { timeSlots } from "@/lib/dates";
import { Field, describedBy } from "./Field";
import { isNightSlot, isOutOfHoursSlot } from "./lib";

const SLOTS = timeSlots();

/** 30-minute time slots. Handover slots outside 08:00–22:00 are marked "+AED 300"; chauffeur night starts "+20%". */
export function TimeSelect({ id, label, value, onChange, date, earliest, kind = "handover", error, hint, onBlur, className }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** The date this time belongs to; slots before `earliest.time` on `earliest.date` are disabled. */
  date?: string;
  earliest?: { date: string; time: string } | null;
  kind?: "handover" | "chauffeur";
  error?: string;
  hint?: string;
  onBlur?: () => void;
  className?: string;
}) {
  const t = useT("booking");
  return (
    <Field id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        className="input tabular"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      >
        {SLOTS.map((s) => {
          const tooSoon = !!earliest && !!date && (date < earliest.date || (date === earliest.date && s < earliest.time));
          const extra =
            kind === "handover"
              ? isOutOfHoursSlot(s) ? ` · ${t("time.ooh", { fee: rules.outOfHoursFee })}` : ""
              : isNightSlot(s) ? ` · ${t("time.night", { pct: rules.chauffeur.nightSurchargePct })}` : "";
          return (
            <option key={s} value={s} disabled={tooSoon && s !== value}>
              {s}
              {extra}
              {tooSoon ? ` · ${t("time.tooSoon")}` : ""}
            </option>
          );
        })}
      </select>
    </Field>
  );
}
