"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { useT } from "@/i18n/client";

/** aria-describedby value for a field with an optional hint and error. */
export const describedBy = (id: string, hint?: ReactNode, error?: ReactNode) => [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="field-error flex items-start gap-1.5">
      <CircleAlert className="mt-px h-4 w-4 flex-none" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Label always visible above the control, then hint and error (linked by id). */
export function Field({ id, label, hint, error, optional, children, className }: { id: string; label: ReactNode; hint?: ReactNode; error?: ReactNode; optional?: boolean; children: ReactNode; className?: string }) {
  const t = useT("booking");
  return (
    <div className={clsx("field", className)}>
      <label htmlFor={id}>
        {label}
        {optional && <span className="ms-1.5 font-medium normal-case tracking-normal">{t("form.optional")}</span>}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export function Checkbox({ id, checked, onChange, children, error, hint, required, onBlur }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: ReactNode; hint?: ReactNode; required?: boolean; onBlur?: () => void }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          className="mt-3 h-5 w-5 flex-none cursor-pointer accent-[#ebdab0]"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          aria-required={required || undefined}
        />
        <label htmlFor={id} className="min-h-11 flex-1 cursor-pointer py-2.5 text-[15px] leading-snug text-champagne">
          {children}
        </label>
      </div>
      {hint && <p id={`${id}-hint`} className="field-hint ps-8">{hint}</p>}
      <div className="ps-8">
        <FieldError id={`${id}-error`}>{error}</FieldError>
      </div>
    </div>
  );
}

/** A form section with a visible legend. */
export function Section({ legend, children, className, id, hint }: { legend: ReactNode; children: ReactNode; className?: string; id?: string; hint?: ReactNode }) {
  return (
    <fieldset id={id} tabIndex={id ? -1 : undefined} className={clsx("m-0 grid min-w-0 gap-5 border-0 border-t border-line p-0 pt-6 outline-none", className)}>
      <legend className="float-start mb-1 w-full p-0 text-[15px] font-semibold text-fg">{legend}</legend>
      {hint && <p className="field-hint -mt-3">{hint}</p>}
      {children}
    </fieldset>
  );
}
