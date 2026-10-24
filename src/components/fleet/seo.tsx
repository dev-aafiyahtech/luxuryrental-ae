import type { Car } from "@/content/types";
import { getBrand } from "@/content/brands";
import { site } from "@/content/site";

// Structured data for the fleet pages (workstream 07 §7.3). Every value matches the visible text.

export const BUSINESS_ID = `${site.url}/#business`;

/** Absolute URL on the canonical host for a (locale-aware) path. */
export const absolute = (path: string) => `${site.url}${path === "/" ? "/" : path}`;

export function JsonLd({ data }: { data: object }) {
  // "<" is escaped so a value can never close the script element.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function breadcrumbLd(items: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.path ? { item: absolute(item.path) } : {}),
    })),
  };
}

/** "2" → 2, "4–5" → 5, "2+2" → 4. */
function seatCount(seats: string): number | undefined {
  const nums = (seats.match(/\d+/g) ?? []).map(Number);
  if (!nums.length) return undefined;
  return seats.includes("+") ? nums.reduce((a, b) => a + b, 0) : Math.max(...nums);
}

export function carLd(car: Car, opts: { path: string; price: number; description: string }) {
  const url = absolute(opts.path);
  const s = car.specs;
  return {
    "@type": "Car",
    "@id": `${url}#car`,
    name: car.name,
    url,
    description: opts.description,
    brand: { "@type": "Brand", name: getBrand(car.brand)?.name ?? car.brand },
    model: car.model,
    vehicleModelDate: car.year,
    color: car.paint.name,
    vehicleInteriorColor: car.details.interior,
    bodyType: s.body,
    vehicleSeatingCapacity: seatCount(s.seats),
    vehicleTransmission: "Automatic",
    fuelType: s.hybrid ? "Petrol plug-in hybrid" : "Petrol",
    driveWheelConfiguration: s.drivetrain === "AWD" ? "https://schema.org/AllWheelDriveConfiguration" : "https://schema.org/RearWheelDriveConfiguration",
    vehicleEngine: {
      "@type": "EngineSpecification",
      name: s.engine,
      enginePower: { "@type": "QuantitativeValue", value: s.hp, unitCode: "BHP" },
    },
    accelerationTime: { "@type": "QuantitativeValue", value: s.zeroTo100, unitCode: "SEC", description: "0-100 km/h" },
    speed: { "@type": "QuantitativeValue", maxValue: s.topSpeedKmh, unitCode: "KMH" },
    offers: {
      "@type": "Offer",
      url,
      businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
      price: opts.price,
      priceCurrency: "AED",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: opts.price,
        priceCurrency: "AED",
        unitCode: "DAY",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "DAY" },
        valueAddedTaxIncluded: true,
        ...(car.rates.onRequest ? { description: "Price on request; the daily rate shown is the starting price." } : {}),
      },
      availability: "https://schema.org/InStock",
      areaServed: { "@type": "City", name: "Dubai" },
      offeredBy: { "@id": BUSINESS_ID },
    },
  };
}

export const graph = (...nodes: object[]) => ({ "@context": "https://schema.org", "@graph": nodes });
