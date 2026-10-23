// Marketing copy for cars and brands (the future CMS fields `description`, `highlights`,
// brand `description`). Written as simulated copy for the demo; facts must come from
// cars.ts. No manufacturer copy, no invented history, awards or customer numbers.
//
// Numbers (power, km, ages, deposits) are interpolated from cars.ts and rules.ts so the
// copy can never disagree with the price tables. Prices themselves are left to the
// pricing components, because they change with the season.

import { cars, getCar } from "./cars";
import { rules } from "./rules";
import { chauffeurCars } from "./cars";
import { formatAED, formatNumber as n } from "@/lib/format";

export interface CarCopy {
  /** ~50 words, used on cards and meta descriptions. */
  summary: string;
  /** ~150 words, car detail page body. Paragraphs are separated by a blank line (split on "\n\n"). */
  description: string;
  /** Three short reasons to rent it. */
  highlights: [string, string, string];
}

export interface BrandCopy {
  /** 60–90 words, brand page intro. */
  intro: string;
  faqs: { q: string; a: string }[];
}

function car(slug: string) {
  const c = getCar(slug);
  if (!c) throw new Error(`copy.ts: unknown car ${slug}`);
  return c;
}

/** 30-day km allowance (pricing.ts uses 4,500 km when a car sets none). */
const kmMonth = (slug: string) => car(slug).rates.kmPerMonth ?? 4500;
const release = (slug: string) => rules.tiers[car(slug).tier].releaseDays;
const lowestDaily = Math.min(...cars.map((c) => c.rates.daily));
/** The most common daily km allowance in the fleet (250 at launch). */
const commonKm = [...cars.map((c) => c.rates.kmPerDay)].sort((a, b) => cars.filter((c) => c.rates.kmPerDay === b).length - cars.filter((c) => c.rates.kmPerDay === a).length)[0];
const lowestTwoDaily = [...cars].sort((a, b) => a.rates.daily - b.rates.daily).slice(0, 2).map((c) => c.slug);

const R = car("lamborghini-revuelto");
const CU = car("rolls-royce-cullinan");
const BSS = car("bugatti-chiron-super-sport");
const F296 = car("ferrari-296-gts");
const M750 = car("mclaren-750s-spider");
const FP = car("ferrari-purosangue");
const U = car("lamborghini-urus-se");
const AR = car("mclaren-artura");
const DBX = car("aston-martin-dbx707");
const DB12 = car("aston-martin-db12-volante");
const BB = car("bentley-bentayga-ewb");
const GTC = car("bentley-continental-gtc-speed");
const PH = car("rolls-royce-phantom");
const MC = car("maserati-mcpura-cielo");
const GT = car("maserati-granturismo-trofeo");
const BS = car("bugatti-chiron-sport");

const deliver = "We deliver it across Dubai, including DXB, or you can collect it from our office in Dubai Silicon Oasis.";

/** Keyed by car slug. Pages fall back to the car's tagline when an entry is missing. */
export const carCopy: Record<string, CarCopy | undefined> = {
  "lamborghini-revuelto": {
    summary: `The Revuelto is Lamborghini's V12 flagship. Its 6.5-litre V12 works with three electric motors for ${n(R.specs.hp)} hp in total, it drives all four wheels, and its doors open upwards. It seats two. ${deliver}`,
    description: [
      `The Revuelto took over from the Aventador at the top of Lamborghini's range. It keeps a naturally aspirated V12 behind the seats and adds three electric motors, two at the front and one in the gearbox, for ${n(R.specs.hp)} hp and all-wheel drive. The scissor doors stayed.`,
      `It suits a short rental with one clear purpose: a night drive along Sheikh Zayed Road with the towers lit, an early run up Jebel Jais before the heat, or a single arrival you want people to remember. Luggage space is small, so bring a soft bag.`,
      `The Revuelto includes ${R.rates.kmPerDay} km a day, where most of our cars include ${n(commonKm)}. The main driver must be ${R.minAge} or older and have held a full licence for at least ${R.licenceYears} years. We hand it over at your hotel, home or the airport, or at our Dubai Silicon Oasis office.`,
    ].join("\n\n"),
    highlights: [`${n(R.specs.hp)} hp from a V12 and three electric motors`, "Scissor doors, two seats, all-wheel drive", `${R.rates.kmPerDay} km a day included`],
  },

  "rolls-royce-cullinan": {
    summary: `The Series II Cullinan keeps Rolls-Royce's twin-turbo V12 and adds an illuminated grille. It seats four or five, rides on air suspension and has a proper boot for airport luggage. Drive it yourself or book it with one of our chauffeurs. Delivered across Dubai or collected from Dubai Silicon Oasis.`,
    description: [
      `The Series II update gave the Cullinan a lit grille, new lights and a reworked cabin, and left the 6.75-litre twin-turbo V12 alone. It makes ${n(CU.specs.hp)} hp, drives all four wheels and sits on air suspension that takes the edge off speed bumps and car-park ramps.`,
      `It covers more kinds of trip than any other car we have: a family week of beach clubs and malls with real luggage in the back, a single evening where the arrival matters, or a business day with a driver while you work in the rear seat.`,
      `You can drive it yourself if you are ${CU.minAge} or older and have held a licence for ${CU.licenceYears} years. Or book it with a chauffeur by the hour, for half a day or for a full day; the chauffeur page lists the rates. Self-drive rentals include ${CU.rates.kmPerDay} km a day. ${deliver}`,
    ].join("\n\n"),
    highlights: ["Twin-turbo V12 and all-wheel drive", "Self-drive or with a chauffeur", `${CU.specs.seats} seats and a full-size boot`],
  },

  "bugatti-chiron-super-sport": {
    summary: `The Chiron Super Sport is the long-tail, higher-speed version of Bugatti's Chiron, with ${n(BSS.specs.hp)} hp from a quad-turbo 8.0-litre engine. It comes from a partner owner and is offered on request. We need ${BSS.leadHours} hours' notice, and every rental starts with an escorted handover and a briefing from our team.`,
    description: [
      `Bugatti built the Super Sport near the end of the Chiron's run, with a longer tail than the standard car and ${n(BSS.specs.hp)} hp from its quad-turbo W16. It is a two-seat coupé with all-wheel drive.`,
      `The car belongs to a partner owner, so we check every request with the owner and our insurer before we accept it. The price is quoted on request. The figure on the site is where quotes start, and our team confirms the final price for your dates on WhatsApp. Allow ${BSS.leadHours} hours between your request and the handover.`,
      `The main driver must be ${BSS.minAge} or older with at least ${BSS.licenceYears} years on a full licence, and the ${formatAED(BSS.rates.deposit)} deposit is held on a credit card in their name. The minimum rental is ${BSS.minDays} days, with ${BSS.rates.kmPerDay} km a day included. A member of our team escorts the car to you and briefs you on it before you drive. Track days, desert driving and trips to other emirates need our written approval.`,
    ].join("\n\n"),
    highlights: [`${n(BSS.specs.hp)} hp quad-turbo W16`, "Escorted handover and briefing", `${BSS.leadHours} hours' notice, price on request`],
  },

  "ferrari-296-gts": {
    summary: `The 296 GTS is Ferrari's open-top plug-in hybrid. A twin-turbo V6 and an electric motor send ${n(F296.specs.hp)} hp to the rear wheels, and the hard-top roof folds away in 14 seconds. It seats two. We deliver it across Dubai, or you can collect it at our Dubai Silicon Oasis office.`,
    description: [
      `The 296 GTS pairs a 3.0-litre twin-turbo V6 with an electric motor between the engine and the gearbox. Together they make ${n(F296.specs.hp)} hp, all of it to the rear wheels. On electric power alone it covers a short distance, which helps on a quiet residential street early in the morning.`,
      `The roof is the reason to choose it. It folds in 14 seconds, so you can drop it at the first set of lights on Jumeirah Beach Road and raise it again when you park. From November to March the evenings are mild enough to drive with it down after sunset.`,
      `Two people and two soft bags fit. The main driver must be ${F296.minAge} or older with a licence held for ${F296.licenceYears} years, and ${F296.rates.kmPerDay} km a day are included. We bring it to your hotel, home or DXB, or you can collect it at our office in Dubai Silicon Oasis.`,
    ].join("\n\n"),
    highlights: [`${n(F296.specs.hp)} hp V6 plug-in hybrid`, "Hard-top roof folds in 14 seconds", "Short electric-only range for quiet starts"],
  },

  "mclaren-750s-spider": {
    summary: `McLaren's open-top 750S has a carbon-fibre tub, a twin-turbo V8 with ${n(M750.specs.hp)} hp and dihedral doors that swing up and forward. The hard-top roof retracts, it seats two and it drives the rear wheels. Delivered across Dubai or collected from our office in Dubai Silicon Oasis.`,
    description: [
      `The 750S Spider is built around a carbon-fibre tub, which is why McLaren could remove the roof without adding much weight. Behind the seats sits a 4.0-litre twin-turbo V8 with ${n(M750.specs.hp)} hp, driving the rear wheels.`,
      `The dihedral doors open up and forward, and they need less room to the side than you would expect in a tight hotel driveway. Take it out at sunrise along Jumeirah Beach Road and Al Sufouh Road, before the traffic builds, with the roof stowed.`,
      `It seats two, with a small luggage space under the front lid. The main driver must be ${M750.minAge} or older with ${M750.licenceYears} years on their licence, and ${M750.rates.kmPerDay} km a day are included. ${deliver}`,
    ].join("\n\n"),
    highlights: [`${n(M750.specs.hp)} hp twin-turbo V8, rear-wheel drive`, "Carbon-fibre tub and dihedral doors", "Retractable hard-top roof"],
  },

  "ferrari-purosangue": {
    summary: `Ferrari's first four-door car keeps a naturally aspirated V12 at the front, with ${n(FP.specs.hp)} hp and all-wheel drive. Four individual seats, rear doors hinged at the back and a usable boot make it the Ferrari for a family or two couples. Delivered across Dubai or collected at Dubai Silicon Oasis.`,
    description: [
      `The Purosangue is the first Ferrari with four doors and four full-size seats. Ferrari kept a naturally aspirated 6.5-litre V12 in the nose, and it makes ${n(FP.specs.hp)} hp with drive to all four wheels. The rear doors are hinged at the back, so rear passengers step straight in.`,
      `It is the Ferrari to choose when the trip includes other people: a family dinner in Downtown, a mountain day out with friends, or an airport run with luggage. It rides higher than Ferrari's sports cars, which helps on speed bumps and steep car-park ramps.`,
      `The main driver must be ${FP.minAge} or older with a licence held for at least ${FP.licenceYears} years, and ${FP.rates.kmPerDay} km a day are included. ${deliver}`,
    ].join("\n\n"),
    highlights: [`Naturally aspirated V12, ${n(FP.specs.hp)} hp`, "Four doors and four full-size seats", "All-wheel drive and a higher ride"],
  },

  "lamborghini-urus-se": {
    summary: `The Urus SE is the plug-in hybrid version of Lamborghini's SUV, with a twin-turbo V8 and an electric motor making ${n(U.specs.hp)} hp. It seats five, drives all four wheels and has room for luggage. We deliver it across Dubai and to DXB, or you can collect it at Dubai Silicon Oasis.`,
    description: [
      `The SE brought a plug-in hybrid system to the Urus: a 4.0-litre twin-turbo V8 and an electric motor in the gearbox, ${n(U.specs.hp)} hp in total, with all-wheel drive. It can run on electric power alone for short distances, so you can leave a residential compound quietly late at night.`,
      `Five seats and a proper boot cover the practical side of a Dubai trip. It takes four adults and their bags from DXB, and it rides high enough for hotel kerbs and speed bumps. From rest to 100 km/h takes ${U.specs.zeroTo100.toFixed(1)} seconds.`,
      `The main driver must be ${U.minAge} or older with ${U.licenceYears} years on their licence, and ${U.rates.kmPerDay} km a day are included. We hand it over at your hotel, home or the airport, or at our office in Dubai Silicon Oasis.`,
    ].join("\n\n"),
    highlights: [`${n(U.specs.hp)} hp V8 plug-in hybrid`, "Five seats and a full boot", `All-wheel drive, 0–100 km/h in ${U.specs.zeroTo100.toFixed(1)} s`],
  },

  "mclaren-artura": {
    summary: `The Artura is McLaren's plug-in hybrid two-seater. A twin-turbo V6 and an electric motor give ${n(AR.specs.hp)} hp, sent to the rear wheels. It has dihedral doors and a carbon-fibre tub, and it is the most affordable McLaren in our fleet. Delivered across Dubai or collected from our Dubai Silicon Oasis office.`,
    description: [
      `The Artura runs the updated version of McLaren's hybrid system, with a 3.0-litre twin-turbo V6 and an electric motor in the gearbox. Total output is ${n(AR.specs.hp)} hp (${n(AR.specs.ps)} PS), all of it to the rear wheels. It can leave the hotel on electric power and start the V6 when you reach the main road.`,
      `It is our entry point into mid-engined McLarens, with dihedral doors and a carbon-fibre tub like the 750S at a lower daily rate. It suits drivers who want a proper supercar for a long weekend without paying flagship prices.`,
      `Two seats and a small front luggage space. The main driver must be ${AR.minAge} or older with at least ${AR.licenceYears} years on their licence, and ${AR.rates.kmPerDay} km a day are included. We deliver it to your hotel, home or DXB, or you can collect it from our office in Dubai Silicon Oasis.`,
    ].join("\n\n"),
    highlights: [`${n(AR.specs.hp)} hp V6 plug-in hybrid`, "Dihedral doors and a carbon-fibre tub", "The most affordable McLaren we offer"],
  },

  "aston-martin-dbx707": {
    summary: `The DBX707 is the most powerful version of Aston Martin's SUV: a twin-turbo V8 with ${n(DBX.specs.ps)} PS, all-wheel drive and five seats. It suits a family that still wants a car with real pace, and the boot takes airport luggage. We deliver across Dubai, or you can collect it from Dubai Silicon Oasis.`,
    description: [
      `The 707 in the name is its output in PS: ${n(DBX.specs.ps)} PS, or ${n(DBX.specs.hp)} hp, from a 4.0-litre twin-turbo V8 with all-wheel drive. It is the most powerful version of the DBX, Aston Martin's only SUV.`,
      `It is the car for a group of four or five who would otherwise split between a sports car and a people carrier. The rear seats take adults, the boot takes suitcases from DXB, and it reaches 100 km/h in ${DBX.specs.zeroTo100.toFixed(1)} seconds when the road is clear.`,
      `It belongs to our Luxury tier, so the main driver needs to be ${DBX.minAge} or older with ${DBX.licenceYears} years on their licence. ${DBX.rates.kmPerDay} km a day are included. We hand it over anywhere in Dubai, including the airport, or at our office in Dubai Silicon Oasis.`,
    ].join("\n\n"),
    highlights: [`${n(DBX.specs.ps)} PS twin-turbo V8`, "Five seats and room for suitcases", `Driver ${DBX.minAge}+, licence held ${DBX.licenceYears} years`],
  },

  "aston-martin-db12-volante": {
    summary: `The DB12 Volante is a front-engined grand tourer with a fabric roof, a twin-turbo V8 with ${n(DB12.specs.ps)} PS and two small rear seats. It is made for long drives, with the roof down in the cooler months. Delivered across Dubai or collected at our Dubai Silicon Oasis office.`,
    description: [
      `The DB12 Volante puts a 4.0-litre twin-turbo V8 (${n(DB12.specs.ps)} PS, ${n(DB12.specs.hp)} hp) in the nose and drives the rear wheels. The roof is fabric and folds behind the cabin. The two rear seats are small, best for children or a pair of bags.`,
      `Choose it for a road trip. Head for the mountains in the morning, stop for lunch, and come back into the city with the roof down after sunset. With the roof up it is quiet enough at motorway speed for a normal conversation.`,
      `The DB12 is in our Luxury tier: the main driver must be ${DB12.minAge} or older with ${DB12.licenceYears} years on their licence. ${DB12.rates.kmPerDay} km a day are included, and extra kilometres are charged at the rate on our pricing page. ${deliver}`,
    ].join("\n\n"),
    highlights: [`${n(DB12.specs.ps)} PS twin-turbo V8, rear-wheel drive`, "Fabric roof and 2+2 seats", "A front-engined car for long drives"],
  },

  "bentley-bentayga-ewb": {
    summary: `The Bentayga EWB is a long-wheelbase Bentley SUV, and the extra length goes into rear legroom. A twin-turbo V8 with ${n(BB.specs.ps)} PS drives all four wheels. Drive it yourself, or book it with one of our chauffeurs and sit in the back. We deliver across Dubai, or you can collect it at Dubai Silicon Oasis.`,
    description: [
      `EWB stands for extended wheelbase. The Bentayga is stretched between the axles and the extra length goes to the rear seats, which are the best seats in the car. The 4.0-litre twin-turbo V8 makes ${n(BB.specs.ps)} PS and drives all four wheels.`,
      `It is the more affordable of our two chauffeur SUVs. Book it with a driver for business days, airport pickups or a family day out, or drive it yourself if you are ${BB.minAge} or older with ${BB.licenceYears} years on your licence.`,
      `Chauffeur bookings are priced by the hour, half day or full day on our chauffeur page. Self-drive rentals include ${BB.rates.kmPerDay} km a day. ${deliver}`,
    ].join("\n\n"),
    highlights: ["Extended wheelbase and lounge rear seats", "Self-drive or with a chauffeur", `${n(BB.specs.ps)} PS V8, all-wheel drive`],
  },

  "bentley-continental-gtc-speed": {
    summary: `The fourth-generation Continental GTC Speed is a four-seat convertible with a plug-in hybrid V8 making ${n(GTC.specs.ps)} PS. It has a fabric roof, all-wheel drive and rear seats for two more people. Delivered across Dubai or collected from our office in Dubai Silicon Oasis.`,
    description: [
      `The latest GTC Speed replaced Bentley's W12 with a plug-in hybrid: a 4.0-litre twin-turbo V8 and an electric motor that together make ${n(GTC.specs.ps)} PS (${n(GTC.specs.hp)} hp), with all-wheel drive. It can cover short distances on electric power alone.`,
      `Its rear seats are the roomiest of any open car we offer. Two couples can head to dinner at a beach club with the roof down, or parents can bring older children along.`,
      `It is in our Luxury tier, so the main driver must be ${GTC.minAge} or older with ${GTC.licenceYears} years on their licence. ${GTC.rates.kmPerDay} km a day are included. We deliver it across Dubai and to the airport, or you can collect it at our Dubai Silicon Oasis office.`,
    ].join("\n\n"),
    highlights: [`${n(GTC.specs.ps)} PS V8 plug-in hybrid`, "Four seats with the roof down", "All-wheel drive and a fabric roof"],
  },

  "rolls-royce-phantom": {
    summary: `The Phantom Series II in extended-wheelbase form is the Rolls-Royce limousine, and we offer it with a chauffeur. Rear-hinged doors, a long rear cabin and a 6.75-litre V12 make it the car for weddings, VIP arrivals and important meetings. Self-drive is possible with our approval, for drivers aged ${PH.minAge} or older.`,
    description: [
      `The Phantom EWB is the longest car in our fleet, and the extra length is all in the rear compartment, where the passengers sit. The rear doors are hinged at the back, so guests step out facing forward. A twin-turbo 6.75-litre V12 with ${n(PH.specs.hp)} hp moves it quietly.`,
      `We offer it chauffeur-driven first. Book it by the hour, for half a day, for a full day or as an airport transfer, and the rate covers the chauffeur, fuel and tolls. It suits a wedding, a hotel-to-venue transfer for a VIP guest, or an evening where the car has to make the right first impression.`,
      `Self-drive is possible only with our approval, for drivers aged ${PH.minAge} or older with ${PH.licenceYears} years on their licence, and ${PH.rates.kmPerDay} km a day are included. Ask us on WhatsApp.`,
    ].join("\n\n"),
    highlights: ["Chauffeur-driven first", "Extended wheelbase, rear-hinged doors", "The longest car in our fleet"],
  },

  "maserati-mcpura-cielo": {
    summary: `The MCPura Cielo, formerly the MC20 Cielo, is Maserati's mid-engined spider. It has butterfly doors, a twin-turbo V6 with ${n(MC.specs.ps)} PS and a glass roof that switches from tinted to clear at the press of a button. It seats two. Delivered across Dubai or collected at Dubai Silicon Oasis.`,
    description: [
      `Maserati renamed the MC20 the MCPura for 2025, and the Cielo is the open version. Its retractable glass roof switches from tinted to clear, so you can shade the cabin at midday and see the sky at night.`,
      `Behind the seats is the Nettuno, Maserati's own 3.0-litre twin-turbo V6, with ${n(MC.specs.ps)} PS driving the rear wheels. The butterfly doors open upwards and outwards.`,
      `It sits in our Luxury tier with the grand tourers, so the main driver must be ${MC.minAge} or older with ${MC.licenceYears} years on their licence, a year less than our Ferraris and McLarens ask for. ${MC.rates.kmPerDay} km a day are included. ${deliver}`,
    ].join("\n\n"),
    highlights: ["Butterfly doors and a mid-mounted V6", "Glass roof that turns from tinted to clear", `Luxury tier: driver ${MC.minAge}+, licence ${MC.licenceYears} years`],
  },

  "maserati-granturismo-trofeo": {
    summary: `The GranTurismo Trofeo is a four-seat Maserati coupé with a twin-turbo V6 making ${n(GT.specs.ps)} PS and all-wheel drive. It is comfortable enough for every day of a long stay${GT.rates.daily === lowestDaily ? " and has the lowest daily rate in our fleet" : ""}. Delivered across Dubai or collected from our Dubai Silicon Oasis office.`,
    description: [
      `The GranTurismo is Maserati's front-engined coupé, and the Trofeo is the more powerful of its two petrol versions: a 3.0-litre twin-turbo Nettuno V6 with ${n(GT.specs.ps)} PS, driving all four wheels.`,
      `It has four seats, two of them small, and a boot that takes a weekend's luggage. That makes it an easy choice for a longer stay: a week of driving between the hotel, meetings and dinners, or 30 days at our fixed monthly rate with ${n(kmMonth(GT.slug))} km included.`,
      `It is in our Luxury tier, so the main driver must be ${GT.minAge} or older with ${GT.licenceYears} years on their licence. ${GT.rates.kmPerDay} km a day are included. We deliver it across Dubai and to DXB, or you can collect it at our office in Dubai Silicon Oasis.`,
    ].join("\n\n"),
    highlights: [`${n(GT.specs.ps)} PS twin-turbo V6, all-wheel drive`, "Four seats and a usable boot", GT.rates.daily === lowestDaily ? "Our lowest daily rate" : "Fixed 30-day rate"],
  },

  "bugatti-chiron-sport": {
    summary: `The Chiron Sport has Bugatti's quad-turbo 8.0-litre W16 with ${n(BS.specs.hp)} hp and all-wheel drive. It comes from a partner owner and is offered on request, with ${BS.leadHours} hours' notice. A member of our team brings it to you and briefs you on the car before you drive.`,
    description: [
      `The Chiron Sport is a two-seat coupé with the same quad-turbo 8.0-litre W16 as every Chiron, here with ${n(BS.specs.hp)} hp and all-wheel drive. It is the more accessible of our two Bugattis. The Super Sport has more power and a longer tail.`,
      `Like the Super Sport, it comes from a partner owner. We check your dates with the owner and our insurer before we confirm, and our team quotes the final price on WhatsApp. The price shown on the site is where quotes start. Allow ${BS.leadHours} hours from request to handover.`,
      `The main driver must be ${BS.minAge} or older with at least ${BS.licenceYears} years on a full licence, and the ${formatAED(BS.rates.deposit)} deposit is held on a credit card in their name. The minimum rental is ${BS.minDays} days with ${BS.rates.kmPerDay} km a day included. The handover is escorted, with a briefing on the controls before you set off. Track days, desert driving and trips to other emirates need our written approval.`,
    ].join("\n\n"),
    highlights: [`${n(BS.specs.hp)} hp quad-turbo W16`, `Minimum ${BS.minDays} days, ${BS.rates.kmPerDay} km a day`, "Escorted handover and briefing"],
  },
};

const S = rules.tiers.S, L = rules.tiers.L, H = rules.tiers.H;
const rrChauffeurFrom = Math.min(...chauffeurCars().filter((c) => c.brand === "rolls-royce").map((c) => c.chauffeur!.hourly));
const sameDeposit = (a: typeof BB, b: typeof GTC) => (a.rates.deposit === b.rates.deposit ? `${formatAED(a.rates.deposit)} on both cars` : `${formatAED(a.rates.deposit)} on the ${a.model} and ${formatAED(b.rates.deposit)} on the ${b.model}`);
const maseratiCheapest = lowestTwoDaily.every((s) => s.startsWith("maserati-"));

/** Keyed by brand slug. */
export const brandCopy: Record<string, BrandCopy | undefined> = {
  lamborghini: {
    intro: `We have two Lamborghinis, and they suit very different trips. The Revuelto is the V12 flagship with scissor doors and two seats, for a short rental where the car is the event. The Urus SE is the five-seat plug-in hybrid SUV for families and groups who want Lamborghini performance with a boot. Both are delivered across Dubai, including DXB, or you can collect them from our office in Dubai Silicon Oasis.`,
    faqs: [
      { q: "How old do I need to be to rent a Lamborghini in Dubai?", a: `${S.minAge} or older, with a full driving licence held for at least ${S.licenceYears} years. The same rule applies to the Revuelto and the Urus SE. Visitors from some countries also need an International Driving Permit; our rental requirements page lists them.` },
      { q: "Revuelto or Urus SE: which should I choose?", a: `Choose the Revuelto for two people and one drive you will remember. Choose the Urus SE if you need five seats or space for suitcases; it also has the lower daily rate. Both are plug-in hybrids with all-wheel drive.` },
      { q: "How much is the deposit on a Lamborghini?", a: `${formatAED(R.rates.deposit)} for the Revuelto and ${formatAED(U.rates.deposit)} for the Urus SE, held on a credit card in the main driver's name. We release the hold ${release(R.slug)} days after you return the car, less any fines or tolls.` },
    ],
  },

  ferrari: {
    intro: `Our two Ferraris sit at opposite ends of the range. The 296 GTS is a two-seat plug-in hybrid with a folding hard-top roof, made for open-air evenings on the coast road. The Purosangue is Ferrari's first four-door car, with a naturally aspirated V12 and room for four adults. We deliver both across Dubai and to the airport, or you can collect them at our office in Dubai Silicon Oasis.`,
    faqs: [
      { q: "Which Ferrari can carry four people?", a: `The Purosangue. It has four full-size seats, rear doors hinged at the back and a usable boot. The 296 GTS seats two.` },
      { q: "What do I need to rent a Ferrari in Dubai?", a: `The main driver must be ${S.minAge} or older with a licence held for at least ${S.licenceYears} years, and needs a credit card in their own name for the deposit. Bring your passport or Emirates ID and your licence to the handover. The full list is on our rental requirements page.` },
      { q: "How many kilometres are included?", a: `${F296.rates.kmPerDay === FP.rates.kmPerDay ? `${F296.rates.kmPerDay} km a day on both cars` : `${F296.rates.kmPerDay} km a day on the 296 GTS and ${FP.rates.kmPerDay} km on the Purosangue`}. Extra kilometres cost ${formatAED(F296.rates.extraKm)} each on the 296 GTS and ${formatAED(FP.rates.extraKm)} on the Purosangue.` },
    ],
  },

  "rolls-royce": {
    intro: `We offer two Rolls-Royces, and both can come with a chauffeur. The Cullinan Series II is the SUV, self-drive or chauffeur-driven, with room for luggage and all-wheel drive. The Phantom Series II EWB is the long-wheelbase limousine, offered with a chauffeur first, for weddings, VIP arrivals and airport pickups. Self-drive rentals are delivered anywhere in Dubai or collected at our office in Dubai Silicon Oasis.`,
    faqs: [
      { q: "Can I rent a Rolls-Royce with a driver?", a: `Yes, both of them. Chauffeur bookings start at ${formatAED(rrChauffeurFrom)} an hour with a ${rules.chauffeur.minHours}-hour minimum, and there are half-day, full-day and airport transfer rates. Our chauffeur page lists every rate.` },
      { q: "Can I drive the Phantom myself?", a: `The Phantom is offered with a chauffeur first. Self-drive is possible only with our approval, for drivers aged ${PH.minAge} or older with at least ${PH.licenceYears} years on their licence. Message us on WhatsApp to ask.` },
      { q: "Can I book a Rolls-Royce for a wedding?", a: `Yes. Book a half or full day so the car can wait between the ceremony, photos and reception. Waiting counts as booked time. Send us the venues and timings on WhatsApp and we will suggest the right package.` },
    ],
  },

  bugatti: {
    intro: `Our two Bugattis, the Chiron Sport and the Chiron Super Sport, come from a partner owner and are offered on request. The price on the site is where quotes start: we confirm the final price on WhatsApp after checking your dates with the owner and our insurer. Each rental needs ${BS.leadHours} hours' notice and starts with an escorted handover and a briefing from our team. The main driver must be ${H.minAge} or older.`,
    faqs: [
      { q: "Why is the Bugatti price on request?", a: `Both cars belong to a partner owner, and the price depends on your dates, the number of days and insurance for the main driver. The figure on each car page is the starting point. Our team confirms the final price on WhatsApp before you commit, and nothing is charged on this website.` },
      { q: "How much notice do you need for a Bugatti?", a: `${BS.leadHours} hours. We use that time to check the main driver's documents and confirm insurance with the owner. The minimum rental is ${BS.minDays} days, with ${BS.rates.kmPerDay} km a day included.` },
      { q: "What happens at a Bugatti handover?", a: `A member of our team escorts the car to you, checks the main driver's licence and passport or Emirates ID, and walks you through the controls before you drive. The deposit, ${formatAED(BS.rates.deposit)} on the Chiron Sport or ${formatAED(BSS.rates.deposit)} on the Super Sport, is held on a credit card in the main driver's name and released ${H.releaseDays} days after the rental ends.` },
    ],
  },

  mclaren: {
    intro: `Both of our McLarens are two-seaters with dihedral doors and carbon-fibre tubs. The 750S Spider is the open-top car, with a twin-turbo V8 and a retractable hard-top roof. The Artura is the plug-in hybrid coupé and the lower-priced way into a McLaren. Both drive the rear wheels. We deliver them across Dubai, including DXB, or you can collect them from our office in Dubai Silicon Oasis.`,
    faqs: [
      { q: "750S Spider or Artura: which should I choose?", a: `Choose the 750S Spider for the open roof and the extra power (${n(M750.specs.hp)} hp against ${n(AR.specs.hp)} hp). Choose the Artura for a lower daily rate, or if you want quiet electric starts from a hotel or a residential street.` },
      { q: "What are the age and licence rules for a McLaren?", a: `The main driver must be ${S.minAge} or older and have held a full licence for at least ${S.licenceYears} years. Additional drivers must meet the same rules and be named on the rental agreement.` },
      { q: "Is there room for luggage in a McLaren?", a: `There is a small luggage space under the front lid, enough for soft bags. For suitcases, choose one of our SUVs or book the airport run with a chauffeur.` },
    ],
  },

  bentley: {
    intro: `Our two Bentleys cover comfort and open-air touring. The Bentayga EWB Azure is a long-wheelbase SUV with lounge rear seats, available self-drive or with a chauffeur. The Continental GTC Speed is a four-seat convertible with a plug-in hybrid V8 and all-wheel drive. Both are in our Luxury tier, so the main driver needs to be ${L.minAge} or older with ${L.licenceYears} years on their licence.`,
    faqs: [
      { q: "Can I book the Bentayga with a chauffeur?", a: `Yes. Chauffeur bookings start at ${formatAED(BB.chauffeur!.hourly)} an hour with a ${rules.chauffeur.minHours}-hour minimum. A half day (${rules.chauffeur.halfDayHours} hours) is ${formatAED(BB.chauffeur!.halfDay)}, a full day (${rules.chauffeur.fullDayHours} hours) is ${formatAED(BB.chauffeur!.fullDay)}, and a one-way airport transfer within Dubai is ${formatAED(BB.chauffeur!.airport)}.` },
      { q: "Does the Continental GTC Speed seat four?", a: `Yes. It has four seats and a fabric roof, so four people can travel with the roof down. Its rear seats are larger than the DB12 Volante's, which makes it our best open car for four adults.` },
      { q: "What deposit do the Bentleys need?", a: `${sameDeposit(BB, GTC)}, held on a credit card in the main driver's name and released ${L.releaseDays} days after you return the car, less any fines or tolls.` },
    ],
  },

  "aston-martin": {
    intro: `Aston Martin gives us an SUV and a convertible grand tourer. The DBX707 is the most powerful version of the DBX, with five seats and a twin-turbo V8. The DB12 Volante is a front-engined 2+2 with a fabric roof, made for long drives with the roof down in winter. Both are in our Luxury tier and are delivered across Dubai or collected at our office in Dubai Silicon Oasis.`,
    faqs: [
      { q: "Which Aston Martin suits a family?", a: `The DBX707. It has five seats, a large boot and all-wheel drive. The DB12 Volante's rear seats are best for children or bags.` },
      { q: "What are the driver rules for an Aston Martin?", a: `The main driver must be ${L.minAge} or older with a full licence held for at least ${L.licenceYears} years, and needs a credit card in their name for the ${formatAED(DBX.rates.deposit)} deposit.` },
      { q: "Can I take the DB12 Volante to Jebel Jais or Hatta?", a: `Yes, you can drive anywhere in the UAE. ${DB12.rates.kmPerDay} km a day are included and extra kilometres cost ${formatAED(DB12.rates.extraKm)} each. Crossing into Oman needs our written approval.` },
    ],
  },

  maserati: {
    intro: `Our Maseratis ${maseratiCheapest ? "have the two lowest daily rates in the fleet" : "are an easy way into the fleet"}. The GranTurismo Trofeo is a four-seat coupé with all-wheel drive. The MCPura Cielo, formerly the MC20 Cielo, is a mid-engined spider with butterfly doors and a glass roof that switches from tinted to clear. Both use Maserati's own twin-turbo V6 and are delivered across Dubai or collected at our office in Dubai Silicon Oasis.`,
    faqs: [
      { q: "Is the MCPura the same car as the MC20?", a: `Yes. Maserati renamed the MC20 the MCPura for 2025. Ours is the Cielo, the open version with the retractable glass roof.` },
      { q: "What do I need to rent a Maserati?", a: `The main driver must be ${L.minAge} or older with a licence held for at least ${L.licenceYears} years, and a credit card in their name for the ${formatAED(GT.rates.deposit)} deposit. Bring your passport or Emirates ID and your licence to the handover.` },
      { q: "Can I rent the GranTurismo for a month?", a: `Yes. The 30-day rate is fixed all year at ${formatAED(GT.rates.monthly ?? 0)}, with ${n(kmMonth(GT.slug))} km included. You can request up to ${rules.maxOnlineDays} days online; for longer rentals, message us on WhatsApp.` },
    ],
  },
};
