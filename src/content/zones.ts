import type { DeliveryZone } from "./types";

// Delivery zones and fees (workstream 05, BR-10 to BR-18). Assumed for the demo; see docs/brief/assumptions.md.
export const zones: DeliveryZone[] = [
  { slug: "dso", name: "Dubai Silicon Oasis (our office)", kind: "branch", areas: ["Dubai Silicon Oasis"], fee: 0, note: "Collect and return at our office at no charge." },
  {
    slug: "dubai", name: "Anywhere in Dubai", kind: "zone", fee: 150, freeFromDays: 2,
    areas: ["Downtown Dubai", "Dubai Marina", "JBR", "Palm Jumeirah", "Business Bay", "DIFC", "Jumeirah", "Al Barsha", "Dubai Hills", "Arabian Ranches", "Deira", "Bur Dubai"],
    note: "Free for rentals of 2 days or more. Hatta is a separate zone.",
  },
  { slug: "dxb", name: "Dubai International Airport (DXB)", kind: "airport", areas: ["Terminal 1", "Terminal 2", "Terminal 3"], fee: 250, note: "Meet-and-greet at arrivals and airport parking included. We track your flight." },
  { slug: "dwc", name: "Al Maktoum International Airport (DWC)", kind: "airport", areas: ["Passenger terminal"], fee: 250, note: "Meet-and-greet at arrivals and airport parking included. We track your flight." },
  { slug: "hatta", name: "Hatta", kind: "zone", areas: ["Hatta"], fee: 500 },
  { slug: "sharjah-ajman", name: "Sharjah and Ajman", kind: "zone", areas: ["Sharjah", "Ajman"], fee: 300, chauffeurSurcharge: 500 },
  { slug: "abu-dhabi", name: "Abu Dhabi city, Yas and Saadiyat", kind: "zone", areas: ["Abu Dhabi city", "Yas Island", "Saadiyat Island"], fee: 600, chauffeurSurcharge: 800 },
  { slug: "other-emirates", name: "Al Ain, Ras Al Khaimah, Umm Al Quwain and Fujairah", kind: "zone", areas: ["Al Ain", "Ras Al Khaimah", "Umm Al Quwain", "Fujairah"], fee: 800, chauffeurSurcharge: 1200, note: "Booked at least 24 hours ahead." },
];

export const getZone = (slug: string) => zones.find((z) => z.slug === slug);
