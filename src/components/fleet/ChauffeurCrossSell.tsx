import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { chauffeurCars, getCar } from "@/content/cars";
import { rules } from "@/content/rules";
import { formatAED } from "@/lib/format";
import { CarArt } from "@/components/car/CarArt";

/** Cross-sell card for the chauffeur service, shown inside the fleet grid. */
export function ChauffeurCrossSell({ href, t, headingLevel = "h2" }: { href: (path: string) => string; t: (key: string, vars?: Record<string, string | number>) => string; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const phantom = getCar("rolls-royce-phantom");
  const minHourly = Math.min(...chauffeurCars().map((c) => c.chauffeur!.hourly));
  return (
    <article className="card card-hover group relative grid content-between overflow-hidden border-accent/40 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(235,218,176,0.16),transparent_60%)]">
      {phantom && <CarArt car={phantom} view="side" className="aspect-[4/3] w-full opacity-90" />}
      <div className="grid gap-3 p-5">
        <p className="eyebrow"><span className="num">VIP</span>{t("crossSell.eyebrow")}</p>
        <Heading className="display-sm">
          <Link href={href("/chauffeur")} className="no-underline after:absolute after:inset-0 after:content-['']">{t("crossSell.title")}</Link>
        </Heading>
        <p className="text-sm text-muted">{t("crossSell.body")}</p>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm font-semibold tabular">{t("crossSell.price", { price: formatAED(minHourly), hours: rules.chauffeur.minHours })}</p>
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent-hover" aria-hidden="true">
            {t("crossSell.cta")}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </span>
        </div>
      </div>
    </article>
  );
}
