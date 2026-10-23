import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import type { Car } from "@/content/types";
import { carPath } from "@/content/cars";
import { getBrand } from "@/content/brands";
import { rules } from "@/content/rules";
import { formatAED } from "@/lib/format";
import { CarArt } from "@/components/car/CarArt";

/** Chauffeur car card: image, name, seats, hourly "from" rate and the chauffeur request link. */
export function ChauffeurCarCard({ car, href }: { car: Car; href: (path: string) => string }) {
  const rates = car.chauffeur!;
  return (
    <article className="card card-hover group relative grid content-start overflow-hidden">
      <div className="relative">
        <CarArt car={car} view="card" className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        {car.chauffeurFirst && <span className="badge absolute start-3 top-3">Chauffeur first</span>}
      </div>
      <div className="grid gap-4 p-5 md:p-6">
        <div className="grid gap-1">
          <p className="label">{getBrand(car.brand)?.name}</p>
          <h3 className="display-sm">{car.model}</h3>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Users className="h-4 w-4 flex-none text-accent" aria-hidden="true" />
          {car.specs.seats} seats · {car.specs.body}
        </p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm tabular">
          <div className="grid gap-1 bg-card p-3">
            <dt className="label">Per hour</dt>
            <dd className="font-semibold">{formatAED(rates.hourly)}</dd>
          </div>
          <div className="grid gap-1 bg-card p-3">
            <dt className="label">Full day</dt>
            <dd className="font-semibold">{formatAED(rates.fullDay)}</dd>
          </div>
        </dl>
        <p className="fine">{rules.chauffeur.minHours}-hour minimum. Prices include VAT.</p>
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
          <Link href={href(`/book/trip?car=${car.slug}&service=chauffeur`)} className="btn btn-primary btn-sm">
            Request a chauffeur
          </Link>
          <Link href={href(carPath(car))} className="inline-flex min-h-11 items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted no-underline transition-colors hover:text-fg">
            Car details <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
