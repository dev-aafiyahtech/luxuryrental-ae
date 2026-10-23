import Link from "next/link";
import clsx from "clsx";
import type { Car } from "@/content/types";
import { getBrand, getCategory } from "@/content/brands";
import { carPath } from "@/content/cars";
import { CarArt } from "./CarArt";
import { PriceFrom, headlineSpecs } from "./CarBits";

/** Fleet card: image, name, headline specs, "from" price, details and Reserve links. */
export function CarCard({ car, today, href, className, headingLevel = "h3" }: { car: Car; today: string; href: (path: string) => string; className?: string; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  const category = car.category === "chauffeur" ? "Chauffeur" : getCategory(car.category)?.singular;
  const badge = car.heroRank ? "Featured" : undefined;
  return (
    <article className={clsx("card card-hover group relative grid overflow-hidden", className)} data-car={car.slug} data-brand={car.brand} data-category={[car.category, ...car.tags].join(" ")}>
      <div className="relative">
        <CarArt car={car} view="card" className="aspect-[4/3] w-full" />
        {badge && <span className="badge absolute start-3 top-3">{badge}</span>}
      </div>
      <div className="grid gap-3 p-5">
        <div className="grid gap-1">
          <p className="label">{getBrand(car.brand)?.name} · {category}</p>
          <Heading className="display-sm">
            <Link href={href(carPath(car))} className="no-underline after:absolute after:inset-0 after:content-['']">
              {car.model}
            </Link>
          </Heading>
        </div>
        <p className="text-sm text-muted">{headlineSpecs(car).join(" · ")}</p>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <PriceFrom car={car} today={today} />
          <Link href={href(`/book/trip?car=${car.slug}`)} className="btn btn-secondary btn-sm relative z-[1]">
            {car.rates.onRequest ? "Request" : "Reserve"}
          </Link>
        </div>
      </div>
    </article>
  );
}
