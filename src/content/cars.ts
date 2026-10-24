import type { Car, Tier } from "./types";

// The 16-car fleet, top 5 and launch rates approved by Zubair on 23 Oct 2026
// (docs/brief/plan-answers.md). Rates are standard-season, AED incl. 5% VAT
// (docs/plan/workstreams/04-fleet-pricing.md §7); seasons are applied in lib/pricing.ts.
// Specs are typical published figures, to be verified before launch. Model year, paint,
// interior, wheels and equipment are assumed for the demo (docs/brief/assumptions.md)
// until the fleet sheet arrives.

const RULES: Record<Tier, { minAge: number; licenceYears: number; leadHours: number }> = {
  L: { minAge: 25, licenceYears: 2, leadHours: 4 },
  S: { minAge: 25, licenceYears: 3, leadHours: 4 },
  H: { minAge: 30, licenceYears: 5, leadHours: 72 },
};

const placeholder = { status: "placeholder" } as const;
const added = "2026-10-23";

export const cars: Car[] = [
  {
    slug: "lamborghini-revuelto", brand: "lamborghini", model: "Revuelto", modelSlug: "revuelto", name: "Lamborghini Revuelto", year: "2025",
    category: "supercars", tags: [], tier: "S", priceTier: "A", body: "supercar", paint: { name: "Arancio Apodis", hex: "#F06414" },
    heroRank: 1, heroScene: "skyline",
    tagline: "The V12 flagship, with scissor doors and 1,001 hp.",
    details: { interior: "Black leather and Alcantara, orange stitching", wheels: "21-inch front, 22-inch rear forged wheels, gloss black", equipment: ["Front-axle lift", "Carbon-ceramic brakes", "Passenger display", "Apple CarPlay"] },
    specs: { engine: "6.5 L V12 plug-in hybrid", engineLayout: "V12", hybrid: true, hp: 1001, ps: 1015, zeroTo100: 2.5, topSpeedKmh: 350, topSpeedNote: "over", seats: "2", body: "Coupé, scissor doors", drivetrain: "AWD" },
    rates: { daily: 7500, peakDaily: 8600, weekly: 45000, monthly: 150000, deposit: 10000, kmPerDay: 200, kmPerMonth: 3000, extraKm: 30 },
    minDays: 1, ...RULES.S, images: placeholder, addedAt: added,
  },
  {
    slug: "rolls-royce-cullinan", brand: "rolls-royce", model: "Cullinan Series II", modelSlug: "cullinan", name: "Rolls-Royce Cullinan Series II", year: "2025",
    category: "suvs", tags: [], tier: "L", priceTier: "A", body: "suv", paint: { name: "Diamond Black", hex: "#16161A" },
    heroRank: 2, heroScene: "skyline",
    tagline: "The lit grille that owns the night. Self-drive or with a chauffeur.",
    details: { interior: "Arctic White leather with black piping", wheels: "23-inch forged, polished", equipment: ["Starlight Headliner", "Illuminated fascia", "Rear entertainment screens", "Bespoke audio"] },
    specs: { engine: "6.75 L twin-turbo V12", engineLayout: "V12", hybrid: false, hp: 563, ps: 571, zeroTo100: 5.2, topSpeedKmh: 250, topSpeedNote: "limited", seats: "4–5", body: "SUV", drivetrain: "AWD" },
    rates: { daily: 5200, peakDaily: 6000, weekly: 31200, monthly: 104000, deposit: 7500, kmPerDay: 250, extraKm: 20 },
    chauffeur: { hourly: 750, halfDay: 3300, fullDay: 5000, airport: 1200, overtime: 550 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "bugatti-chiron-super-sport", brand: "bugatti", model: "Chiron Super Sport", modelSlug: "chiron-super-sport", name: "Bugatti Chiron Super Sport", year: "2023",
    category: "hypercars", tags: [], tier: "H", priceTier: "H", body: "hypercar", paint: { name: "Nocturne Blue Carbon", hex: "#1C2A4A" },
    heroRank: 3, heroScene: "sculpture",
    tagline: "The final Chiron. 1,578 hp from a quad-turbo W16.",
    details: { interior: "Beluga black leather, blue stitching", wheels: "20-inch front, 21-inch rear forged, dark finish", equipment: ["Active rear wing", "Carbon-ceramic brakes", "Front-axle lift", "Accuphase audio"] },
    specs: { engine: "8.0 L quad-turbo W16", engineLayout: "W16", hybrid: false, hp: 1578, ps: 1600, zeroTo100: 2.4, topSpeedKmh: 440, topSpeedNote: "limited", seats: "2", body: "Long-tail coupé", drivetrain: "AWD" },
    rates: { daily: 60000, peakDaily: 69000, weekly: null, monthly: null, deposit: 150000, kmPerDay: 150, extraKm: 150, onRequest: true },
    minDays: 2, ...RULES.H, images: placeholder, addedAt: added,
  },
  {
    slug: "ferrari-296-gts", brand: "ferrari", model: "296 GTS", modelSlug: "296-gts", name: "Ferrari 296 GTS", year: "2025",
    category: "supercars", tags: ["convertibles"], tier: "S", priceTier: "B", body: "spider", paint: { name: "Giallo Modena", hex: "#F2C200" },
    heroRank: 4, heroScene: "skyline",
    tagline: "A hybrid V6 spider with the roof down in 14 seconds.",
    details: { interior: "Nero leather, yellow stitching", wheels: "20-inch forged, diamond finish", equipment: ["Retractable hard top", "eDrive electric mode", "Front-axle lift", "Passenger display"] },
    specs: { engine: "3.0 L twin-turbo V6 plug-in hybrid", engineLayout: "V6", hybrid: true, hp: 819, ps: 830, zeroTo100: 2.9, topSpeedKmh: 330, topSpeedNote: "over", seats: "2", body: "Retractable hard-top spider", drivetrain: "RWD" },
    rates: { daily: 3500, peakDaily: 4000, weekly: 21000, monthly: 70000, deposit: 7500, kmPerDay: 250, extraKm: 20 },
    minDays: 1, ...RULES.S, images: placeholder, addedAt: added,
  },
  {
    slug: "mclaren-750s-spider", brand: "mclaren", model: "750S Spider", modelSlug: "750s-spider", name: "McLaren 750S Spider", year: "2025",
    category: "convertibles", tags: ["supercars"], tier: "S", priceTier: "B", body: "spider", paint: { name: "Papaya Spark", hex: "#FF7A00" },
    heroRank: 5, heroScene: "sculpture",
    tagline: "Dihedral doors, a carbon tub and an open sky.",
    details: { interior: "Carbon Black leather and Alcantara", wheels: "10-spoke forged, gloss black", equipment: ["Retractable hard top", "Electrochromic glass roof", "Front-axle lift", "Bowers & Wilkins audio"] },
    specs: { engine: "4.0 L twin-turbo V8", engineLayout: "V8", hybrid: false, hp: 740, ps: 750, zeroTo100: 2.8, topSpeedKmh: 332, seats: "2", body: "Retractable hard-top, dihedral doors", drivetrain: "RWD" },
    rates: { daily: 3500, peakDaily: 4000, weekly: 21000, monthly: 70000, deposit: 7500, kmPerDay: 250, extraKm: 20 },
    minDays: 1, ...RULES.S, images: placeholder, addedAt: added,
  },
  {
    slug: "ferrari-purosangue", brand: "ferrari", model: "Purosangue", modelSlug: "purosangue", name: "Ferrari Purosangue", year: "2026",
    category: "suvs", tags: ["supercars"], tier: "S", priceTier: "A", body: "suv", paint: { name: "Rosso Corsa", hex: "#B0141A" },
    tagline: "Ferrari's first four-door, with a naturally aspirated V12.",
    details: { interior: "Cuoio tan leather", wheels: "22-inch front, 23-inch rear forged", equipment: ["Four individual seats with massage", "Rear-hinged rear doors", "Burmester audio", "Passenger display"] },
    specs: { engine: "6.5 L V12", engineLayout: "V12", hybrid: false, hp: 715, ps: 725, zeroTo100: 3.3, topSpeedKmh: 310, topSpeedNote: "over", seats: "4", body: "Four-door SUV", drivetrain: "AWD" },
    rates: { daily: 7500, peakDaily: 8600, weekly: 45000, monthly: 150000, deposit: 10000, kmPerDay: 250, extraKm: 25 },
    minDays: 1, ...RULES.S, images: placeholder, addedAt: added,
  },
  {
    slug: "lamborghini-urus-se", brand: "lamborghini", model: "Urus SE", modelSlug: "urus-se", name: "Lamborghini Urus SE", year: "2025",
    category: "suvs", tags: [], tier: "S", priceTier: "B", body: "suv", paint: { name: "Nero Noctis", hex: "#151515" },
    tagline: "Dubai's favourite super-SUV, now a plug-in hybrid.",
    details: { interior: "Nero Ade leather, red stitching", wheels: "23-inch forged, gloss black", equipment: ["Plug-in hybrid with electric mode", "Panoramic roof", "Bang & Olufsen 3D audio", "Ventilated massage seats"] },
    specs: { engine: "4.0 L twin-turbo V8 plug-in hybrid", engineLayout: "V8", hybrid: true, hp: 789, ps: 800, zeroTo100: 3.4, topSpeedKmh: 312, seats: "5", body: "SUV", drivetrain: "AWD" },
    rates: { daily: 3800, peakDaily: 4350, weekly: 22800, monthly: 76000, deposit: 7500, kmPerDay: 250, extraKm: 20 },
    minDays: 1, ...RULES.S, images: placeholder, addedAt: added,
  },
  {
    slug: "mclaren-artura", brand: "mclaren", model: "Artura", modelSlug: "artura", name: "McLaren Artura", year: "2025",
    category: "supercars", tags: [], tier: "S", priceTier: "C", body: "supercar", paint: { name: "Silica White", hex: "#E8E8E4" },
    tagline: "A 700 PS hybrid supercar, light on its feet.",
    details: { interior: "Carbon Black Alcantara", wheels: "10-spoke forged, gloss black", equipment: ["E-mode electric driving", "Front-axle lift", "Bowers & Wilkins audio", "Apple CarPlay"] },
    specs: { engine: "3.0 L twin-turbo V6 plug-in hybrid", engineLayout: "V6", hybrid: true, hp: 690, ps: 700, zeroTo100: 3.0, topSpeedKmh: 330, seats: "2", body: "Coupé, dihedral doors", drivetrain: "RWD" },
    rates: { daily: 2500, peakDaily: 2900, weekly: 15000, monthly: 50000, deposit: 5000, kmPerDay: 250, extraKm: 15 },
    minDays: 1, ...RULES.S, images: placeholder, addedAt: added,
  },
  {
    slug: "aston-martin-dbx707", brand: "aston-martin", model: "DBX707", modelSlug: "dbx707", name: "Aston Martin DBX707", year: "2025",
    category: "suvs", tags: [], tier: "L", priceTier: "C", body: "suv", paint: { name: "Satin Xenon Grey", hex: "#5B5F63" },
    tagline: "A British performance SUV with 707 PS.",
    details: { interior: "Black leather, red stitching", wheels: "23-inch forged, satin black", equipment: ["Panoramic glass roof", "Bowers & Wilkins audio", "360° camera", "Ventilated sport seats"] },
    specs: { engine: "4.0 L twin-turbo V8", engineLayout: "V8", hybrid: false, hp: 697, ps: 707, zeroTo100: 3.3, topSpeedKmh: 310, seats: "5", body: "SUV", drivetrain: "AWD" },
    rates: { daily: 2400, peakDaily: 2750, weekly: 14400, monthly: 48000, deposit: 5000, kmPerDay: 250, extraKm: 15 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "aston-martin-db12-volante", brand: "aston-martin", model: "DB12 Volante", modelSlug: "db12-volante", name: "Aston Martin DB12 Volante", year: "2025",
    category: "grand-tourers", tags: ["convertibles"], tier: "L", priceTier: "C", body: "cabriolet", paint: { name: "Iridescent Emerald", hex: "#1E5B4A" },
    tagline: "An open grand tourer for the Hatta road.",
    details: { interior: "Ivory leather with dark walnut", wheels: "21-inch forged, satin black", equipment: ["Eight-layer fabric roof", "Bowers & Wilkins audio", "Ventilated sport seats", "Apple CarPlay"] },
    specs: { engine: "4.0 L twin-turbo V8", engineLayout: "V8", hybrid: false, hp: 671, ps: 680, zeroTo100: 3.7, topSpeedKmh: 325, seats: "2+2", body: "Soft-top convertible", drivetrain: "RWD" },
    rates: { daily: 2600, peakDaily: 3000, weekly: 15600, monthly: 52000, deposit: 5000, kmPerDay: 250, extraKm: 15 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "bentley-bentayga-ewb", brand: "bentley", model: "Bentayga EWB Azure", modelSlug: "bentayga-ewb", name: "Bentley Bentayga EWB Azure", year: "2025",
    category: "suvs", tags: [], tier: "L", priceTier: "C", body: "suv", paint: { name: "Onyx", hex: "#1A1A1A" },
    tagline: "Long-wheelbase calm with lounge rear seats.",
    details: { interior: "Linen and Beluga leather, open-pore walnut", wheels: "22-inch, 10-spoke, painted", equipment: ["Airline-style rear seats with posture adjustment", "Naim audio", "Panoramic roof", "Rear entertainment screens"] },
    specs: { engine: "4.0 L twin-turbo V8", engineLayout: "V8", hybrid: false, hp: 542, ps: 550, zeroTo100: 4.6, topSpeedKmh: 290, seats: "4–5", body: "Long-wheelbase SUV", drivetrain: "AWD" },
    rates: { daily: 2500, peakDaily: 2900, weekly: 15000, monthly: 50000, deposit: 5000, kmPerDay: 250, extraKm: 15 },
    chauffeur: { hourly: 550, halfDay: 2400, fullDay: 3600, airport: 900, overtime: 400 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "bentley-continental-gtc-speed", brand: "bentley", model: "Continental GTC Speed", modelSlug: "continental-gtc-speed", name: "Bentley Continental GTC Speed", year: "2025",
    category: "grand-tourers", tags: ["convertibles"], tier: "L", priceTier: "B", body: "cabriolet", paint: { name: "Glacier White", hex: "#EDEDE8" },
    tagline: "Four seats, a soft top and 782 PS of hybrid V8.",
    details: { interior: "Beluga leather with Cricket Ball red", wheels: "22-inch forged, black and polished", equipment: ["Three-layer fabric roof, opens on the move", "Neck warmers", "Rotating display", "Naim audio"] },
    specs: { engine: "4.0 L twin-turbo V8 plug-in hybrid", engineLayout: "V8", hybrid: true, hp: 771, ps: 782, zeroTo100: 3.4, topSpeedKmh: 285, seats: "4", body: "Soft-top convertible", drivetrain: "AWD" },
    rates: { daily: 3000, peakDaily: 3450, weekly: 18000, monthly: 60000, deposit: 5000, kmPerDay: 250, extraKm: 15 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "rolls-royce-phantom", brand: "rolls-royce", model: "Phantom Series II EWB", modelSlug: "phantom", name: "Rolls-Royce Phantom Series II EWB", year: "2025",
    category: "chauffeur", tags: [], tier: "L", priceTier: "A", body: "limousine", paint: { name: "Arctic White", hex: "#F2F2EE" },
    tagline: "The chauffeur-driven limousine for weddings and VIP arrivals.",
    details: { interior: "Seashell leather with navy piping", wheels: "22-inch polished, self-righting centres", equipment: ["Starlight Headliner", "Rear picnic tables and screens", "Rear coach doors", "Champagne cooler"] },
    specs: { engine: "6.75 L twin-turbo V12", engineLayout: "V12", hybrid: false, hp: 563, ps: 571, zeroTo100: 5.4, topSpeedKmh: 250, topSpeedNote: "limited", seats: "4–5", body: "Long-wheelbase saloon", drivetrain: "RWD" },
    rates: { daily: 6500, peakDaily: 7500, weekly: 39000, monthly: 130000, deposit: 10000, kmPerDay: 250, extraKm: 25 },
    chauffeur: { hourly: 900, halfDay: 4000, fullDay: 6000, airport: 1500, overtime: 650 },
    chauffeurFirst: true,
    minDays: 1, ...RULES.L, minAge: 30, images: placeholder, addedAt: added,
  },
  {
    slug: "maserati-mcpura-cielo", brand: "maserati", model: "MCPura Cielo", modelSlug: "mcpura-cielo", name: "Maserati MCPura Cielo", year: "2025",
    category: "convertibles", tags: ["supercars"], tier: "L", priceTier: "C", body: "spider", paint: { name: "Blu Infinito", hex: "#1D3E8A" },
    tagline: "Butterfly doors and a glass roof that turns clear.",
    details: { interior: "Ghiaccio white leather, blue stitching", wheels: "20-inch forged, gloss black", equipment: ["Glass roof that turns opaque at a touch", "Retractable roof", "Sonus faber audio", "Front-axle lift"] },
    specs: { engine: "3.0 L twin-turbo V6 (Nettuno)", engineLayout: "V6", hybrid: false, hp: 621, ps: 630, zeroTo100: 3.0, topSpeedKmh: 320, seats: "2", body: "Retractable glass roof, butterfly doors", drivetrain: "RWD" },
    rates: { daily: 2200, peakDaily: 2550, weekly: 13200, monthly: 44000, deposit: 5000, kmPerDay: 250, extraKm: 15 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "maserati-granturismo-trofeo", brand: "maserati", model: "GranTurismo Trofeo", modelSlug: "granturismo-trofeo", name: "Maserati GranTurismo Trofeo", year: "2025",
    category: "grand-tourers", tags: [], tier: "L", priceTier: "C", body: "gt", paint: { name: "Grigio Lava", hex: "#4A4A4D" },
    tagline: "A four-seat GT and the easiest way into the fleet.",
    details: { interior: "Black leather, red stitching", wheels: "20-inch forged, dark finish", equipment: ["Four full-size seats", "Sonus faber audio", "Head-up display", "Air suspension"] },
    specs: { engine: "3.0 L twin-turbo V6 (Nettuno)", engineLayout: "V6", hybrid: false, hp: 542, ps: 550, zeroTo100: 3.5, topSpeedKmh: 320, seats: "2+2", body: "Coupé", drivetrain: "AWD" },
    rates: { daily: 1600, peakDaily: 1850, weekly: 9600, monthly: 32000, deposit: 5000, kmPerDay: 250, extraKm: 10 },
    minDays: 1, ...RULES.L, images: placeholder, addedAt: added,
  },
  {
    slug: "bugatti-chiron-sport", brand: "bugatti", model: "Chiron Sport", modelSlug: "chiron-sport", name: "Bugatti Chiron Sport", year: "2022",
    category: "hypercars", tags: [], tier: "H", priceTier: "H", body: "hypercar", paint: { name: "Italian Red and Black", hex: "#8C1C1C" },
    tagline: "1,479 hp, an escorted handover and a briefing from our team.",
    details: { interior: "Italian red and black leather", wheels: "20-inch front, 21-inch rear forged, black", equipment: ["Active rear wing", "Carbon-ceramic brakes", "Accuphase audio", "Front-axle lift"] },
    specs: { engine: "8.0 L quad-turbo W16", engineLayout: "W16", hybrid: false, hp: 1479, ps: 1500, zeroTo100: 2.4, topSpeedKmh: 420, topSpeedNote: "limited", seats: "2", body: "Coupé", drivetrain: "AWD" },
    rates: { daily: 45000, peakDaily: 52000, weekly: null, monthly: null, deposit: 100000, kmPerDay: 150, extraKm: 150, onRequest: true },
    minDays: 2, ...RULES.H, images: placeholder, addedAt: added,
  },
];

export const getCar = (slug: string) => cars.find((c) => c.slug === slug);
export const getCarByPath = (brand: string, modelSlug: string) => cars.find((c) => c.brand === brand && c.modelSlug === modelSlug);
export const carsByBrand = (brand: string) => cars.filter((c) => c.brand === brand);
export const carsInCategory = (category: string) => cars.filter((c) => c.category === category || (c.tags as string[]).includes(category));
export const chauffeurCars = () => cars.filter((c) => c.chauffeur);
export const heroCars = () => cars.filter((c) => c.heroRank).sort((a, b) => (a.heroRank ?? 9) - (b.heroRank ?? 9));
export const carPath = (car: Pick<Car, "brand" | "modelSlug">) => `/cars/${car.brand}/${car.modelSlug}`;
