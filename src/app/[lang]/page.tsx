import { cars } from "@/content/cars";
import { getHref } from "@/i18n/dictionaries";
import { getToday } from "@/lib/server-time";
import { CarCard } from "@/components/car/CarCard";
import { PageHeader } from "@/components/ui";

// TEMPORARY homepage: replaced by the cinematic four-chapter homepage.
export default async function Home() {
  const href = await getHref();
  const today = await getToday();
  return (
    <div className="container-site pb-24">
      <PageHeader eyebrow="Foundation check" title="Dubai after dark" lede="Temporary page while the homepage is built." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => <CarCard key={car.slug} car={car} today={today} href={href} />)}
      </div>
    </div>
  );
}
