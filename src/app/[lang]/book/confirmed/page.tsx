import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/i18n/dictionaries";
import { ConfirmedView } from "@/components/booking/ConfirmedView";
import { FlowSkeleton } from "@/components/booking/bits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("booking");
  return { title: t("meta.confirmed"), description: t("meta.description"), robots: { index: false, follow: false } };
}

// Client-rendered step: reads ?car= / ?ref= and the browser-stored trip draft.
export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <ConfirmedView />
    </Suspense>
  );
}
