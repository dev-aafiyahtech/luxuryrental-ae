import type { Metadata } from "next";
import { getCar } from "@/content/cars";
import { ReserveCard } from "@/components/booking/ReserveCard";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Booking widgets", robots: { index: false, follow: false } };

// QA gallery for the booking widgets: reserve cards for a standard car, a Bugatti (request,
// "from" price) and the chauffeur-first Phantom, in narrow grid columns with no outside fixes.
export default function WidgetsPage() {
  const slugs = ["lamborghini-revuelto", "bugatti-chiron-sport", "rolls-royce-phantom"];
  return (
    <div className="container-site pb-24">
      <PageHeader eyebrow="Team desk" title="Booking widgets" lede="Reserve cards as other pages embed them. Changes here update the shared trip draft." />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {slugs.map((slug) => {
          const car = getCar(slug);
          return car ? <ReserveCard key={slug} car={car} /> : null;
        })}
      </div>
    </div>
  );
}
