"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/i18n/client";
import { updateDraft } from "@/lib/booking/draft";
import type { DriverDetails } from "@/lib/booking/types";
import { updateProfile, useDocuments, type CustomerProfile } from "@/lib/customer/store";
import { Field, describedBy } from "@/components/booking/Field";
import { PhoneInput } from "@/components/booking/PhoneInput";
import { Segmented } from "@/components/booking/Segmented";
import { countries, emailOk, needsIdp, phoneError } from "@/components/booking/lib";
import { Notice } from "@/components/ui";

type T = (key: string, vars?: Record<string, string | number>) => string;

interface Values {
  name: string;
  phone: string;
  email: string;
  licenceCountry: string;
  resident: boolean;
  ageBand: DriverDetails["ageBand"];
}

const ORDER = ["profile-name", "profile-phone", "profile-email", "profile-licence"] as const;
type FieldId = (typeof ORDER)[number];

/** Same checks as the booking form's driver step (age is advice here: chauffeur rentals have no age limit). */
function profileErrors(v: Values, t: T): Partial<Record<FieldId, string>> {
  const e: Partial<Record<FieldId, string>> = {};
  if (v.name.trim().length < 2) e["profile-name"] = t("errors.name");
  const phone = phoneError(v.phone);
  if (phone) e["profile-phone"] = t(`errors.phone.${phone}`);
  if (!emailOk(v.email)) e["profile-email"] = t("errors.emailInvalid");
  if (v.resident && v.licenceCountry !== "AE") e["profile-licence"] = t("errors.residentLicence");
  return e;
}

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const t = useT("account");
  const docs = useDocuments(profile.phone || undefined);
  const [v, setV] = useState<Values>(() => ({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    licenceCountry: profile.licenceCountry || "AE",
    resident: !!profile.resident,
    ageBand: profile.ageBand ?? "30+",
  }));
  const [touched, setTouched] = useState<FieldId[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [failed, setFailed] = useState("");

  const errors = profileErrors(v, t);
  // The licence rule shows as soon as it's chosen (like the booking form); the rest on blur or save.
  const err = (id: FieldId) => (submitted || touched.includes(id) || id === "profile-licence" ? errors[id] : undefined);
  const set = (patch: Partial<Values>) => {
    setV((cur) => ({ ...cur, ...patch }));
    setSaved("");
    setFailed("");
  };
  const touch = (id: FieldId) => setTouched((s) => (s.includes(id) ? s : [...s, id]));

  const phoneMoves = !!profile.phone && v.phone !== profile.phone && docs.length > 0;
  const licenceHint = !v.resident && needsIdp(v.licenceCountry) ? t("profile.idp") : undefined;
  const nameError = err("profile-name");
  const emailError = err("profile-email");
  const licenceError = err("profile-licence");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = ORDER.find((id) => errors[id]);
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    setBusy(true);
    setFailed("");
    try {
      const driver = { name: v.name.trim(), phone: v.phone, email: v.email.trim() || undefined, licenceCountry: v.licenceCountry, resident: v.resident, ageBand: v.ageBand };
      await updateProfile(driver);
      updateDraft({ driver }); // the booking form pre-fills from these details
      setSaved(t("profile.saved"));
    } catch {
      setFailed(t("errors.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="profile" aria-labelledby="profile-h" className="grid content-start gap-5">
      <header className="grid gap-2">
        <h2 id="profile-h" className="display-sm">
          {t("profile.title")}
        </h2>
        <p className="text-sm text-champagne">{t("profile.intro")}</p>
      </header>
      <form noValidate onSubmit={onSubmit} className="card grid gap-6 p-5 sm:p-6">
        <Field id="profile-name" label={t("profile.name")} hint={t("profile.nameHint")} error={nameError}>
          <input
            id="profile-name"
            className="input"
            autoComplete="name"
            value={v.name}
            onChange={(e) => set({ name: e.target.value })}
            onBlur={() => touch("profile-name")}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={describedBy("profile-name", true, nameError)}
            aria-required="true"
          />
        </Field>

        <div className="grid gap-3">
          <PhoneInput id="profile-phone" label={t("profile.phone")} value={v.phone} onChange={(phone) => set({ phone })} onBlur={() => touch("profile-phone")} error={err("profile-phone")} hint={t("profile.phoneHint")} />
          {phoneMoves && <Notice tone="info">{t("profile.phoneMoves")}</Notice>}
        </div>

        <Field id="profile-email" label={t("profile.email")} optional error={emailError}>
          <input
            id="profile-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            className="input"
            value={v.email}
            onChange={(e) => set({ email: e.target.value })}
            onBlur={() => touch("profile-email")}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={describedBy("profile-email", undefined, emailError)}
          />
        </Field>

        <Segmented
          legend={t("profile.resident")}
          value={v.resident ? "yes" : "no"}
          options={[
            { value: "no", label: t("profile.residentNo") },
            { value: "yes", label: t("profile.residentYes") },
          ]}
          onChange={(r) => set({ resident: r === "yes" })}
        />

        <Field id="profile-licence" label={t("profile.licence")} hint={licenceHint} error={licenceError}>
          <select
            id="profile-licence"
            className="input"
            value={v.licenceCountry}
            onChange={(e) => set({ licenceCountry: e.target.value })}
            aria-invalid={licenceError ? true : undefined}
            aria-describedby={describedBy("profile-licence", licenceHint, licenceError)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-2">
          <Segmented<DriverDetails["ageBand"]>
            legend={t("profile.age")}
            value={v.ageBand}
            options={[
              { value: "under-25", label: t("profile.ageUnder25") },
              { value: "25-29", label: t("profile.age25") },
              { value: "30+", label: t("profile.age30") },
            ]}
            onChange={(ageBand) => set({ ageBand })}
          />
          {v.ageBand === "under-25" && <p className="field-hint">{t("profile.under25")}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5">
          <button type="submit" className="btn btn-primary w-full sm:w-fit" aria-busy={busy || undefined}>
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
            {t("profile.save")}
          </button>
          <p role="status" className="min-w-0 flex-1 basis-60 text-sm text-success">
            {saved}
          </p>
        </div>
        {failed && (
          <p role="alert" className="field-error">
            {failed}
          </p>
        )}
      </form>
    </section>
  );
}
