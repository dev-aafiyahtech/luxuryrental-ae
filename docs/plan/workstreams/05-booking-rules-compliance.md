# 05 · Booking Rules, Policies and UAE Website Compliance

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **Legal Compliance Checker** agent. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - Money values (deposits, km allowances, chauffeur rates and the 3-hour chauffeur minimum) come from [04 Fleet and pricing](04-fleet-pricing.md).
> - Rental Requirements lives at `/requirements` (D-14).
> - Booking data sits in Frankfurt (D-05), with explicit consent and lawyer sign-off as a launch gate.

**Status:** Planning draft, 23 Oct 2026. Approver: Zubair. **This is not legal advice.** The client asked us to assume or create every rule value here. A UAE-qualified lawyer must review them before anyone relies on them, and a UAE tax advisor must check the VAT items. Items marked *verify with a UAE lawyer* (shortened to *verify*) are ones we are not certain of. The client's real rental agreement, T&Cs and privacy policy take over from this draft when they arrive.

**Conventions**
- **Car tiers** (a field on each car in the CMS): **L** Luxury (Rolls-Royce, Bentley, Maserati, Aston Martin), **S** Supercar (Ferrari, Lamborghini, McLaren, including Urus and Purosangue), **H** Hypercar (Bugatti).
- All AED amounts include 5% VAT. Where the pricing section also sets a value (rates, deposits, km allowance, chauffeur rates), the pricing section is the source of truth.
- One typed rules config (`booking-rules.ts`, mirrored in a Sanity singleton) drives form validation, the FAQ and the legal summaries. Each rule's status changes from "Assumed, client to confirm" to "Confirmed by Zubair, <date>" in an approval log, which is the audit trail.

## 1. Booking rules sheet

### 1.1 Rental period, lead time and confirmation
| ID | Website statement | Config value | Status |
|----|-------------------|--------------|--------|
| BR-01 | The minimum self-drive rental is 1 day (24 hours from handover). | `minDays: 1` | Assumed, client to confirm |
| BR-02 | Returns up to 60 minutes late are free. After that, each started hour costs 25% of the daily rate, up to one extra day. | `graceMin: 60, lateHourPct: 25` | Assumed, client to confirm |
| BR-03 | Luxury cars and supercars can be booked from 4 hours ahead, for handovers between 08:00 and 22:00. | `leadHours: {L: 4, S: 4}` | Assumed, client to confirm |
| BR-04 | Hypercars need 72 hours' notice so we can check documents and insurance. | `leadHours.H: 72` | Assumed, client to confirm |
| BR-05 | You can book up to 12 months ahead. Online requests cover up to 30 days; for longer rentals, message us. | `maxAdvanceDays: 365, maxOnlineDays: 30` | Assumed, client to confirm |
| BR-06 | Booking requests are free and nothing is charged on this website. Your booking is confirmed only when our team confirms it on WhatsApp, usually within 1 hour between 09:00 and 22:00. | `payments: "simulated", replySlaMin: 60` | Assumed, client to confirm |
| BR-07 | You pay the rental at handover, or by a payment link we send after confirmation. | `payAt: ["handover", "link"]` | Assumed, client to confirm |

### 1.2 Delivery, collection and airports (base: Dubai Silicon Oasis)
| ID | Website statement | Config value | Status |
|----|-------------------|--------------|--------|
| BR-10 | Collect and return at our Dubai Silicon Oasis office at no charge. | `zone.dso: 0` | Assumed, client to confirm |
| BR-11 | Delivery and collection anywhere in Dubai (except Hatta) are free for rentals of 2 days or more, and AED 150 each way for 1-day rentals. | `zone.dubai: {fee: 150, freeFromDays: 2}` | Assumed, client to confirm |
| BR-12 | Hatta: AED 500 each way. Sharjah and Ajman: AED 300 each way. | `zone.hatta: 500, zone.shjAjm: 300` | Assumed, client to confirm |
| BR-13 | Abu Dhabi city, Yas and Saadiyat: AED 600 each way. Al Ain, Ras Al Khaimah, Umm Al Quwain and Fujairah: AED 800 each way, on request. | `zone.auh: 600, zone.other: 800` | Assumed, client to confirm |
| BR-14 | Airport handover at DXB (Terminals 1, 2 or 3) or DWC: AED 250 per handover, including airport parking and meet-and-greet at arrivals. AUH and SHJ airports on request. | `airport: {DXB: 250, DWC: 250}` | Assumed, client to confirm |
| BR-15 | We track your flight. The first 60 minutes after landing are free, then AED 150 per started hour of waiting. | `airportWaitFreeMin: 60, waitHour: 150` | Assumed, client to confirm |
| BR-16 | Delivery hours are 08:00 to 22:00 every day. Handovers between 22:00 and 08:00 cost AED 300 extra, subject to availability. | `hours: "08:00-22:00", outOfHours: 300` | Assumed, client to confirm |
| BR-17 | We arrive within 30 minutes of your slot. Handover takes 20 to 30 minutes, and the main driver must attend with original documents. | `slotToleranceMin: 30` | Assumed, client to confirm |
| BR-18 | You can return the car at a different location. That zone's fee applies. | `oneWay: zoneFee` | Assumed, client to confirm |

### 1.3 Drivers and documents
| ID | Website statement | Config value | Status |
|----|-------------------|--------------|--------|
| BR-30 | Luxury cars: the main driver must be 25 or older and have held a licence for at least 2 years. | `minAge.L: 25, licYears.L: 2` | Assumed, client to confirm |
| BR-31 | Supercars: 25 or older, with a licence held for at least 3 years. | `minAge.S: 25, licYears.S: 3` | Assumed, client to confirm |
| BR-32 | Hypercars: 30 or older, with a licence held for at least 5 years, and approval from our team and our insurer. | `minAge.H: 30, licYears.H: 5, manualApproval` | Assumed, client to confirm |
| BR-33 | UAE residents must drive on a valid UAE driving licence. | `resident -> licence: "AE"` | Assumed, client to confirm (verify) |
| BR-34 | Visitors can drive on a licence issued in a GCC country. | `gccLicence: true` | Assumed, client to confirm (verify) |
| BR-35 | Visitors can drive on a home licence from a country on the RTA's approved list, such as the UK, EU countries, the USA, Canada, Australia, Japan, South Korea and Singapore. | `rtaApprovedList` (link to RTA, re-check before launch) | Assumed, client to confirm (verify) |
| BR-36 | Other visitors need an International Driving Permit (IDP) together with their home licence. | `idpRequired: !rtaApprovedList` | Assumed, client to confirm (verify) |
| BR-37 | Licences must be full (not learner or provisional) and valid for the whole rental. | `licenceValidThrough: endDate` | Assumed, client to confirm |
| BR-38 | Visitors bring a passport, UAE entry stamp or visa page, driving licence and IDP if needed. Residents bring an Emirates ID and UAE driving licence. | `docs.visitor[], docs.resident[]` | Assumed, client to confirm |
| BR-39 | You'll need a credit card in the main driver's name for the security deposit. Debit cards and cash are not accepted for the deposit. | `depositCard: "credit"` | Assumed, client to confirm |
| BR-40 | We check original documents at handover and hand them straight back. We never keep your passport or Emirates ID. | n/a | Assumed, client to confirm |
| BR-41 | Additional drivers must meet the same rules and be named on the rental agreement, at AED 100 per driver per day. Driving by anyone not named voids the insurance. | `addDriverDay: 100` | Assumed, client to confirm |

### 1.4 Insurance, deposit, fuel, tolls, fines and damage
| ID | Website statement | Config value | Status |
|----|-------------------|--------------|--------|
| BR-50 | Comprehensive insurance is included. For each damage claim you pay up to the excess: AED 5,000 (Luxury), AED 10,000 (Supercar), AED 50,000 (Hypercar). | `excess: {L: 5000, S: 10000, H: 50000}` | Assumed, client to confirm |
| BR-51 | Full Cover lowers the excess to AED 0 for AED 150/day (Luxury) or AED 350/day (Supercar). For hypercars it lowers the excess to AED 15,000 for AED 1,500/day. It also covers tyres, rims and glass. | `fullCover: {...}` | Assumed, client to confirm |
| BR-52 | No insurance applies for driving under alcohol or drugs, unnamed drivers, racing or track use, off-road or sand driving, leaving the UAE, or damage with no police report. | n/a | Assumed, client to confirm |
| BR-53 | Report any accident or damage to the police (Dubai Police app or 999) and to us straight away. Without a police report you pay the full repair cost. | n/a | Assumed, client to confirm |
| BR-54 | A refundable security deposit is held on your card at handover: AED 5,000 (Luxury), AED 10,000 (Supercar), AED 100,000 (Hypercar). | `deposit: {L: 5000, S: 10000, H: 100000}` | Assumed, client to confirm |
| BR-55 | We release the hold 21 days after return (30 days for hypercars), less any fines, tolls or charges. Your bank may take a further 5 to 14 working days. Fines that arrive later are charged to the card on file, and we send you the fine notice. | `releaseDays: {L: 21, S: 21, H: 30}` | Assumed, client to confirm |
| BR-56 | Return the car with the same fuel level. If it is lower, we charge fuel at pump price plus AED 100. Supercars and hypercars take Super 98 only. | `refuelFee: 100` | Assumed, client to confirm |
| BR-57 | Each car includes a daily km allowance (default 250 km, or 150 km for hypercars). Extra km are charged at the rate shown on the car page. | `kmPerDay: {L: 250, S: 250, H: 150}` | Assumed, client to confirm |
| BR-58 | Salik (Dubai tolls) is charged per crossing at the Salik tariff plus AED 1 admin fee. Darb (Abu Dhabi tolls) is charged the same way. | `tollAdmin: 1` | Assumed, client to confirm |
| BR-59 | Traffic and parking fines during your rental are your responsibility. We charge the fine amount plus a AED 100 admin fee per fine. Where the authority allows, we transfer the fine and black points to the driver's licence. | `fineAdmin: 100` | Assumed, client to confirm |
| BR-60 | If the car is impounded because of how it was driven, you pay the impound and release costs and loss of use. | n/a | Assumed, client to confirm |
| BR-61 | Damage is charged from an agency-garage estimate, capped at the excess when insurance applies. Loss of use during repair is 50% of the daily rate, for up to 10 days. | `lossOfUse: {pct: 50, maxDays: 10}` | Assumed, client to confirm |
| BR-62 | No smoking, vaping or pets (assistance animals are welcome). Cleaning or odour treatment costs AED 1,000. | `cleaningFee: 1000` | Assumed, client to confirm |
| BR-63 | Drive within the UAE only. Without our written approval, no crossing into Oman, off-road or track driving, racing, ride-hailing or commercial filming. | n/a | Assumed, client to confirm |
| BR-64 | Our cars have GPS trackers for security and recovery. We check a car's location only for theft, emergencies, accidents or a suspected breach of these rules. | n/a | Assumed, client to confirm |
| BR-65 | All prices are in AED and include 5% VAT. You receive a tax invoice for every rental. | `vatIncluded: true` | Assumed, client to confirm |

### 1.5 Chauffeur service
| ID | Website statement | Config value | Status |
|----|-------------------|--------------|--------|
| BR-70 | Chauffeur service is available on our Rolls-Royce and Bentley models. | `chauffeurTiers: ["rolls", "bentley"]` | Assumed, client to confirm |
| BR-71 | The minimum booking is 4 hours. Rates are from AED 450 per hour (Bentley) and AED 650 per hour (Rolls-Royce). | `minHours: 4` | Assumed, client to confirm |
| BR-72 | The rate covers the chauffeur, fuel, Salik and Darb tolls, and bottled water. Parking is charged at cost. | n/a | Assumed, client to confirm |
| BR-73 | Airport transfers from DXB or DWC to anywhere in Dubai have a 3-hour minimum and include 60 minutes' free waiting after landing. Trips to other emirates have an 8-hour minimum. | `airportMinHours: 3, outOfDubaiMin: 8` | Assumed, client to confirm |
| BR-74 | Extra time is charged per started 30 minutes at half the hourly rate. Waiting counts as booked time. One chauffeur works up to 12 hours a day. | `overtimeBlockMin: 30, maxHours: 12` | Assumed, client to confirm |
| BR-75 | Book at least 12 hours ahead. Up to 4 passengers, or as the car's seats allow. Child seats are free on request. | `leadHours.chauffeur: 12` | Assumed, client to confirm |
| BR-76 | Your chauffeur follows UAE traffic law and may refuse any unsafe or unlawful request. | n/a | Assumed, client to confirm |

## 2. Cancellation and refund policy (website summary draft)
*Created by us. Assumed, client to confirm; lawyer to review. Until the payment gateway is live, nothing is charged online (see Q5).*

**Cancellation and refunds.** Booking requests are free to cancel at any time before we confirm them. To confirm a booking we may ask for an advance of up to 25% of the rental total (at least one day's rental, or the 4-hour minimum for chauffeur bookings). If you cancel a confirmed booking, we refund your advance as follows, counted from the booked start time:

| Refund of advance | Luxury and Supercar | Hypercar | Chauffeur |
|-------------------|---------------------|----------|-----------|
| 100% | 72 hours or more before | 7 days or more before | 24 hours or more before |
| 50% | 24 to 72 hours before | 72 hours to 7 days before | 6 to 24 hours before |
| None | Under 24 hours, or no-show | Under 72 hours, or no-show | Under 6 hours, or no-show |

- **Changing dates:** one free change up to 48 hours before the start, subject to availability. Any price difference applies.
- **Early return:** we re-price the rental at the rate for the days you used and refund any difference.
- **Delivery fees:** refunded in full if you cancel before the car leaves our base.
- **If we cancel or cannot provide your car:** you choose between a full refund and a comparable or better car at no extra cost.
- **Eligibility at handover:** if the main driver does not meet the Rental Requirements (for example, an expired licence or no IDP), it counts as a late cancellation. We check this on WhatsApp before we confirm.
- **Flight delays, cancellations and official weather warnings:** you get a free date change within 6 months or a full refund, with proof such as an airline notice or a National Center of Meteorology warning.
- **Refunds** go to the original payment method within 7 working days. Your bank may take a further 5 to 14 working days to show them.
- **Security deposit:** this is a hold, not a payment. We release it as set out in the Rental Requirements.
- **How to cancel:** send us your booking reference on WhatsApp or by email. The time we receive the message counts, and we confirm the cancellation in writing.
- This policy does not limit your rights under UAE consumer protection law.

## 3. UAE website compliance checklist
**Booking form consent wording (draft).** All boxes start unticked, and each is stored with the notice version, the time and the exact text shown.
1. Required: "I have read the [Privacy Notice] and [Rental Requirements]. I understand my booking is confirmed only when Luxuryrentals confirms it." *(This is an acknowledgement, not consent; the lawful basis is steps taken at the customer's request.)*
2. Required when the preferred channel is WhatsApp (the alternatives are a phone call or email): "Luxuryrentals may message me on WhatsApp at this number about this request."
3. Optional: "Send me offers and new arrivals by WhatsApp and email. I can opt out at any time."

| ID | Requirement for this site | Basis | Phase |
|----|---------------------------|-------|-------|
| C-01 | Privacy Notice page linked from the footer and beside every form. It covers who we are, the data we collect, purposes, lawful basis, recipients (Meta/WhatsApp, hosting, email, insurer, RTA and police on request), transfers abroad, retention, rights, how to complain, and car GPS tracking. | Federal Decree-Law No. 45 of 2021 (PDPL); UAE Data Office (Federal Decree-Law No. 44 of 2021) | MVP |
| C-02 | Consent that is specific, unbundled, provable and as easy to withdraw as to give (the wording above). Opting out of marketing must not block a booking. | PDPL | MVP |
| C-03 | Document uploads: a just-in-time notice and explicit consent; purpose limited to identity, licence, insurer and RTA checks; auto-delete. Treat face images on IDs as possibly sensitive (biometric) data. *Verify.* | PDPL | Phase 2 |
| C-04 | Rights process for access, correction, erasure, restriction, portability and objection. Use a 30-day internal target until the Executive Regulations set the statutory period (*verify*). | PDPL | MVP |
| C-05 | Record of processing, a short DPIA (ID documents, GPS), and a breach plan for notifying the Data Office and affected people. Notice timelines come from the Executive Regulations (*verify* whether issued and in force). | PDPL | MVP |
| C-06 | Transfers abroad: Vercel, email, Meta and any non-UAE database are outside the UAE. Check the PDPL transfer conditions (adequacy, contract or consent), sign data processing agreements, and prefer a UAE region for the booking database and file storage. *Verify.* | PDPL | MVP |
| C-07 | Scope: PDPL applies in DSO, while DIFC and ADGM have their own regimes (*verify*). GDPR or UK GDPR may also apply if we target EU or UK visitors (GDPR Art. 3(2)) (*verify*). | PDPL; GDPR | MVP |
| C-08 | Cookies at MVP: strictly necessary storage only (session, form draft, language), listed in the Cookie Policy. No banner is needed until non-essential tags are added. | PDPL; best practice | MVP |
| C-09 | Before GA4, Meta Pixel or ads tags go live: a consent banner with "Accept all" and "Reject all" given equal weight, a preferences panel, no tags before consent, Google Consent Mode v2, a consent log, and a 12-month re-prompt. English and Arabic. | PDPL; GDPR/ePrivacy for EU visitors; Google EU user consent policy | Phase 2 |
| C-10 | Prices in AED including VAT, with the full total shown before submitting the request: rental, delivery or airport fees, extras. The deposit is shown separately as a refundable hold, and the fuel, toll and fine fees are linked from the form. No hidden or drip fees. | Federal Law No. 15 of 2020 (Consumer Protection) and Cabinet Resolution No. 66 of 2023; Federal Decree-Law No. 8 of 2017 (VAT) and Cabinet Decision No. 52 of 2017 (*verify* the exact display article) | MVP |
| C-11 | Claims must be true. Change the prototype's "Salik tolls and full insurance included" (conflicts with BR-50 and BR-58) to "Comprehensive insurance included", and its "Reservation held" to "Request sent". No "No. 1" claims, invented reviews or fake scarcity. | Consumer Protection law (misleading advertising) | MVP |
| C-12 | Simulated payments: no card fields and no card-scheme logos. State "Nothing is charged on this website." | Consumer Protection law | MVP |
| C-13 | Arabic versions of the price and terms summaries; bilingual tax invoices. *Verify* how much must be in Arabic. | Consumer Protection law; VAT rules | Phase 2 |
| C-14 | A published complaints channel (WhatsApp or email, reply within 5 working days) that names the Dubai consumer protection authority as the escalation route. *Verify.* | Consumer Protection law | MVP |
| C-15 | A tax invoice with the TRN for every rental. VAT on deposits, recharged fines and tolls, and admin fees to be confirmed by a tax advisor. | VAT law | MVP (ops) |
| C-16 | Trader details on the site (legal name, licence number and authority, address, contact), and confirmation that the licence covers online trading. | Federal Decree-Law No. 14 of 2023 on Trading by Modern Technological Means (*verify*) | MVP |
| C-17 | Online acceptance of terms is a valid e-record. Store the accepted version, the time and a hashed IP. E-signing of the rental agreement comes later. | Federal Decree-Law No. 46 of 2021 (Electronic Transactions and Trust Services) | MVP / Phase 3 |
| C-18 | RTA rules: check whether the rental permit sets any required contract or website content, and whether chauffeur service needs a separate RTA limousine permit. *Verify.* | RTA car-rental regulations | MVP |
| C-19 | Payments (later): a hosted payment page so card data stays with the gateway (PCI DSS v4.0.1, SAQ A); 3-D Secure; card-on-file consent for later fines. The deposit hold must stay valid for 21 to 30 days (car-rental authorisations last about 30 days; *verify with the acquirer*). | PCI DSS; card scheme rules | Phase 2 |
| C-20 | WCAG 2.2 AA on the booking flow and legal pages: visible labels, inline errors, keyboard access, contrast, reduced motion, 44px targets, alt text on cars. Publish an accessibility statement. We know of no explicit legal mandate for private websites (*verify*). | Federal Law No. 29 of 2006 (People of Determination); Dubai Law No. 2 of 2014 | MVP |
| C-21 | Label every AI-generated car image "Illustrative image. Actual car, colour and specification may vary." Only show models that are really in the fleet, and replace with real photos before paid ads. We know of no UAE rule requiring AI labels; Meta and Google have their own. *Verify.* | Consumer Protection law; Federal Decree-Law No. 55 of 2023 (Media) and Media Council standards (*verify*) | MVP |
| C-22 | Use brand names only in text, to describe the actual car (e.g. "Ferrari 296 GTB"). No manufacturer logos or badges as site graphics, icons or favicon, and nothing like them in our logo. No "official", "authorised" or "partner". Footer disclaimer: "All brand names are trademarks of their owners. Luxuryrentals is not affiliated with or endorsed by them." The UAE has no written nominative fair-use rule (*verify*). | Federal Decree-Law No. 36 of 2021 (Trademarks) | MVP |
| C-23 | AI images must not show distorted versions of badges. Keep a record of each image's prompt and the tool's commercial licence. Never reuse manufacturer press photos or competitors' photos. | Federal Decree-Law No. 38 of 2021 (Copyright); tool terms | MVP |
| C-24 | Social media: paid influencer posts need a Media Council advertiser permit (*verify*). Use customer photos only with written consent. Brand-name search ads must not imply any affiliation. | Federal Decree-Law No. 55 of 2023; Federal Decree-Law No. 34 of 2021 (Cybercrimes, privacy); Google Ads trademark policy | Phase 2 |
| C-25 | WhatsApp at MVP: a wa.me link with a prefilled summary, so the customer sends the first message. Note that Meta's privacy policy applies. | WhatsApp terms | MVP |
| C-26 | Messages we start ourselves need prior opt-in that names Luxuryrentals and WhatsApp, with marketing kept separate. Act on "STOP" at once. Telemarketing rules (hours, consent, do-not-call) may also apply to WhatsApp marketing (*verify*). | WhatsApp Business Messaging Policy; Cabinet Resolution No. 56 of 2024 (Telemarketing) | Phase 2 |
| C-27 | Staff phones: WhatsApp Business on a company phone with a passcode and no auto-save of media to the gallery. Move documents to secure storage, then delete them from the chat. | PDPL security duty | MVP |
| C-28 | The footer shows: legal entity name [placeholder]; Trade Licence No. [placeholder], issued by [DSO/DIEZ or DET, to confirm]; RTA Rental Permit No. [placeholder] (*verify* whether to show it); VAT TRN [100XXXXXXXXXXXX] (15 digits); address [Unit, Building], Dubai Silicon Oasis, Dubai, UAE; phone, WhatsApp and email [placeholders]; opening hours; links to the legal pages and the accessibility statement; "Prices in AED incl. 5% VAT"; "Car images are illustrative"; the trademark disclaimer; © 2026 [legal name]. | Trade-disclosure and consumer rules above | MVP |

## 4. Legal pages (outlines only; the client supplies the real text)
Each page shows a version number and a "Last updated" date. At MVP it is a website summary that says "the full terms are in your rental agreement".
- **Terms of Rental** (`/legal/terms-of-rental`): Who we are · Definitions · Eligibility and drivers · Booking, confirmation and payment · Prices, VAT and deposit · Delivery, collection and handover · Use of the car (territory, prohibited uses) · Insurance, excess and exclusions · Accidents, damage, breakdown and theft · Fuel, mileage, Salik/Darb, fines and black points · Late, extended and early returns · Cancellation (link) · Vehicle tracking · Liability · Rental agreement precedence · Governing law and courts · Changes · Contact.
- **Privacy Notice** (`/legal/privacy`): Who we are and how to contact us · What we collect (website, booking request, documents, handover, GPS, WhatsApp) · Why, and our lawful basis · Who we share with · Transfers outside the UAE · How long we keep it · Security · Your rights · Complaints (UAE Data Office) · Cookies (link) · Children · Changes.
- **Cookie Policy** (`/legal/cookies`): What cookies are · Cookies we use now · Analytics and advertising cookies (only with consent) · Third parties (WhatsApp, map embeds) · Managing your choices · Changes · Contact.
- **Cancellation and Refund Policy** (`/legal/cancellation`): Summary table · Booking requests · Confirmed bookings · Hypercars · Chauffeur · Date changes · Early return · If we cancel · Flights and weather · Refund method and timing · Deposit release · How to cancel · Your statutory rights.
- **Rental Requirements** (`/rental-requirements`): Minimum age by tier · Licences (UAE residents, GCC, visitors, IDP) · Documents · Credit card and deposit · Additional drivers · Lead time and minimum rental · Delivery zones, airports and hours · Insurance options · Fuel, mileage, tolls and fines · Chauffeur service · FAQ.
- Also recommended: **Website Terms of Use** and an **Accessibility Statement** (one short page each).

## 5. Data handling plan for booking requests
| Stage | Collect | Do not collect | Where |
|-------|---------|----------------|-------|
| 1. Request (web form) | Name; mobile/WhatsApp with country code; email (optional); car; dates and times; delivery and return location; self-drive or chauffeur; main driver age band (25-29 / 30+; under 25 blocked); licence country; UAE resident yes/no; flight number (airport only); notes; consent log | ID images, licence or passport numbers, card details, date of birth | Booking DB (UAE region if available) plus an ops alert |
| 2. Confirmation (WhatsApp) | Booking reference, confirmed price, advance status. From Phase 2, documents through a secure upload link | Card numbers in chat | Booking DB, secure file store |
| 3. Handover (in person) | Originals checked and returned; copies of passport or Emirates ID, licence and IDP attached to the agreement; signed agreement; deposit authorisation reference (the gateway holds the card); condition photos, km, fuel | Original documents kept | Rental agreement file |
| 4. During and after rental | Fines and Salik notices, damage report, invoice, deposit release. GPS checked only for the cases in BR-64 | Routine trip monitoring | Ops and accounts |

| Record | Retention (assumed, client to confirm) |
|--------|----------------------------------------|
| Requests that never become rentals | Delete 90 days after the requested end date |
| ID and licence images, no rental | Delete within 7 days of the decision |
| ID and licence copies, completed rental | 12 months after return, or until open fines or claims close. *Verify* whether RTA or police rules need longer |
| Rental agreements, invoices, payment records | At least 5 years from the end of the tax period (UAE tax procedures law; confirm with tax advisor) |
| Condition photos | 12 months after return, or until any claim closes |
| GPS trip data | 90 days after return, unless there is an incident |
| WhatsApp media on phones | Delete within 7 days of verification; chats kept 12 months |
| Consent and opt-out logs | Life of the consent plus 5 years |
| Server and form logs (no PII in them) | 30 days |

**Access (role-based, MFA on every account, quarterly review, every access logged):**
- **Owner (Zubair):** everything; approves access; handles rights requests and complaints.
- **Reservations agent:** requests, bookings and documents for bookings in progress; no bulk export.
- **Delivery driver:** name, phone, location, time and car for assigned jobs only; sees originals in person, never stored files.
- **Accounts:** invoices, payments, deposit status and fines; no ID images.
- **Developer or agency:** no standing access to production PII; time-limited, logged access approved by the owner.
- **Insurer, RTA, police, Salik:** only what a claim, fine or lawful request needs, and each disclosure is logged.

**Controls:**
- Encryption in transit and at rest. Private file bucket with signed URLs that expire within 10 minutes.
- Uploads limited to JPG, PNG, HEIC or PDF up to 10 MB, malware-scanned, with EXIF location data removed.
- No PII in Sanity, analytics, URLs or error logs.
- A nightly job deletes records past retention.
- Bot protection on the form, listed in the Privacy Notice.

## 6. Tasks, risks and open questions

| ID | Task | Phase | Ideal days |
|----|------|-------|-----------|
| T-01 | Encode the rules sheet as a typed config, with unit tests | MVP | 1.5 |
| T-02 | Form validation and eligibility messages (age band, licence country, IDP, document list, lead time, hours) | MVP | 2 |
| T-03 | Fee and total calculator (zones, airport, out-of-hours, chauffeur hours, VAT-inclusive, deposit shown separately) | MVP | 1.5 |
| T-04 | Consent checkboxes, preferred channel, consent log | MVP | 1 |
| T-05 | Booking storage: encryption, roles, retention deletion job, PII-free logs | MVP | 2 |
| T-06 | Legal page templates in Sanity (versioned) and five summary drafts from this section | MVP | 2 |
| T-07 | Footer legal block, trademark disclaimer, illustrative-image labels | MVP | 0.5 |
| T-08 | Copy fixes (C-11), simulated-payment notice, WhatsApp handoff | MVP | 0.5 |
| T-09 | FAQ generated from the rules config (about 25 entries) | MVP | 1 |
| T-10 | Accessibility pass on the booking flow and legal pages; accessibility statement | MVP | 1.5 |
| T-11 | Cookie audit and Cookie Policy | MVP | 0.5 |
| T-12 | Record of processing, DPIA, breach plan, rights-request procedure | MVP | 1.5 |
| T-13 | Review pack for the lawyer and tax advisor, then apply their feedback (their own time not included) | MVP | 1 |
| T-14 | Client sign-off of every rule value in the approval log | MVP | 0.5 |
| T-15 | Secure document upload after confirmation (signed link, scan, EXIF strip, auto-delete) | Phase 2 | 4 |
| T-16 | Consent manager and Consent Mode v2, before any analytics or Pixel | Phase 2 | 1.5 |
| T-17 | WhatsApp Business Platform: opt-in capture, templates, opt-out handling | Phase 2 | 3 |
| T-18 | Gateway: hosted checkout, advance, deposit hold, refunds per policy (with the payments section) | Phase 2 | 5 |
| T-19 | Arabic legal pages, RTL (legal translator is external) | Phase 2 | 2 |
| T-20 | Rights-request form and export/delete tooling | Phase 2 | 1.5 |
| T-21 | E-signed rental agreement and photo condition report | Phase 3 | 5 |
| T-22 | Identity verification (UAE Pass or a KYC vendor; *verify* private-sector access) | Phase 3 | 4 |
| T-23 | Fines and Salik reconciliation, deposit-release tracker | Phase 3 | 4 |
| T-24 | Yearly compliance review and regulatory-change monitoring | Phase 3 | 1.5 |
| | **Totals:** MVP 17 · Phase 2 17 · Phase 3 14.5 · **All 48.5** | | |

| Risk | L / I | Mitigation |
|------|-------|-----------|
| Assumed rules go live at the "launch immediately" date and contradict the real agreement, insurer or RTA terms | H / H | T-14 sign-off before launch; summaries only; lawyer review within 2 weeks of launch |
| Manufacturer trademark complaint (logos, implied affiliation) | M / H | C-22 and C-23; takedown contact; text-only brand use |
| AI image differs from the real car, causing a dispute or misleading-ad complaint | M / M | C-21 label; send a real photo in the WhatsApp confirmation; real shoot before ads |
| ID documents on staff phones leak | M / H | C-27 now; T-15 upload portal in Phase 2 |
| Deposit hold expires before late fines arrive | M / M | Card-on-file consent; acquirer with extended authorisation |
| PDPL Executive Regulations change timelines or transfer rules | M / M | Quarterly check; config-driven retention |
| Licence or permit scope (online trading, chauffeur or limousine) does not cover the site | L / H | C-16 and C-18 checks before launch |
| Simulated booking taken for a paid one | L / M | C-12 copy; no payment UI |

**Open questions for Zubair**
1. Legal entity name and suffix, trade licence number and issuing authority (DSO/DIEZ or DET), RTA permit number, TRN, full address?
2. Insurer terms: age and licence-years rules, excess per car, Full Cover availability, and whether the Bugatti can be insured for visitors?
3. Deposit per car, accepted methods (credit card only?), and today's release timing?
4. Salik: absorb it as a selling point (the prototype says "included") or charge per crossing (this sheet assumes charging)?
5. Before the gateway goes live, how is the advance collected: payment link, bank transfer or card machine at handover?
6. Delivery: your own drivers or a contractor? Are the zone fees and hours realistic?
7. Is Oman ever allowed, with an NOC and insurance extension?
8. Chauffeur cars and rates. Are chauffeurs employees, and does your RTA permit cover chauffeur service?
9. Do the cars have GPS trackers, and from which provider?
10. How are documents collected and stored today, and do your existing T&Cs already set cancellation terms we must match?
11. Who handles privacy requests and complaints, and which email address should the site use for them?
12. Target markets for ads (GCC, EU/UK, CIS, India)? This affects GDPR and the licence FAQ.
13. When can real car photos replace the AI images?
