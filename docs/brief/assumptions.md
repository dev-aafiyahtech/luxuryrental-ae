# Assumptions register (demo)

**24 Oct 2026.** Zubair: "Estimate and Assume the data, The content will approved later. Do not wait for content approvals." Every value below is an estimate written into the demo so all pages and flows are complete. Each one stays **assumed** until Zubair confirms or replaces it; the source file is where it changes.

Already approved, so not repeated here: the 16 cars, the top 5, the launch rates (plan-answers Q2–Q4), the wordmark and the WhatsApp number.

## 1. Company details (`src/content/site.ts`)

The demo marks these as **sample values** in the footer and on the About page while `site.sampleDetails` is `true`. Set it to `false` once the real values are in.

| Item | Assumed value | Replace with |
|---|---|---|
| Legal entity | Luxuryrentals Car Rental L.L.C. | Name on the trade licence |
| Office | Office 1208, Silicon Oasis HQ, Dubai Silicon Oasis | Real office, map pin and parking notes |
| Trade licence | 1234567 (sample) | Licence number |
| Licensing authority | Dubai Department of Economy and Tourism (DET) | DET, or DSO/DIEZ if free-zone licensed |
| RTA rental permit | 123456 (sample) | Permit number |
| VAT TRN | 100123456700003 (sample) | TRN |
| Booking email | bookings@luxuryrental.ae | Real inbox |
| Privacy email | privacy@luxuryrental.ae | Real inbox, or the booking inbox |
| Ops alerts | ops@luxuryrental.ae | Who receives request emails and alerts (plan §9 Q16) |
| Hours and reply promise | Daily 09:00–22:00; "usually within 1 hour" | Staffed hours and the promise ops can keep (Q5) |
| Consumer protection | Dubai Economy and Tourism Consumer Protection, consumerrights.ae, 600 545 555 | Lawyer to confirm |

## 2. Booking rules (`src/content/rules.ts`)

| Rule | Luxury | Supercar | Hypercar (Bugatti) |
|---|---|---|---|
| Minimum driver age | 25 | 25 | 30 |
| Licence held | 2 years | 3 years | 5 years |
| Notice before handover | 4 hours | 4 hours | 72 hours |
| Insurance excess | AED 5,000 | AED 10,000 | AED 50,000 |
| Full Cover | AED 150 / day, no excess | AED 350 / day, no excess | AED 1,500 / day, AED 15,000 excess |
| Deposit released after | 21 days | 21 days | 30 days |

Deposits per car are in `cars.ts` (AED 5,000 to 10,000; Bugatti AED 100,000 and 150,000). Deposit method: credit-card pre-authorisation at handover (Q13).

| Fee or rule | Assumed |
|---|---|
| Salik | Passed on at the tariff: AED 6 Mon–Sat 06:00–10:00 and 16:00–20:00, AED 4 at other times and on Sundays, free 01:00–06:00. Plus AED 1 admin per crossing |
| Darb (Abu Dhabi) | AED 4 at peak times, plus AED 1 admin |
| Fines | Fine + AED 100 admin; black points transferred where allowed |
| Refuelling | Fuel at pump price + AED 100 |
| Cleaning or odour treatment (smoking, vaping, pets) | AED 1,000 |
| Additional driver | AED 100 / day |
| Child seat | Free |
| Late return | 60 minutes' grace, then 25% of the daily rate per started hour, up to one extra day |
| Handover hours | 08:00–22:00; outside them AED 300 per handover |
| Airport waiting | 60 minutes free after landing, then AED 150 per started hour |
| Loss of use | 50% of the daily rate, up to 10 days |
| Advance | Up to 25% by payment link after confirmation; refunded in 7 working days |
| Free date change | Up to 48 hours before the start |
| Booking window | Up to 30 days online (longer on WhatsApp), up to 365 days ahead |
| Cancellation | Free before confirmation; advance refunded in full up to 72 hours before (7 days for hypercars, 24 hours for chauffeur) |

## 3. Pricing rules (`src/content/rules.ts`)

- Seasons: summer (1 Jun–31 Aug) −20%, standard, peak (1 Nov–31 Mar) +15%, festive peak (20 Dec–5 Jan) +30%.
- Rental-length ladder: 3+ days at 93% of the daily rate, 7 days for the price of 6, fixed 30-day rates.
- Weekday discount: 10% for Mon–Thu pickup and return in standard and summer seasons.
- Offers: Founding Client (to 31 Dec 2026), First Long Rental (to 31 Jan 2027), Chauffeur Intro (to 31 Dec 2026).

## 4. Delivery (`src/content/zones.ts`)

| Zone | Fee each way | Chauffeur start surcharge |
|---|---|---|
| Dubai Silicon Oasis office | Free | — |
| Anywhere in Dubai | AED 150, free from 2 days | — |
| DXB and DWC airports (incl. returns before a flight) | AED 250 | — |
| Hatta | AED 500 | — |
| Sharjah and Ajman (and SHJ airport) | AED 300 | AED 500 |
| Abu Dhabi city, Yas, Saadiyat (and AUH airport) | AED 600 | AED 800 |
| Al Ain, Ras Al Khaimah, Umm Al Quwain, Fujairah | AED 800, 24 hours' notice | AED 1,200 |

Customers can collect and return at the DSO office by appointment (Q10).

## 5. Chauffeur (`src/content/rules.ts`, `cars.ts`)

- 3-hour minimum, half day 5 hours, full day 10 hours, 12 hours maximum, 12 hours' notice.
- Overtime billed per started 30 minutes at the car's extra-hour rate.
- Trips to other emirates are billed by time; starts outside Dubai add the zone surcharge above.
- Night starts (00:00–06:00) +20%; festive peak +20%.
- Up to 4 passengers; fuel, Salik, Darb, water and Wi-Fi included.

## 6. The cars (`src/content/cars.ts`)

Model year, colour, cabin, wheels and equipment for each fleet car. Specs are typical published figures. Replace with the fleet sheet (Q2); the AI images will follow these colours.

| Car | Model year | Exterior | Interior | Wheels | Equipment |
|---|---|---|---|---|---|
| Lamborghini Revuelto | 2025 | Arancio Apodis | Black leather and Alcantara, orange stitching | 21-inch front, 22-inch rear forged wheels, gloss black | Front-axle lift; Carbon-ceramic brakes; Passenger display; Apple CarPlay |
| Rolls-Royce Cullinan Series II | 2025 | Diamond Black | Arctic White leather with black piping | 23-inch forged, polished | Starlight Headliner; Illuminated fascia; Rear entertainment screens; Bespoke audio |
| Bugatti Chiron Super Sport | 2023 | Nocturne Blue Carbon | Beluga black leather, blue stitching | 20-inch front, 21-inch rear forged, dark finish | Active rear wing; Carbon-ceramic brakes; Front-axle lift; Accuphase audio |
| Ferrari 296 GTS | 2025 | Giallo Modena | Nero leather, yellow stitching | 20-inch forged, diamond finish | Retractable hard top; eDrive electric mode; Front-axle lift; Passenger display |
| McLaren 750S Spider | 2025 | Papaya Spark | Carbon Black leather and Alcantara | 10-spoke forged, gloss black | Retractable hard top; Electrochromic glass roof; Front-axle lift; Bowers & Wilkins audio |
| Ferrari Purosangue | 2026 | Rosso Corsa | Cuoio tan leather | 22-inch front, 23-inch rear forged | Four individual seats with massage; Rear-hinged rear doors; Burmester audio; Passenger display |
| Lamborghini Urus SE | 2025 | Nero Noctis | Nero Ade leather, red stitching | 23-inch forged, gloss black | Plug-in hybrid with electric mode; Panoramic roof; Bang & Olufsen 3D audio; Ventilated massage seats |
| McLaren Artura | 2025 | Silica White | Carbon Black Alcantara | 10-spoke forged, gloss black | E-mode electric driving; Front-axle lift; Bowers & Wilkins audio; Apple CarPlay |
| Aston Martin DBX707 | 2025 | Satin Xenon Grey | Black leather, red stitching | 23-inch forged, satin black | Panoramic glass roof; Bowers & Wilkins audio; 360° camera; Ventilated sport seats |
| Aston Martin DB12 Volante | 2025 | Iridescent Emerald | Ivory leather with dark walnut | 21-inch forged, satin black | Eight-layer fabric roof; Bowers & Wilkins audio; Ventilated sport seats; Apple CarPlay |
| Bentley Bentayga EWB Azure | 2025 | Onyx | Linen and Beluga leather, open-pore walnut | 22-inch, 10-spoke, painted | Airline-style rear seats with posture adjustment; Naim audio; Panoramic roof; Rear entertainment screens |
| Bentley Continental GTC Speed | 2025 | Glacier White | Beluga leather with Cricket Ball red | 22-inch forged, black and polished | Three-layer fabric roof, opens on the move; Neck warmers; Rotating display; Naim audio |
| Rolls-Royce Phantom Series II EWB | 2025 | Arctic White | Seashell leather with navy piping | 22-inch polished, self-righting centres | Starlight Headliner; Rear picnic tables and screens; Rear coach doors; Champagne cooler |
| Maserati MCPura Cielo | 2026 | Blu Infinito | Ghiaccio white leather, blue stitching | 20-inch forged, gloss black | Glass roof that turns opaque at a touch; Retractable roof; Sonus faber audio; Front-axle lift |
| Maserati GranTurismo Trofeo | 2025 | Grigio Lava | Black leather, red stitching | 20-inch forged, dark finish | Four full-size seats; Sonus faber audio; Head-up display; Air suspension |
| Bugatti Chiron Sport | 2022 | Italian Red and Black | Italian red and black leather | 20-inch front, 21-inch rear forged, black | Active rear wing; Carbon-ceramic brakes; Accuphase audio; Front-axle lift |

## 7. Wording and promises

- **Prototype promises (Q8):** dropped. No "Salik included", no "confirm within 15 minutes", no rooftop handover, no DXB T3 valet.
- **Payments (Q9):** "Nothing is charged on this website. Pay at handover or by secure link after confirmation." The demo's mock payment page collects no card details.
- **Legal pages:** version "1.0 (demo)", written from these rules, with a short "Demo terms" note. Governing law: Dubai and UAE federal law, Dubai courts. Booking data hosted in the EU under provider contracts and, where needed, consent. All for the UAE lawyer to review (Q15).
- **About page:** neutral copy with no founding year, reviews, customer counts or team photos. Replace with the real story when there is one.

## 8. Still not assumed

- **Car photos and AI images:** need an image-generation account; the line-art illustrations stay until then.
- **Domain, DNS, email cut-over and Vercel:** deferred by Zubair.
