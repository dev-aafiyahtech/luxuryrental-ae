"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { useT } from "@/i18n/client";
import { deleteAccount, signOut, type CustomerProfile } from "@/lib/customer/store";
import { BottomSheet } from "@/components/booking/BottomSheet";
import { formatPhone } from "@/components/booking/lib";
import { Notice } from "@/components/ui";
import { DocumentsPanel } from "./DocumentsPanel";
import { ProfileForm } from "./ProfileForm";
import { RequestsList } from "./RequestsList";
import { firstName } from "./format";

/** Signed-in view: requests, documents, profile, sign out and delete. */
export function AccountHome({ profile, notice, focusHeading, onSignedOut, onDeleted }: {
  profile: CustomerProfile;
  notice?: string;
  focusHeading?: boolean;
  onSignedOut: () => void;
  onDeleted: () => void;
}) {
  const t = useT("account");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (focusHeading) headingRef.current?.focus();
  }, [focusHeading]);

  const name = firstName(profile.name);
  const contact = profile.phone ? formatPhone(profile.phone) : profile.email ?? "";
  const links = [
    { id: "requests", label: t("requests.title") },
    { id: "documents", label: t("docs.title.customer") },
    { id: "profile", label: t("profile.title") },
  ];

  const remove = async () => {
    setDeleting(true);
    setError("");
    try {
      await deleteAccount();
      onDeleted();
    } catch {
      setError(t("errors.failed"));
      setDeleting(false);
    }
  };

  return (
    <div className="container-site grid gap-10 pb-24 pt-10 md:pt-14">
      <header className="grid gap-4">
        <p className="label">
          {t("home.signedInAs")}{" "}
          <bdi dir="ltr" className="normal-case tracking-normal text-fg">
            {contact}
          </bdi>
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="display-md outline-none">
          {name ? t("home.greeting", { name }) : t("home.title")}
        </h1>
        <p className="lede">{t("home.lede")}</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              signOut();
              onSignedOut();
            }}
          >
            <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
            {t("home.signOut")}
          </button>
        </div>
        {notice && <Notice tone="success">{notice}</Notice>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <nav aria-label={t("home.onThisPage")} className="hidden lg:block">
          <ul className="sticky top-[calc(var(--header-h)+24px)] m-0 grid list-none gap-1 border-s border-line p-0">
            {links.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="-ms-px flex min-h-11 items-center border-s-2 border-transparent ps-4 text-sm font-semibold text-muted no-underline transition-colors hover:border-accent hover:text-fg">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid min-w-0 gap-16">
          <RequestsList profile={profile} />

          <div id="documents" className="min-w-0">
            {profile.phone ? (
              <DocumentsPanel phone={profile.phone} driver={{ resident: profile.resident, licenceCountry: profile.licenceCountry }} headingLevel="h2" />
            ) : (
              <section aria-labelledby="documents-h" className="grid justify-items-start gap-4">
                <h2 id="documents-h" className="display-sm">
                  {t("docs.title.customer")}
                </h2>
                <Notice tone="warning" className="w-full">
                  {t("profile.needPhone")}
                </Notice>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => document.getElementById("profile-phone")?.focus()}>
                  {t("profile.addPhone")}
                </button>
              </section>
            )}
          </div>

          <ProfileForm key={profile.createdAt} profile={profile} />

          <section aria-labelledby="delete-h" className="grid justify-items-start gap-3 border-t border-line pt-8">
            <h2 id="delete-h" className="text-[15px] font-semibold">
              {t("delete.title")}
            </h2>
            <p className="max-w-[62ch] text-sm text-muted">{t("delete.text")}</p>
            <button type="button" className="btn btn-secondary btn-sm border-danger/60 text-danger hover:border-danger" aria-haspopup="dialog" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t("delete.button")}
            </button>
          </section>
        </div>
      </div>

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("delete.confirmTitle")}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>
              {t("delete.keep")}
            </button>
            <button type="button" className="btn btn-secondary btn-sm border-danger/60 text-danger hover:border-danger" onClick={() => void remove()} aria-busy={deleting || undefined}>
              {deleting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" aria-hidden="true" />}
              {t("delete.confirm")}
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <p className="text-champagne">{t("delete.confirmText")}</p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
