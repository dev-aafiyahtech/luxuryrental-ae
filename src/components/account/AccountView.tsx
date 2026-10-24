"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { useAccount } from "@/lib/customer/store";
import { FlowSkeleton } from "@/components/booking/bits";
import { useHydrated } from "@/components/booking/hooks";
import { AccountHome } from "./AccountHome";
import { SignInForm } from "./SignInForm";

type Flash = "signedIn" | "signedOut" | "deleted" | null;

/** /account: sign-in (one-time code) or the signed-in account. Simulated: everything stays in this browser. */
export function AccountView() {
  const t = useT("account");
  const hydrated = useHydrated();
  const { signedIn, profile } = useAccount();
  // Set by this tab's own sign-in, sign-out or delete: shows a notice and moves focus to the new heading.
  const [flash, setFlash] = useState<Flash>(null);
  const message = flash === "signedIn" ? t("home.welcome") : flash === "signedOut" ? t("signIn.signedOut") : flash === "deleted" ? t("signIn.deleted") : "";

  let view;
  if (!hydrated) view = <FlowSkeleton label={t("loading")} />;
  else if (signedIn && profile)
    view = <AccountHome profile={profile} notice={flash === "signedIn" ? message : undefined} focusHeading={flash !== null} onSignedOut={() => setFlash("signedOut")} onDeleted={() => setFlash("deleted")} />;
  else view = <SignInForm notice={flash === "signedOut" || flash === "deleted" ? message : undefined} focusHeading={flash !== null} onSignedIn={() => setFlash("signedIn")} />;

  return (
    <>
      {view}
      {/* Stays mounted while the views swap, so the change is announced. */}
      <p role="status" className="sr-only">
        {message}
      </p>
    </>
  );
}
