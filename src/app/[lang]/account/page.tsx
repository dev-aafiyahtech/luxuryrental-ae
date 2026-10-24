import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/i18n/dictionaries";
import { AccountView } from "@/components/account/AccountView";
import { FlowSkeleton } from "@/components/booking/bits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("account");
  return { title: t("meta.title"), description: t("meta.description"), robots: { index: false, follow: false } };
}

// Client-rendered: the simulated account and documents live in this browser's storage.
export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <AccountView />
    </Suspense>
  );
}
