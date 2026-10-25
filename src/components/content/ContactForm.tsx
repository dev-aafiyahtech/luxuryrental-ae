"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useLocale } from "@/i18n/client";
import { contentUiFor, type ContentUi } from "@/content/pages/ui";

// Contact form for the demo. It validates, shows a busy state, then confirms. Nothing is
// sent or stored: on the live site this posts to an API route that emails the ops inbox.
// Labels come from content/pages/ui.ts in the visitor's language.

type Field = "name" | "mobile" | "message";
type Errors = Partial<Record<Field, string>>;

const SEND_MS = 1100;

function validate(v: Record<Field, string>, t: ContentUi["contactForm"]): Errors {
  const errors: Errors = {};
  if (v.name.trim().length < 2) errors.name = t.errName;
  const digits = v.mobile.replace(/[\s()-]/g, "");
  if (!digits) errors.mobile = t.errMobile;
  else if (!/^\+?\d{8,15}$/.test(digits)) errors.mobile = t.errMobileFormat;
  if (v.message.trim().length < 10) errors.message = t.errMessage;
  return errors;
}

export function ContactForm() {
  const t = contentUiFor(useLocale()).contactForm;
  const id = useId();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", mobile: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Clear the pending "send" if the page unmounts or is hidden by <Activity>.
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (sent) statusRef.current?.focus();
  }, [sent]);

  const set = (field: Field) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next = validate(values, t);
    setErrors(next);
    const first = (["name", "mobile", "message"] as Field[]).find((f) => next[f]);
    if (first) {
      const target = first === "name" ? nameRef.current : first === "mobile" ? mobileRef.current : messageRef.current;
      target?.focus();
      return;
    }
    setBusy(true);
    timer.current = window.setTimeout(() => {
      setBusy(false);
      setSent(true);
      setValues({ name: "", mobile: "", message: "" });
    }, SEND_MS);
  }

  if (sent) {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="grid gap-5 rounded-[var(--radius-card)] border border-success/50 bg-card p-6 outline-none md:p-8">
        <CircleCheck className="h-8 w-8 text-success" aria-hidden="true" />
        <div className="grid gap-2">
          <p className="text-lg font-semibold">{t.sentTitle}</p>
          <p className="text-[15px] leading-relaxed text-champagne">{t.sentText}</p>
        </div>
        <div>
          <Button variant="secondary" size="sm" onClick={() => setSent(false)}>{t.again}</Button>
        </div>
      </div>
    );
  }

  const describedBy = (field: Field, hint?: boolean) => [hint ? `${id}-${field}-hint` : "", errors[field] ? `${id}-${field}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`} className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-card p-6 md:p-8">
      <div className="grid gap-1">
        <h2 id={`${id}-title`} className="text-lg font-semibold">{t.title}</h2>
        <p className="text-sm text-muted">{t.intro}</p>
      </div>

      <div className="field">
        <label htmlFor={`${id}-name`}>{t.name}</label>
        <input ref={nameRef} id={`${id}-name`} name="name" className="input" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name || undefined} aria-describedby={describedBy("name")} />
        {errors.name && <p id={`${id}-name-error`} className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-mobile`}>{t.mobile}</label>
        <input ref={mobileRef} id={`${id}-mobile`} name="mobile" type="tel" inputMode="tel" dir="ltr" className="input rtl:text-end" autoComplete="tel" placeholder="+971 50 123 4567" value={values.mobile} onChange={set("mobile")} aria-invalid={!!errors.mobile || undefined} aria-describedby={describedBy("mobile", true)} />
        <p id={`${id}-mobile-hint`} className="field-hint">{t.mobileHint}</p>
        {errors.mobile && <p id={`${id}-mobile-error`} className="field-error">{errors.mobile}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-message`}>{t.message}</label>
        <textarea ref={messageRef} id={`${id}-message`} name="message" rows={5} className="input" value={values.message} onChange={set("message")} aria-invalid={!!errors.message || undefined} aria-describedby={describedBy("message", true)} />
        <p id={`${id}-message-hint`} className="field-hint">{t.messageHint}</p>
        {errors.message && <p id={`${id}-message-error`} className="field-error">{errors.message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" busy={busy}>{busy ? t.sending : t.send}</Button>
        <p className="fine">{t.demo}</p>
      </div>
      <p className="sr-only" aria-live="polite">{busy ? t.sendingStatus : ""}</p>
    </form>
  );
}
