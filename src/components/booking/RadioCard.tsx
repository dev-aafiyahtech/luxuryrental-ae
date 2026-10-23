"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

/** A large radio option: title, description and an optional price or badge on the end side. */
export function RadioCard({ name, value, checked, onChange, title, description, aside, badge, disabled, id }: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label
      className={clsx(
        "card relative flex cursor-pointer items-start gap-4 p-4 transition-colors duration-200 sm:p-5",
        "hover:border-muted has-[:checked]:border-accent has-[:checked]:bg-elevated",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input id={id} type="radio" className="peer sr-only" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
      <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full border-2 border-input peer-checked:border-accent peer-checked:[&>span]:opacity-100">
        <span className="h-2.5 w-2.5 rounded-full bg-accent opacity-0" />
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold text-fg">
          {title}
          {badge}
        </span>
        {description && <span className="text-sm leading-snug text-muted">{description}</span>}
      </span>
      {aside && <span className="flex-none text-end text-sm font-semibold tabular text-fg">{aside}</span>}
    </label>
  );
}
