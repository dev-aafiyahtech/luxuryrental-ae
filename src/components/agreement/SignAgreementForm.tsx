"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useHref, useT } from "@/i18n/client";
import { signAgreement } from "@/lib/booking/store";
import type { BookingRecord } from "@/lib/booking/types";
import { formatAED } from "@/lib/format";
import { rich } from "@/components/booking/bits";
import { ErrorSummary, type FormError } from "@/components/booking/ErrorSummary";
import { Checkbox, Field, describedBy } from "@/components/booking/Field";
import { useErrors } from "@/components/booking/FlowShell";
import { SignaturePad } from "./SignaturePad";

/** Excess per claim that applies to a booking (Full Cover lowers it). */
export function excessFor(b: BookingRecord, tier: { excess: number; fullCoverExcess: number }) {
  return b.trip.service === "self-drive" && b.trip.extras.fullCover ? tier.fullCoverExcess : tier.excess;
}

/**
 * E-sign the rental agreement: typed full name, three required acknowledgements and a drawn
 * (or typed) signature → signAgreement(). Errors use the booking steps' summary pattern.
 */
export function SignAgreementForm({ b, excess, onSigned }: { b: BookingRecord; excess: number; onSigned: () => void }) {
  const t = useT("agreement");
  const href = useHref();
  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [deposit, setDeposit] = useState(false);
  const [damage, setDamage] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState("");
  const { touch, visible, check, submitted, summaryRef } = useErrors();
  const chauffeur = b.trip.service === "chauffeur";
  const fullCover = !chauffeur && b.trip.extras.fullCover;

  const errors: FormError[] = [];
  if (name.trim().length < 2) errors.push({ id: "sign-name", message: t("sign.errors.name") });
  if (!terms) errors.push({ id: "sign-terms", message: t("sign.errors.terms") });
  if (!deposit) errors.push({ id: "sign-deposit", message: t("sign.errors.deposit") });
  if (!damage) errors.push({ id: "sign-damage", message: t("sign.errors.damage") });
  if (!signature) errors.push({ id: "sign-signature", message: t("sign.errors.signature") });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !check(errors) || !signature) return;
    setBusy(true);
    setFailed("");
    try {
      await signAgreement(b.ref, { name: name.trim(), signature, accepted: { terms, deposit, damage } });
      onSigned();
    } catch (err) {
      setFailed(t("sign.errors.failed", { error: err instanceof Error ? err.message : String(err) }));
      setBusy(false);
    }
  };

  const nameError = visible(errors, "sign-name");
  const termsLink = (
    <Link href={href("/legal/terms-of-rental")} className="font-semibold text-fg underline decoration-accent/60 underline-offset-4 hover:decoration-accent">
      {t("doc.termsLink")}
    </Link>
  );

  return (
    <form noValidate onSubmit={submit} aria-describedby="sign-h" aria-label={t("sign.submit")} className="grid gap-6 print:hidden">
      <p id="sign-h" className="text-sm text-muted">{chauffeur ? t("sign.ledeChauffeur") : t("sign.lede")}</p>
      {submitted && errors.length > 0 && <ErrorSummary ref={summaryRef} errors={errors} title={t("sign.errorTitle")} />}
      <Field id="sign-name" label={t("sign.name")} hint={t("sign.nameHint")} error={nameError} className="max-w-[420px]">
        <input id="sign-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch("sign-name")} aria-invalid={nameError ? true : undefined} aria-describedby={describedBy("sign-name", t("sign.nameHint"), nameError)} aria-required="true" />
      </Field>
      <fieldset className="m-0 grid min-w-0 gap-1 border-0 p-0">
        <legend className="mb-1 p-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{t("sign.confirm")}</legend>
        <Checkbox id="sign-terms" checked={terms} onChange={setTerms} onBlur={() => touch("sign-terms")} error={visible(errors, "sign-terms")} required>
          {rich(t("sign.terms"), { terms: termsLink })}
        </Checkbox>
        <Checkbox id="sign-deposit" checked={deposit} onChange={setDeposit} onBlur={() => touch("sign-deposit")} error={visible(errors, "sign-deposit")} required>
          {b.quote.deposit > 0 ? t("sign.deposit", { amount: formatAED(b.quote.deposit) }) : t("sign.depositNone")}
        </Checkbox>
        <Checkbox id="sign-damage" checked={damage} onChange={setDamage} onBlur={() => touch("sign-damage")} error={visible(errors, "sign-damage")} required>
          {chauffeur ? t("sign.damageChauffeur") : t(fullCover ? "sign.damageFullCover" : "sign.damage", { amount: formatAED(excess) })}
        </Checkbox>
      </fieldset>
      <SignaturePad id="sign-signature" label={t("sign.signature")} name={name} onChange={setSignature} error={visible(errors, "sign-signature")} />
      {failed && <p role="alert" className="field-error">{failed}</p>}
      <div className="grid gap-3">
        <button type="submit" className="btn btn-primary w-full sm:w-fit" aria-busy={busy || undefined} aria-disabled={busy || undefined}>
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
          {busy ? t("sign.submitting") : t("sign.submit")}
        </button>
        <p className="fine">{t("sign.record")}</p>
      </div>
    </form>
  );
}
