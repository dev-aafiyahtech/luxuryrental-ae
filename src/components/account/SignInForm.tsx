"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileCheck2, ListChecks, Mail, PenLine } from "lucide-react";
import { useT } from "@/i18n/client";
import { useTripDraft } from "@/lib/booking/draft";
import { requestSignInCode, verifySignInCode } from "@/lib/customer/store";
import { Field, describedBy } from "@/components/booking/Field";
import { PhoneInput } from "@/components/booking/PhoneInput";
import { Segmented } from "@/components/booking/Segmented";
import { rich } from "@/components/booking/bits";
import { emailOk, formatPhone, phoneError } from "@/components/booking/lib";
import { Notice } from "@/components/ui";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

type Method = "phone" | "email";
type Sent = Awaited<ReturnType<typeof requestSignInCode>>;

const Spinner = () => <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />;

/** Signed-out view: contact → one-time code → signed in (first sign-in pre-fills from the trip draft). */
export function SignInForm({ notice, focusHeading, onSignedIn }: { notice?: string; focusHeading?: boolean; onSignedIn: () => void }) {
  const t = useT("account");
  const [trip] = useTripDraft();
  const driver = trip.driver;
  const [method, setMethod] = useState<Method>(driver.channel === "email" && driver.email ? "email" : "phone");
  const [phone, setPhone] = useState(driver.phone ?? "");
  const [email, setEmail] = useState(driver.email ?? "");
  const [contactError, setContactError] = useState("");
  const [sent, setSent] = useState<Sent | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [busy, setBusy] = useState<"send" | "verify" | "resend" | null>(null);
  const [status, setStatus] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  // Field to focus after the next render (set when the step changes, never on first load).
  const focusNext = useRef<string | null>(null);
  const step = sent ? "code" : "contact";
  const contactId = method === "phone" ? "signin-phone" : "signin-email";

  useEffect(() => {
    if (focusHeading) headingRef.current?.focus();
  }, [focusHeading]);

  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    focusNext.current = null;
    document.getElementById(id)?.focus();
  });

  const contactProblem = (): string => {
    if (method === "phone") {
      const p = phoneError(phone);
      return p ? t(`errors.phone.${p}`) : "";
    }
    if (!email.trim()) return t("errors.emailRequired");
    return emailOk(email) ? "" : t("errors.emailInvalid");
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const problem = contactProblem();
    setContactError(problem);
    if (problem) {
      document.getElementById(contactId)?.focus();
      return;
    }
    setBusy("send");
    try {
      const r = await requestSignInCode(method === "phone" ? phone : email.trim());
      focusNext.current = "signin-code";
      setCode("");
      setCodeError("");
      setStatus("");
      setSent(r);
    } catch {
      setContactError(t("errors.failed"));
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    if (!sent || busy) return;
    setBusy("resend");
    try {
      const r = await requestSignInCode(sent.sentTo);
      setSent(r);
      setCode("");
      setCodeError("");
      setStatus(t("code.resent"));
    } catch {
      setCodeError(t("errors.failed"));
    } finally {
      setBusy(null);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!sent || busy) return;
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setCodeError(t("code.errors.format"));
      codeRef.current?.focus();
      return;
    }
    setBusy("verify");
    setStatus("");
    try {
      // A first sign-in creates the profile from the driver details already typed into the booking form.
      await verifySignInCode(sent.sentTo, digits, driver);
      onSignedIn();
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      setCodeError(m === "wrong" ? t("code.errors.wrong") : m === "expired" ? t("code.errors.expired") : t("errors.failed"));
      codeRef.current?.focus();
      setBusy(null);
    }
  };

  const change = () => {
    focusNext.current = contactId;
    setSent(null);
    setCode("");
    setCodeError("");
    setStatus("");
  };

  const contactLabel = sent ? (sent.channel === "email" ? sent.sentTo : formatPhone(sent.sentTo)) : "";
  const codeHint = t("code.hint");

  return (
    <div className="container-narrow grid gap-8 pb-24 pt-10 md:pt-14">
      <header className="grid gap-3">
        <h1 ref={headingRef} tabIndex={-1} className="display-md outline-none">
          {t("signIn.title")}
        </h1>
        <p className="lede">{t("signIn.lede")}</p>
      </header>

      {notice && <Notice tone="success">{notice}</Notice>}

      <section aria-labelledby="signin-h" className="card grid gap-5 p-5 sm:p-6">
        {step === "contact" ? (
          <>
            <div className="grid gap-1.5">
              <h2 id="signin-h" className="text-lg font-semibold leading-snug">
                {t("signIn.formTitle")}
              </h2>
              <p className="text-sm text-muted">{t("signIn.formText")}</p>
            </div>
            <form noValidate onSubmit={send} className="grid gap-5">
              <Segmented<Method>
                legend={t("signIn.method")}
                value={method}
                options={[
                  { value: "phone", label: t("signIn.methodPhone") },
                  { value: "email", label: t("signIn.methodEmail") },
                ]}
                onChange={(v) => {
                  setMethod(v);
                  setContactError("");
                }}
              />
              {method === "phone" ? (
                <PhoneInput id="signin-phone" label={t("signIn.phone")} value={phone} onChange={setPhone} error={contactError || undefined} hint={t("signIn.phoneHint")} />
              ) : (
                <Field id="signin-email" label={t("signIn.email")} hint={t("signIn.emailHint")} error={contactError}>
                  <input
                    id="signin-email"
                    type="email"
                    dir="ltr"
                    inputMode="email"
                    autoComplete="email"
                    spellCheck={false}
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={contactError ? true : undefined}
                    aria-describedby={describedBy("signin-email", true, contactError)}
                  />
                </Field>
              )}
              <button type="submit" className="btn btn-primary w-full sm:w-fit" aria-busy={busy === "send" || undefined}>
                {busy === "send" && <Spinner />}
                {t("signIn.send")}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="grid gap-1.5">
              <h2 id="signin-h" className="text-lg font-semibold leading-snug">
                {t("code.title")}
              </h2>
              <p className="text-sm text-muted">
                {rich(t("code.text"), {
                  contact: (
                    <bdi dir="ltr" className="font-semibold text-fg">
                      {contactLabel}
                    </bdi>
                  ),
                })}
              </p>
            </div>
            {/* The code arrives as a message; until messaging is connected it is shown here, styled
                as the incoming WhatsApp or email notification. */}
            <div id="signin-demo-code" role="status" className="flex items-start gap-3 rounded-2xl border border-line bg-bg/50 p-4">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-line text-fg" aria-hidden="true">
                {sent?.channel === "email" ? <Mail className="h-4 w-4" /> : <WhatsAppIcon className="h-4 w-4" />}
              </span>
              <div className="grid gap-0.5 text-sm leading-snug">
                <p className="font-semibold text-fg">{t("code.from")}</p>
                <p className="text-champagne">
                  {rich(t("code.message"), {
                    code: (
                      <strong dir="ltr" className="tabular tracking-[0.12em] text-fg">
                        {sent?.demoCode}
                      </strong>
                    ),
                  })}
                </p>
              </div>
            </div>
            <form noValidate onSubmit={verify} className="grid gap-5">
              <Field id="signin-code" label={t("code.label")} hint={codeHint} error={codeError}>
                <input
                  ref={codeRef}
                  id="signin-code"
                  className="input max-w-[14rem] text-center text-xl font-semibold tabular tracking-[0.3em]"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  dir="ltr"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setCodeError("");
                  }}
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={["signin-demo-code", describedBy("signin-code", codeHint, codeError)].filter(Boolean).join(" ")}
                />
              </Field>
              <button type="submit" className="btn btn-primary w-full sm:w-fit" aria-busy={busy === "verify" || undefined}>
                {busy === "verify" && <Spinner />}
                {t("code.verify")}
              </button>
            </form>
            <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3">
              <button type="button" onClick={() => void resend()} aria-busy={busy === "resend" || undefined} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fg underline decoration-accent/60 underline-offset-4 hover:decoration-accent">
                {busy === "resend" && <Spinner />}
                {t("code.resend")}
              </button>
              <button type="button" onClick={change} className="inline-flex min-h-11 items-center text-sm font-semibold text-fg underline decoration-accent/60 underline-offset-4 hover:decoration-accent">
                {sent?.channel === "email" ? t("code.changeEmail") : t("code.changePhone")}
              </button>
            </div>
          </>
        )}
        <p role="status" className={clsx("text-sm text-success", !status && "sr-only")}>
          {status}
        </p>
      </section>

      <section aria-labelledby="benefits-h" className="grid gap-4">
        <h2 id="benefits-h" className="label">
          {t("signIn.benefitsTitle")}
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {[
            { icon: ListChecks, text: t("signIn.benefits.requests") },
            { icon: FileCheck2, text: t("signIn.benefits.documents") },
            { icon: PenLine, text: t("signIn.benefits.agreements") },
          ].map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm leading-snug text-champagne">
              <Icon className="mt-0.5 h-5 w-5 flex-none text-accent" aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
