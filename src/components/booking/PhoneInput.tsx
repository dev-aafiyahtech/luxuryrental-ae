"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useT } from "@/i18n/client";
import { dirOf } from "@/i18n/config";
import { describedBy, FieldError } from "./Field";
import { dialCodes, dialName, parsePhone, toE164 } from "./lib";

/**
 * Phone number as country code + national number, stored as E.164 ("+971501234567").
 * The visible text is kept as typed, so nothing is ever cleared or reformatted under the cursor.
 */
export function PhoneInput({ id, label, value, onChange, onBlur, error, hint }: {
  id: string;
  label: string;
  value?: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
}) {
  const t = useT("booking");
  const locale = useLocale();
  const [initial] = useState(() => parsePhone(value));
  const [iso, setIso] = useState(initial.iso);
  const [national, setNational] = useState(initial.national);
  const dial = dialCodes.find((c) => c.iso === iso)?.dial ?? "971";

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {/* Code then number, left to right in every language (as the number is written); the picker's list keeps the page direction. */}
      <div className="flex gap-2" dir="ltr">
        <div className="relative flex-none rounded-xl has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
          <span aria-hidden="true" className="pointer-events-none flex min-h-12 items-center gap-1.5 rounded-xl border border-input bg-card px-3 text-[15px] font-semibold tabular">
            <span className="text-[11px] font-semibold tracking-[0.08em] text-muted">{iso}</span>
            <span dir="ltr">+{dial}</span>
            <ChevronDown className="h-4 w-4 text-accent" />
          </span>
          <select
            dir={dirOf(locale)}
            aria-label={t("phone.country")}
            autoComplete="tel-country-code"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={iso}
            onChange={(e) => {
              setIso(e.target.value);
              onChange(toE164(e.target.value, national));
            }}
          >
            {dialCodes.map((c) => (
              <option key={c.iso} value={c.iso}>
                {locale === "ar" ? `${dialName(c, locale)} \u2066(+${c.dial})\u2069` : `${c.name} (+${c.dial})`}
              </option>
            ))}
          </select>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          dir="ltr"
          className="input min-w-0 flex-1 tabular"
          value={national}
          placeholder={iso === "AE" ? "50 123 4567" : undefined}
          onChange={(e) => {
            setNational(e.target.value);
            onChange(toE164(iso, e.target.value));
          }}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
        />
      </div>
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
