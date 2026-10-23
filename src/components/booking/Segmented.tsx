"use client";

import clsx from "clsx";
import { useId } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/** Segmented control: native radios in a fieldset (arrow keys, labels and states come for free). */
export function Segmented<T extends string>({ legend, value, options, onChange, className, legendHidden, name, size = "md", id }: {
  legend: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
  className?: string;
  legendHidden?: boolean;
  name?: string;
  size?: "sm" | "md";
  id?: string;
}) {
  const auto = useId();
  const group = name ?? auto;
  return (
    <fieldset id={id} tabIndex={id ? -1 : undefined} className={clsx("m-0 min-w-0 border-0 p-0 outline-none", className)}>
      <legend className={clsx(legendHidden ? "sr-only" : "mb-1.5 p-0 ps-0.5 text-[11px] font-semibold uppercase leading-tight tracking-[0.16em] text-muted")}>{legend}</legend>
      <div className="flex gap-1 rounded-full border border-input bg-card p-1">
        {options.map((o) => (
          <label
            key={o.value}
            className={clsx(
              "relative flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 text-center font-semibold leading-tight text-muted transition-colors duration-200",
              size === "sm" ? "min-h-10 text-[12px]" : "min-h-11 text-[13px]",
              "has-[:checked]:bg-accent has-[:checked]:text-on-accent [&:not(:has(:checked)):hover]:text-fg",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              o.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <input type="radio" className="sr-only" name={group} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
