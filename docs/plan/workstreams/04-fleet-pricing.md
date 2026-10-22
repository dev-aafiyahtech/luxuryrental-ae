# 04 — Fleet and Pricing

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **Pricing Analyst** agent. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - Deposit release timing follows [05 BR-55](05-booking-rules-compliance.md#14-insurance-deposit-fuel-tolls-fines-and-damage): 21 days, 30 for Bugatti.
> - Category and brand URLs follow D-14 (`/cars/type/{category}`, `/cars/{brand}`), not `/supercars` or `/rent-ferrari-dubai`.

> **Status: ESTIMATE. Zubair to confirm every car, price and spec before launch.** Market rates were researched on 23 Oct 2026 from public Dubai rental listings (sources at the end). All prices are in **AED and include 5% VAT** unless stated. Specs are typical published figures, marked **verify**: check them against the manufacturer before publishing.

## 1. Summary
- **Fleet:** 16 cars, 2 per brand, all 2025–2026 model years except Bugatti. No current-model-year Bugatti can realistically be rented (see section 8).
- **Positioning:** premium-competitive. Launch at or just below the median of VAT-inclusive premium operators, and do not chase the marketplace lows. Prices run from AED 1,600/day (GranTurismo) to AED 7,500/day (Purosangue, Revuelto); Bugatti is on request from AED 45,000/day. The site is new with no reviews, so close that trust gap with value-adds (free delivery, extra km), not lower prices.
- **Rate structure:** one standard daily rate per car. Longer rentals follow a set ladder (7 days = 6x daily, 30 days = 20x daily). Seasons adjust the rate: +15% peak (Nov–Mar), +30% super-peak, -20% summer.

## 2. Fleet (16 cars)

| # | Brand | Model | MY | Primary category | Also tagged | Why it is in the fleet |
|---|---|---|---|---|---|---|
| 1 | Ferrari | Purosangue | 2026 | SUV | Supercar, 4-seat | Ferrari's first 4-door; the highest-earning core car in Dubai |
| 2 | Ferrari | 296 GTS | 2025–26 | Supercar | Convertible | Current open-top Ferrari; a core tourist request |
| 3 | Lamborghini | Revuelto | 2025–26 | Supercar | Flagship | V12 flagship with scissor doors; the most dramatic car in the fleet |
| 4 | Lamborghini | Urus SE | 2025–26 | SUV | — | Dubai's most-supplied super-SUV; the SE is the current plug-in hybrid |
| 5 | McLaren | 750S Spider | 2025–26 | Convertible | Supercar | Dihedral doors and an open roof; strong winter demand |
| 6 | McLaren | Artura (700 PS update) | 2025–26 | Supercar | Hybrid | Entry supercar that widens the price ladder |
| 7 | Aston Martin | DBX707 | 2025–26 | SUV | — | British performance SUV for couples and families |
| 8 | Aston Martin | DB12 Volante | 2025–26 | Grand Tourer | Convertible | Open GT for road trips (Hatta, Jebel Jais) |
| 9 | Bentley | Bentayga EWB (Azure) | 2025–26 | SUV | Chauffeur | Among the first to sell out in peak season; lounge rear seats |
| 10 | Bentley | Continental GTC Speed (4th gen) | 2025–26 | Grand Tourer | Convertible | Four-seat luxury convertible |
| 11 | Rolls-Royce | Cullinan Series II | 2025–26 | SUV | Chauffeur | The top ultra-luxury rental; first to sell out in peak season |
| 12 | Rolls-Royce | Phantom Series II EWB | 2025–26 | Chauffeur | Limousine | The chauffeur-grade limousine for weddings and VIPs |
| 13 | Maserati | MCPura Cielo (formerly MC20 Cielo) | 2025–26 | Convertible | Supercar | Butterfly doors at a value price |
| 14 | Maserati | GranTurismo Trofeo | 2025–26 | Grand Tourer | 4-seat | Entry price point of the fleet; four-seat GT |
| 15 | Bugatti | Chiron Sport | 2021–23 | Hypercar | On request | The Bugatti most often listed for rent in Dubai |
| 16 | Bugatti | Chiron Super Sport | 2022–24 | Hypercar | On request | Final-production Chiron; the ultimate halo car |

**Maserati warning:** Maserati has the weakest rental pricing power of the eight brands. OneClickDrive lists only 2 Maseratis for rent in Dubai (a Grecale and a Levante at AED 400/day before VAT), against 60+ Lamborghinis, and we found no rental comparables for the MCPura or GranTurismo. Their prices below are benchmarked against similar cars. Buy these two used or lease them to protect margin.

## 3. Site taxonomy

| Category | Slug | Definition | Primary cars | Also listed (tag) |
|---|---|---|---|---|
| Hypercar | /hypercars | 1,000+ hp, price on request | Chiron Sport, Chiron Super Sport | — |
| Supercar | /supercars | Two-seat, mid- or rear-engine | Revuelto, 296 GTS, Artura | 750S Spider, MCPura Cielo, Purosangue |
| Convertible | /convertibles | Open-top, any class | 750S Spider, MCPura Cielo | 296 GTS, DB12 Volante, GTC Speed |
| Grand Tourer | /grand-tourers | Front-engine, 2+2 or 4 seats, long-distance comfort | DB12 Volante, GTC Speed, GranTurismo Trofeo | — |
| SUV | /luxury-suv | High-riding, 4–5 seats | Purosangue, Urus SE, DBX707, Bentayga EWB, Cullinan II | — |
| Chauffeur | /chauffeur | A service: priced by the hour or in blocks | Phantom II | Cullinan II, Bentayga EWB |

Each car has **one primary category**, which sets its URL, breadcrumb and schema; tags drive the filters. Add 8 brand pages (e.g. /rent-ferrari-dubai) to match how people search, and a price-band filter: under AED 2,500 / 2,500–5,000 / 5,000+ / on request. For Arabic (RTL), keep the slugs in English and translate the labels.

## 4. Top 5 hero cars (homepage cinematic)

| Rank | Car | Category | Scene | Reason |
|---|---|---|---|---|
| 1 | Lamborghini Revuelto | Supercar | Burj by Night (doors up) | Most dramatic silhouette in the fleet (scissor doors, Y-shaped lights); Lamborghini has the deepest rental supply and search interest in Dubai |
| 2 | Rolls-Royce Cullinan Series II | SUV + Chauffeur | Burj by Night | The illuminated grille reads well at night, and as the first car to sell out in peak it sells the whole brand |
| 3 | Bugatti Chiron Super Sport | Hypercar | Kinetic Sculpture | The halo car people search for out of curiosity; the W16 engine and its four turbos make the best exploded view. CTA: "On request" |
| 4 | Ferrari 296 GTS | Convertible | Burj by Night (roof down) | The prancing horse is the most-recognised badge, and the open roof covers tourists' top request |
| 5 | McLaren 750S Spider | Convertible / Supercar | Kinetic Sculpture | Dihedral doors and the carbon tub make a clean exploded view; papaya orange cuts through the night palette |

If no partner Bugatti is confirmed by launch, swap #3 for the Ferrari Purosangue, because a hero car must be bookable. With no 3D budget, build the scenes from layered 2D or AI imagery and fix one colour per hero car across all assets.

## 5. Key specs for the spec callouts (verify all)

| Car | Powertrain | hp (PS/CV) | 0–100 km/h | Top speed | Seats | Body |
|---|---|---|---|---|---|---|
| Ferrari Purosangue | 6.5 V12 | 715 (725) | 3.3 s | >310 km/h | 4 | 4-door SUV |
| Ferrari 296 GTS | 3.0 V6 TT plug-in hybrid | 819 (830) | 2.9 s | >330 km/h | 2 | Retractable hard-top spider |
| Lamborghini Revuelto | 6.5 V12 plug-in hybrid | 1,001 (1,015) | 2.5 s | >350 km/h | 2 | Coupe, scissor doors |
| Lamborghini Urus SE | 4.0 V8 TT plug-in hybrid | 789 (800) | 3.4 s | 312 km/h | 5 | SUV |
| McLaren 750S Spider | 4.0 V8 TT | 740 (750) | 2.8 s | 332 km/h | 2 | Retractable hard-top, dihedral doors |
| McLaren Artura | 3.0 V6 TT plug-in hybrid | 690 (700) | 3.0 s | 330 km/h | 2 | Coupe, dihedral doors |
| Aston Martin DBX707 | 4.0 V8 TT | 697 (707) | 3.3 s | 310 km/h | 5 | SUV |
| Aston Martin DB12 Volante | 4.0 V8 TT | 671 (680) | 3.7 s | 325 km/h | 2+2 | Soft-top convertible |
| Bentley Bentayga EWB Azure | 4.0 V8 TT | 542 (550) | 4.6 s | 290 km/h | 4–5 | Long-wheelbase SUV |
| Bentley Continental GTC Speed | 4.0 V8 TT plug-in hybrid | 771 (782) | 3.4 s | 285 km/h | 4 | Soft-top convertible |
| Rolls-Royce Cullinan Series II | 6.75 V12 TT | 563 (571) | 5.2 s | 250 km/h (limited) | 4–5 | SUV |
| Rolls-Royce Phantom Series II EWB | 6.75 V12 TT | 563 (571) | 5.4 s | 250 km/h (limited) | 4–5 | Long-wheelbase saloon |
| Maserati MCPura Cielo | 3.0 V6 TT (Nettuno) | 621 (630) | 3.0 s | 320–325 km/h | 2 | Glass retractable roof, butterfly doors |
| Maserati GranTurismo Trofeo | 3.0 V6 TT (Nettuno) | 542 (550) | 3.5 s | 320 km/h | 4 | 2+2 coupe |
| Bugatti Chiron Sport | 8.0 W16 quad-turbo | 1,479 (1,500) | 2.4 s | 420 km/h (limited) | 2 | Coupe |
| Bugatti Chiron Super Sport | 8.0 W16 quad-turbo | 1,578 (1,600) | 2.4 s | 440 km/h (limited) | 2 | Long-tail coupe |

Top speeds are for the spec callouts only. The UAE's highest speed limit is 140 km/h, so keep top speed out of ad headlines and promotional copy.

## 6. Pricing basis and VAT display rule
**Recommended rule: show prices with VAT included everywhere.** FTA guidance (Federal Decree-Law No. 8 of 2017, Art. 38, and the Executive Regulation, Art. 27) requires prices advertised to consumers to include VAT; the penalty is AED 5,000 per violation under Cabinet Decision 49/2021. The company's tax agent should verify this.
- **Format:** "AED 3,500 / day · incl. VAT". At checkout, show the net amount and a VAT line (e.g. AED 3,333.33 + AED 166.67 VAT). Deposits are refundable card holds and are shown without VAT.
- **Presentation:** Octane and OneClickDrive list prices before VAT, so ours will look about 5% higher side by side; add a "VAT included, no hidden fees" badge. Use round prices (AED 3,500, not 3,499); prices ending in 99 are a marketplace habit and signal a discount brand.

**Market evidence used.** Prices quoted before VAT were multiplied by 1.05 so all comparisons include VAT.

| Source | VAT basis | Examples (1-day rate, AED) |
|---|---|---|
| Trinity Rental (premium, tiered) | Included | Purosangue 9,000; Cullinan II 5,700; Phantom 7,600–8,000; Urus SE 4,200; 296 GTS 3,990; 750S Spider 4,200–4,900; Artura 2,800 |
| OneClickDrive (marketplace) | Excluded | Purosangue 5,999–9,000; Revuelto 7,999; 750S Spider 2,799–2,899; 296 GTS 2,999; Urus SE ~USD 1,360 |
| Octane (updated 22 Oct 2026) | Excluded | Purosangue 5,500–7,810; Phantom 4,815; Revuelto 3,893 (stale outlier); Aston Martin DBX 1,589 |
| Friends Car Rental / Dubizzle | Mixed | Cullinan 2025: 5,500; GTC Speed 1,999 + AED 9/km; DBX707 1,499 (promo) + AED 15/km |

## 7. Recommended rates (estimates)

**Table A: daily rates.** Tiers: A = flagship, B = core, C = entry, H = hypercar.

| # | Car | Market range (1 day, incl. VAT) | Launch standard rate / day | Peak rate / day (Nov–Mar, +15%) | Tier |
|---|---|---|---|---|---|
| 1 | Ferrari Purosangue | 5,800–10,000 | **7,500** | 8,600 | A |
| 2 | Ferrari 296 GTS | 3,150–4,200 | **3,500** | 4,000 | B |
| 3 | Lamborghini Revuelto | 4,100–8,400 | **7,500** | 8,600 | A |
| 4 | Lamborghini Urus SE | 3,500–5,250 | **3,800** | 4,350 | B |
| 5 | McLaren 750S Spider | 2,950–4,900 | **3,500** | 4,000 | B |
| 6 | McLaren Artura | 2,200–2,800 | **2,500** | 2,900 | C |
| 7 | Aston Martin DBX707 | 1,550–4,200 | **2,400** | 2,750 | C |
| 8 | Aston Martin DB12 Volante | 2,000–3,200 (benchmarked) | **2,600** | 3,000 | C |
| 9 | Bentley Bentayga EWB | 1,700–2,800 | **2,500** | 2,900 | C |
| 10 | Bentley Continental GTC Speed | 2,100–4,000 | **3,000** | 3,450 | B |
| 11 | Rolls-Royce Cullinan Series II | 4,500–5,800 | **5,200** | 6,000 | A |
| 12 | Rolls-Royce Phantom II (self-drive) | 5,050–8,000 | **6,500** | 7,500 | A |
| 13 | Maserati MCPura Cielo | 1,800–2,800 (benchmarked) | **2,200** | 2,550 | C |
| 14 | Maserati GranTurismo Trofeo | 1,200–2,200 (benchmarked) | **1,600** | 1,850 | C |
| 15 | Bugatti Chiron Sport | 15,000–200,000 (unreliable) | **from 45,000** | from 52,000 | H |
| 16 | Bugatti Chiron Super Sport | 30,000–200,000+ (unreliable) | **from 60,000** | from 69,000 | H |

**Table B: long rentals, deposit and mileage.** Weekly and monthly figures are **totals**, with the per-day equivalent in brackets. The site shows the per-day equivalent first, then the total.

| # | Car | 7 days, total | 30 days, total | Deposit (card hold) | Included km/day | Extra km |
|---|---|---|---|---|---|---|
| 1 | Purosangue | 45,000 (6,430) | 150,000 (5,000) | 10,000 | 250 | 25 |
| 2 | 296 GTS | 21,000 (3,000) | 70,000 (2,330) | 7,500 | 250 | 20 |
| 3 | Revuelto | 45,000 (6,430) | 150,000 (5,000) | 10,000 | 200 | 30 |
| 4 | Urus SE | 22,800 (3,260) | 76,000 (2,530) | 7,500 | 250 | 20 |
| 5 | 750S Spider | 21,000 (3,000) | 70,000 (2,330) | 7,500 | 250 | 20 |
| 6 | Artura | 15,000 (2,140) | 50,000 (1,670) | 5,000 | 250 | 15 |
| 7 | DBX707 | 14,400 (2,060) | 48,000 (1,600) | 5,000 | 250 | 15 |
| 8 | DB12 Volante | 15,600 (2,230) | 52,000 (1,730) | 5,000 | 250 | 15 |
| 9 | Bentayga EWB | 15,000 (2,140) | 50,000 (1,670) | 5,000 | 250 | 15 |
| 10 | GTC Speed | 18,000 (2,570) | 60,000 (2,000) | 5,000 | 250 | 15 |
| 11 | Cullinan II | 31,200 (4,460) | 104,000 (3,470) | 7,500 | 250 | 20 |
| 12 | Phantom II | 39,000 (5,570) | 130,000 (4,330) | 10,000 | 250 | 25 |
| 13 | MCPura Cielo | 13,200 (1,890) | 44,000 (1,470) | 5,000 | 250 | 15 |
| 14 | GranTurismo Trofeo | 9,600 (1,370) | 32,000 (1,070) | 5,000 | 250 | 10 |
| 15 | Chiron Sport | On request | Not offered | 100,000 | 150 | 150 |
| 16 | Chiron Super Sport | On request | Not offered | 150,000 | 150 | 150 |

- **Mileage:** extra km is set at about 0.4–0.6% of the daily rate (the market range is AED 9–30/km). The weekly cap is 7x the daily allowance; the monthly cap is 4,500 km (3,000 km for the Revuelto).
- **Deposits** are released 14–21 days after return, which allows for the delay in Salik charges and RTA fines. Offer a zero-deposit add-on for verified renters aged 25+: AED 250/day for Tier C and AED 350/day for Tier B; not available for Tier A or Bugatti.
- **Phantom is chauffeur-first.** Self-drive needs approval: driver aged 30+.

## 8. Bugatti: operational reality
- **Supply:** Chiron production ended in 2024. The current-model-year Bugattis (W16 Mistral, 99 roadsters, sold out; Tourbillon, 250 cars, deliveries from 2026) go to collectors and have no credible rental supply. The two listings are therefore 2021–24 Chirons from a **partner or consignment owner**, not cars we own. Verify a source before listing them.
- **Market prices are unreliable.** One 2026 Beno article gives AED 15,000–30,000/day; headline "private reservation" listings show AED 120,000–200,000/day, often with "no deposit". Treat the headline figures as marketing.
- **Floor price (Chiron Sport, per rental day, before VAT, estimated):** tyres and consumables ~AED 35/km x 150 km = 5,250; mileage-driven loss of collector value ~AED 85/km x 150 km = 12,750; insurance, servicing and storage ~AED 600k a year ÷ 40 rental days = 15,000; escorted delivery, prep and inspection 2,500. **Floor: ~AED 35,500 (about AED 37,300 incl. VAT).** The "from AED 45,000" launch price sits about 20% above it; anything below AED 30,000 sells the asset below cost.
- **Rules:** minimum 2 days (3 in super-peak) and a 72-hour booking lead time; driver aged 30+ who has held a licence for 5+ years; credit card in the renter's name; 50% prepayment; escorted handover and briefing; telematics speed alerts; no track, desert or other-emirate use without approval.
- **Deposit and insurance:** pre-authorise AED 100,000 (Chiron Sport) or AED 150,000 (Chiron Super Sport), plus a damage excess of about AED 250,000, which the insurer must confirm. Few UAE insurers cover hypercars for rental.
- **On the site:** show "Price on request · from AED 45,000/day" with a WhatsApp concierge button and no instant checkout. Bugatti's value is as a halo: search and social traffic that converts into Rolls-Royce and Lamborghini bookings.

## 9. Chauffeur service (estimates, incl. VAT, fuel, Salik and chauffeur, within Dubai)

| Car | Hourly (3 h minimum) | Half day (5 h) | Full day (10 h) | Airport transfer (DXB/DWC, one way) | Overtime / h | Market reference |
|---|---|---|---|---|---|---|
| Rolls-Royce Phantom II EWB | 900 | 4,000 | 6,000 | 1,500 | 650 | OneClickDrive 4,180 (5 h) / 6,050 (10 h); Jumeirah 2,000–2,300/h |
| Rolls-Royce Cullinan II | 750 | 3,300 | 5,000 | 1,200 | 550 | OneClickDrive 3,000–3,630 (5 h) / 4,800–5,830 (10 h); +500/h |
| Bentley Bentayga EWB | 550 | 2,400 | 3,600 | 900 | 400 | No direct comparable; set at about 70% of Cullinan |

Included: a 60-minute airport wait, water and Wi-Fi. Extras: other emirates +AED 500–800; midnight–06:00 +20%; wedding package (5 h + décor) from AED 4,750 on the Phantom. No peak uplift except super-peak (+20%). Two-seaters are self-drive only.

## 10. Sensitivity analysis (±20%, Ferrari 296 GTS, standard rate AED 3,500)
Assumptions (estimates): 15 rental days a month (50% of days) at the standard rate; variable cost of AED 400 per rental day plus 2.5% card fees; fixed cost of AED 33,000 a month (depreciation on about AED 1.4M at about 22% a year, insurance at about 4%, plus servicing and registration). Two elasticity cases, both unvalidated. Elasticity (e) is the % change in rental days divided by the % change in price: at e = -1.5 a 10% price rise loses 15% of days; at e = -1.0 it loses 10%.

| Price (incl. VAT) | Before VAT | Days/mo (e = -1.5) | Op. profit/mo (e = -1.5) | Days/mo (e = -1.0) | Op. profit/mo (e = -1.0) |
|---|---|---|---|---|---|
| -20%: 2,800 | 2,667 | 19.5 | 9,900 | 18.0 | 6,600 |
| -10%: 3,150 | 3,000 | 17.3 | 10,560 | 16.5 | 8,660 |
| **Recommended: 3,500** | 3,333 | 15.0 | **9,750** | 15.0 | **9,750** |
| +10%: 3,850 | 3,667 | 12.8 | 7,480 | 13.5 | 9,860 |
| +20%: 4,200 | 4,000 | 10.5 | 3,750 | 12.0 | 9,000 |

- **The recommended price is the safest choice.** Under both elasticity cases it is within about AED 810/month of the best result. At -20% the car loses about AED 3,260/month if demand is less price-sensitive; at +20% it loses about AED 6,800 if demand is more price-sensitive.
- **Margins at the recommended price:** contribution margin is 85.5%, operating margin is 19.5%, and break-even is 11.6 rental days a month (39% utilisation). Higher peak demand justifies the +15% peak rate. The same pattern applies across Tiers B and C; re-run with real purchase and insurance costs.

## 11. Pricing strategy notes
**Rental-length ladder (per-day rate):** 1–2 days 100%; 3–6 days 93%; 7–29 days 86% ("7 days for the price of 6"); 30+ days 67% (30 days = 20x daily, fixed all year, 4,500 km/month). Why 20x: a car rented day by day at 50% utilisation earns about 15x its daily rate per month and needs 10+ extra deliveries and cleans. Locking in 30 days at 20x brings in about 33% more revenue at lower cost.

| Season | Dates | Multiplier | Rule |
|---|---|---|---|
| Summer | 1 Jun – 31 Aug | x0.80 | Push 7- and 30-day rentals |
| Standard | Sep–Oct, Apr–May | x1.00 | Table A rates |
| Peak | 1 Nov – 31 Mar | x1.15 | 2-day minimum on Tier A for Fri–Sun pickups |
| Super-peak | 20 Dec – 5 Jan; Abu Dhabi GP weekend (verify dates) | x1.30 | 3-day minimum on all cars |

The multiplier applies to daily and weekly rates; monthly rates stay fixed. **Launch lands in peak,** so go live with peak rates from 1 Nov 2026.

**Weekdays, weekends and minimums:** no weekend surcharge on the list price, because marketplaces compare a single rate and a surcharge reads as a hidden fee. Instead, offer a weekday rate of -10% for Mon–Thu pickup and return, in standard and summer seasons only; peak weekends are protected by the Tier A 2-day minimum. Minimum rental is 1 day (24 h) for the core fleet, 2 days for Bugatti (3 in super-peak) and 3 hours for chauffeur bookings.

**Launch offers.** Each offer is time-boxed and documented, and there are no headline price cuts on hero cars.

| Offer | How it works | Excludes | Expires |
|---|---|---|---|
| Founding Client | Free delivery and collection anywhere in Dubai, plus 50 km/day extra. Offsets the DSO distance and the trust gap | Bugatti | 31 Dec 2026 |
| First Long Rental | 10% off a first booking of 3+ days | Tier A, Bugatti, super-peak | 31 Jan 2027 |
| Chauffeur Intro | One free hour on a first 5 h or 10 h block | Super-peak | 31 Dec 2026 |

**Discount governance (Zubair approves everything):** the site applies the rental-length ladder, the weekday rate and the launch offers automatically. Manual WhatsApp discounts are capped at 10% on the core fleet and 0% on Bugatti or super-peak dates, and each is logged with a reason and an expiry. A booking can combine the ladder with only one offer. Prefer value-adds to price cuts: extra km, free delivery, a deposit waiver or an extra chauffeur hour.

**Review cadence and KPIs:** in peak season, check competitor rates weekly for 6 benchmark cars (Purosangue, Revuelto, Urus SE, Cullinan II, 750S, 296) and review the rate card monthly. If a car is booked more than 80% of days for 2 weeks, raise its price 5–10%; if less than 35% for 4 weeks, test a value-add or -10%. Track utilisation and revenue per available car-day for each car, price realisation (actual revenue ÷ list-price revenue) above 85%, and average discount depth below 8%.

## 12. Open items for the client
1. Purchase, lease or consignment cost per car, plus an insurer quote per car including the excess. Real floor prices depend on these; the current floors are estimates.
2. Bugatti partner and revenue share, and whether Bugatti can be insured for rental at all. If not, show Bugatti as "coming soon".
3. Exact model year, trim and colour per car. A 2026 Purosangue rents for about AED 2,000+ more per day than a 2024.
4. Approve: VAT-inclusive round-number display, deposit levels, the zero-deposit add-on, the Phantom chauffeur-first rule, and the MCPura name for UAE marketing (some local dealers may still use "MC20").

## Sources (accessed 23 Oct 2026)
- Trinity Rental: [Purosangue](https://trinityrental.com/rent-ferrari/ferrari-purosangue), [Rolls-Royce](https://trinityrental.com/rent-rolls-royce), [Lamborghini](https://trinityrental.com/rent-lamborghini), [McLaren](https://trinityrental.com/rent-mclaren), [Bentley](https://trinityrental.com/rent-bentley), [Urus SE](https://trinityrental.com/rent-lamborghini/urus-se), [Phantom](https://trinityrental.com/rent-rolls-royce/rolls-royce-phantom), [seasons](https://trinityrental.com/blog/best-time-to-rent-a-car-in-dubai)
- OneClickDrive: [Ferrari](https://www.oneclickdrive.com/cars-for-rent/dubai/ferrari), [Lamborghini](https://www.oneclickdrive.com/cars-for-rent/dubai/lamborghini), [Maserati](https://www.oneclickdrive.com/cars-for-rent/dubai/maserati), [Rolls-Royce chauffeur](https://www.oneclickdrive.com/chauffeur-service-dubai/rolls-royce), [DBX707](https://www.oneclickdrive.com/details/index/search-car-rentals-dubai/Aston-Martin/DBX707?id=45939)
- Octane: [price list](https://octane.rent/prices), [Purosangue](https://octane.rent/suv-cars/ferrari-purosangue-green/), [Revuelto](https://octane.rent/sports-cars/lamborghini-revuelto-black/), [Phantom](https://octane.rent/luxury-cars/rolls-royce-phantom-blue); [Friends Car Rental, Cullinan](https://friendscarrental.com/rental-prices/rolls-royce-cullinan)
- Dubizzle: [DBX707](https://dubai.dubizzle.com/motors/rental-cars/aston-martin/dbx/2024/9/30/aston-martin-dbx-707-2023-2-228---02395a14d6274321a2b654bf0a8b30f2/), [GTC Speed](https://dubai.dubizzle.com/motors/rental-cars/bentley/continental-gtc/2025/02/21/ultra-performance-hybrid-v8-2-826---f229d744b4904dac95203dcd5da796b0/); Bugatti: [Beno 2026 cost guide](https://www.beno.com/blogs/car-rentals/renting-a-bugatti-in-dubai-true-costs/2163), [SuperSport Chiron Sport](https://supersportcarrental.com/cars-list/rent-sports-cars-in-dubai/rent-bugatti-chiron-sports-in-dubai/), [GMZ Chiron](https://gmz.ae/cars/rent-bugatti-chiron-in-dubai/)
- Demand and chauffeur: [Gulf News, Dec 2025](https://gulfnews.com/business/retail/thinking-of-renting-a-luxury-car-in-dubai-prices-now-touch-dh7500-a-day-1.500380388); [Jumeirah chauffeur rates](https://uiuat.jumeirah.com/en/article/experiences/dubai/baa/ride-in-the-car-of-your-dreams)
- VAT display: [Mondaq](https://www.mondaq.com/tax-authorities/1663664/vat-inclusive-displayed-prices-rule-exceptions-and-implications); [WAM/FTA](https://www.wam.ae/en/article/hszr6ptm-fta-businesses-must-display-vat-inclusive-prices). Specs: [MCPura Cielo](https://cars-data.com/en/maserati/mcpura/2025-convertible/cielo--110847/specs); [GTC Speed](https://autotijd.be/en/specs/bentley/continental-gtc/speed-782-awd-4471)
