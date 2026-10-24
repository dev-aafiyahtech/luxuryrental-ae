import Link from "next/link";
import { getHref, getT } from "@/i18n/dictionaries";
import { site } from "@/content/site";

// Shown on every page while the site is a simulation (site.demo).
export async function DemoBar() {
  if (!site.demo) return null;
  const t = await getT("common");
  const href = await getHref();
  return (
    <div className="relative z-[calc(var(--z-header)+1)] print:hidden border-b border-accent/30 bg-card text-[12px] leading-snug text-champagne">
      <div className="container-site flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
        <p><span className="badge me-2 align-middle">Demo</span>{t("demo.bar")}</p>
        <Link href={href("/demo/ops")} className="font-semibold text-accent-hover">{t("demo.ops")} →</Link>
      </div>
    </div>
  );
}
