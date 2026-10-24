import { Suspense } from "react";
import type { Metadata } from "next";
import { getT } from "@/i18n/dictionaries";
import { AgreementView } from "@/components/agreement/AgreementView";
import { FlowSkeleton } from "@/components/booking/bits";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("agreement");
  return { title: t("meta.title"), description: t("meta.description"), robots: { index: false, follow: false } };
}

// Client-rendered: reads ?ref= and the booking stored in this browser (demo backend).
export default function Page() {
  return (
    <Suspense fallback={<FlowSkeleton />}>
      <AgreementView />
    </Suspense>
  );
}
