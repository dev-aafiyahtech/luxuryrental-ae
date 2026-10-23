"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui";

// Contact form for the demo. It validates, shows a busy state, then confirms. Nothing is
// sent or stored: on the live site this posts to an API route that emails the ops inbox.

type Field = "name" | "mobile" | "message";
type Errors = Partial<Record<Field, string>>;

const SEND_MS = 1100;

function validate(v: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (v.name.trim().length < 2) errors.name = "Enter your name.";
  const digits = v.mobile.replace(/[\s()-]/g, "");
  if (!digits) errors.mobile = "Enter your mobile number.";
  else if (!/^\+?\d{8,15}$/.test(digits)) errors.mobile = "Enter a mobile number with its country code, for example +971 50 123 4567.";
  if (v.message.trim().length < 10) errors.message = "Tell us a little more, at least 10 characters.";
  return errors;
}

export function ContactForm() {
  const id = useId();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", mobile: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const refs = { name: useRef<HTMLInputElement>(null), mobile: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) };
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
    const next = validate(values);
    setErrors(next);
    const first = (["name", "mobile", "message"] as Field[]).find((f) => next[f]);
    if (first) {
      refs[first].current?.focus();
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
          <p className="text-lg font-semibold">Message sent (demo)</p>
          <p className="text-[15px] leading-relaxed text-champagne">On the live site this emails our team, and we reply on WhatsApp or by phone. In this demo nothing was sent or stored.</p>
        </div>
        <div>
          <Button variant="secondary" size="sm" onClick={() => setSent(false)}>Send another message</Button>
        </div>
      </div>
    );
  }

  const describedBy = (field: Field, hint?: boolean) => [hint ? `${id}-${field}-hint` : "", errors[field] ? `${id}-${field}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby={`${id}-title`} className="grid gap-5 rounded-[var(--radius-card)] border border-line bg-card p-6 md:p-8">
      <div className="grid gap-1">
        <h2 id={`${id}-title`} className="text-lg font-semibold">Send us a message</h2>
        <p className="text-sm text-muted">We reply on WhatsApp or by phone. All fields are required.</p>
      </div>

      <div className="field">
        <label htmlFor={`${id}-name`}>Name</label>
        <input ref={refs.name} id={`${id}-name`} name="name" className="input" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name || undefined} aria-describedby={describedBy("name")} />
        {errors.name && <p id={`${id}-name-error`} className="field-error">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-mobile`}>Mobile or WhatsApp</label>
        <input ref={refs.mobile} id={`${id}-mobile`} name="mobile" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="+971 50 123 4567" value={values.mobile} onChange={set("mobile")} aria-invalid={!!errors.mobile || undefined} aria-describedby={describedBy("mobile", true)} />
        <p id={`${id}-mobile-hint`} className="field-hint">With the country code.</p>
        {errors.mobile && <p id={`${id}-mobile-error`} className="field-error">{errors.mobile}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-message`}>Message</label>
        <textarea ref={refs.message} id={`${id}-message`} name="message" rows={5} className="input" value={values.message} onChange={set("message")} aria-invalid={!!errors.message || undefined} aria-describedby={describedBy("message", true)} />
        <p id={`${id}-message-hint`} className="field-hint">The car and dates help us answer faster. Please don&apos;t include card details.</p>
        {errors.message && <p id={`${id}-message-error`} className="field-error">{errors.message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" busy={busy}>{busy ? "Sending…" : "Send message"}</Button>
        <p className="fine">Demo: nothing is sent or stored.</p>
      </div>
      <p className="sr-only" aria-live="polite">{busy ? "Sending your message" : ""}</p>
    </form>
  );
}
