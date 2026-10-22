# 6. Site architecture, UX and content

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **UX Architect** agent using the `ui-ux-pro-max`, `site-architecture` and `cro` skills. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - The working top 5 below is replaced by [04's top 5](04-fleet-pricing.md#4-top-5-hero-cars-homepage-cinematic) (no SF90 in the fleet).
> - Driver age follows [05](05-booking-rules-compliance.md#13-drivers-and-documents): 25+, and 30+ for Bugatti.
> - Booking references use `LR-` plus 6 characters (D-23); reply-time copy follows D-21.
> - Category landing pages are MVP, at `/cars/type/{category}`; `/journal` becomes `/guides` (D-14).

ArchitectUX · 23 Oct 2026 · Inputs: `MASTER.md`, `requirements-answers.md`, `THREAD.md`, `prototype/index.html`, `qa/screenshots/`. Skills: site-architecture, cro, ui-ux-pro-max (ux-domain searches; the database has no RTL entries, so the RTL rules in 6.5 come from general practice).

**Position.** The site is a 16-car showroom with a booking-request funnel that ends in WhatsApp. Every decision below serves one path: see a car, pick dates, tap Reserve, send a request, confirm on WhatsApp. The cinematic homepage is the front door. Car pages and the booking flow are where bookings happen, so they get the strictest performance and accessibility rules. Copy says "request" until a person confirms on WhatsApp, because nothing is guaranteed before then.

## 6.1 Sitemap and URL structure

Rules: lowercase, hyphenated, no trailing slash, no IDs. English sits at the root and Arabic under `/ar` (next-intl `localePrefix: "as-needed"`). The app uses a `[locale]` route segment from day one, so adding Arabic needs no URL migration. Slugs stay in Latin script in both languages, because Arabic-script slugs turn into unreadable percent-encoding in WhatsApp links. Use `hreflang` en-AE, ar-AE and x-default, and set `<html lang dir>` from the locale.

```
/                                   Home: 4 chapters + fleet strip              MVP
├── /cars                           Fleet listing, filters as query params      MVP
│   ├── /cars/{brand}               Brand page x8: ferrari, bugatti, bentley,   MVP
│   │                               maserati, mclaren, aston-martin,
│   │                               rolls-royce, lamborghini
│   │   └── /cars/{brand}/{model}   Car detail x16 (/cars/lamborghini/revuelto) MVP
│   └── /cars/type/{category}       Category landings (supercar, suv, ...)      P2
├── /chauffeur                      Chauffeur service                           MVP
├── /delivery                       Zones, airport handover, hours              MVP
│   └── /delivery/{area}            Area pages (dubai-marina, dxb-airport)      P2
├── /book/trip                      Step 1: dates, times, handover              MVP
├── /book/extras                    Step 2: insurance, chauffeur, add-ons       MVP
├── /book/driver                    Step 3: driver details                      MVP
├── /book/review                    Step 4: quote + request                     MVP
├── /book/confirmed                 Reference + WhatsApp handoff (noindex)      MVP
├── /about  /faq  /contact                                                      MVP
├── /legal/terms  /legal/privacy  /legal/rental-terms                           MVP
│   /legal/cancellation  /legal/cookies
├── /offers                         CMS-driven offers                           P2
├── /journal/{slug}                 Dubai driving guides (SEO)                  P2
├── /account/bookings               Booking history (needs auth)                P3
└── not-found.tsx / error.tsx       404 and 500                                 MVP
```

- **Brand filter is a real page** (`/cars/ferrari`), because people search "rent Ferrari Dubai". Category, price, seats and sort are query params on `/cars` (`?category=suv&price=2500-5000&sort=price-asc`). They are canonicalised to `/cars` and set to `noindex,follow` when more than one param is present. `type` is a reserved slug, so no brand can collide with `/cars/type/*`.
- **One page per model, not per unit.** The CMS holds a `units` count. A second unit in another colour is a variant on the same page.
- **Each booking step is its own route**, so browser Back behaves and every funnel step can be measured. Car and dates ride in the query (`/book/trip?car=lamborghini-revuelto&from=2026-10-24T10:00&to=2026-10-26T10:00`), which makes Reserve links shareable and lets them work before hydration. Everything else lives in a local draft (6.3).
- **Header (desktop):** Fleet (dropdown: 8 brands as text plus 3 categories) · Chauffeur · Delivery · FAQ · Contact · WhatsApp icon · **Reserve**. **Mobile:** logo · WhatsApp icon · menu. On mobile, Reserve lives in the bottom dock, not the header.
- **Footer:** Fleet (8 brands) · Services (Chauffeur, Delivery, Airport handover) · Company (About, FAQ, Contact) · Legal (5 pages). It also carries the business details block (name, DSO address, phone, WhatsApp, hours), the trade licence, RTA permit and VAT TRN numbers, and social links (hidden until real URLs exist).
- **Breadcrumbs** appear on brand and car pages only (`Home > Fleet > Lamborghini > Revuelto`), with BreadcrumbList schema.

## 6.2 Page specs (MVP)

Components use the names in MASTER (`.btn-primary`, `.btn-secondary`, `.card`, `.input`, `.booking-panel`) and in the prototype (`dock`, `reserve-card`, `fleet-card`, `spec-list`, `chapter-head`, `eyebrow`, `trust`, `rail`). *Italic* names are new components, specified in 6.5. The booking pages are specified in 6.3.

**Home `/`**
- Purpose: the brand moment, plus the fastest route to a featured car.
- Sections:
  1. Ch0 Skyline: H1, Check availability, Skip intro.
  2. Ch1 Velocity Tunnel: three category `fleet-card`s.
  3. Ch2 Kinetic Sculpture: top-5 *tabs* and `spec-list`.
  4. Ch3 Reserve: `reserve-card`.
  5. Unpinned, after the chapters: full fleet strip (16 `.card`s grouped by brand), How it works (pick, request, confirm on WhatsApp), delivery teaser, `trust` row, 4 FAQ *accordions*, footer.
- Trust row: RTA-licensed, VAT-registered, Dubai Silicon Oasis base, all-inclusive daily rate. There are no reviews yet, so no ratings or "happy customers" counts are invented.
- CTA: Reserve now (Ch3).
- Mobile: the prototype's mobile chapters. The fleet strip is a scroll-snap row with previous/next buttons.

**Fleet `/cars`**
- Purpose: compare all 16 cars and narrow them down fast.
- Sections: H1 with result count; a trip bar ("Fri 24 – Sun 26 Oct · Delivery · Edit") when dates came from the dock; filter bar; car grid; a chauffeur cross-sell card after row 2.
- Filter bar: brand *filter-chips* linking to brand pages, category *segmented*, price buckets, "Chauffeur available" toggle, sort.
- CTA: Reserve on each card, carrying the dates.
- Components: `.card` as car card, *badge*, *empty-state*.
- Mobile: one column with 4:3 images. Filters open in a *bottom-sheet* with a sticky "Show 7 cars" button. Price uses buckets, never a drag-only slider (WCAG 2.5.7).

**Brand `/cars/{brand}`**
- Purpose: rank for brand searches and cross-sell the second model.
- Sections: breadcrumb; H1 "Rent a {Brand} in Dubai"; 60–90-word intro; both models as large cards; side-by-side `spec-list`; 3 FAQs; "Other brands" row.
- CTA: Reserve on each model.
- Mobile: the comparison becomes stacked rows, with the two values side by side.

**Car detail `/cars/{brand}/{model}`**
- Purpose: convert.
- Sections: breadcrumb → hero image (GSAP Flip target from the card), name, category *badge*, "From AED X / day", three headline specs → booking module → gallery (the visual specialist's technique; must work with as few as 4 stills) → full `spec-list` → what's included (insurance, Salik allowance, km per day, delivery) → requirements (age, licence, deposit) → daily, weekly and monthly prices → 3 FAQs → 3 similar cars.
- Booking module: a sticky `reserve-card` in a right column on desktop, inline under the hero on mobile. It holds *date-chips* (Tomorrow · This weekend · 3 days · 7 days), a *date-rail* (next 30 days), "More dates" (full calendar), a live total and **Reserve**.
- CTA: Reserve.
- Mobile: a sticky bar ("AED 4,500 / day · Reserve") replaces the generic dock. An "Illustrative image" note sits under the hero until real photos exist.
- Schema: `Car` with `Offer` (AED, VAT included).

**Chauffeur `/chauffeur`**
- Purpose: hourly chauffeur and airport transfer requests.
- Sections: hero; 3-step how it works; pricing (hourly with a minimum number of hours, flat airport fee, both from the pricing section); eligible cars (CMS flag `chauffeurAvailable`); 4 FAQs.
- CTA: Request a chauffeur → `/book/trip?service=chauffeur&car={slug}`.
- Mobile: car choice is a horizontal *radio-card* row.

**Delivery `/delivery`**
- Purpose: answer "can you bring it to me, and what will it cost?"
- Sections: zone table (zone, areas, fee, notice needed); airport handover (DXB T1/T3, DWC); delivery hours and out-of-hours fee; a static map image (no Google Maps embed at launch, because of its weight and cookies); FAQ.
- CTA: Browse the fleet.
- Mobile: the zone table becomes stacked cards.

| Page | Purpose and sections | CTA | Components · mobile |
|---|---|---|---|
| About | Simulated story (300–400 words), three differentiators, DSO base, licence and VAT facts. No AI-generated "team" portraits: inventing people is deceptive | Browse the fleet | `chapter-head`, `trust` · single column |
| FAQ | 7 groups (Booking, Requirements, Deposit and payment, Insurance and fines, Delivery, Chauffeur, Cancellation), about 28 items, FAQPage schema | Ask on WhatsApp | *accordion* · group jump links become a select |
| Contact | WhatsApp first, then phone, email, DSO address, hours, static map, and a short form (name, mobile, message) that emails ops | Message us on WhatsApp | `.input`, `.btn-primary` · tap-to-call and tap-to-WhatsApp |
| Legal x5 | Long-form template: H1, "Last updated", table of contents, 70ch column at 17px. A "Draft: to be replaced with Luxuryrentals' documents" banner stays until the client's real texts arrive | none | no dock, no scene |
| 404 / 500 | "Wrong turn" on a static tunnel image, with links to Fleet, the top 5 and WhatsApp. The 500 page adds "Your booking draft is saved" when one exists | Browse the fleet | `.btn-secondary` |

## 6.3 Booking flow

Principle: the site never says "booked". It creates a **booking request** with a reference, stores it server-side and emails ops **before** offering WhatsApp. A visitor who never taps the WhatsApp button is still a lead.

Assumed booking rules (align with the booking-rules section): requests accepted 24/7, replies 09:00–23:00 GST; delivery 08:00–22:00, with a fee outside those hours; minimum rental 24 hours with 4 hours' notice; online requests up to 30 days, longer rentals go to WhatsApp.

| # | Step | Content | Desktop / mobile |
|---|---|---|---|
| 0 | Entry | Reserve from a car page, the home `reserve-card`, a car card or the chauffeur page. Car and dates are in the query | Same tab |
| 1 | `/book/trip` | Dates (prefilled) and times (*time-select*, 30-minute slots); *segmented* Self-drive / With chauffeur; *segmented* Delivery / Pick up at DSO; delivery area plus optional address, hotel or flight number | Desktop: form on the left (max 640px), sticky quote summary on the right. Mobile: single column, sticky bar "AED 13,650 · Continue", breakdown in a *bottom-sheet* |
| 2 | `/book/extras` | *radio-card* insurance (Standard, included / Premium zero-excess, +AED per day); chauffeur hours if chosen; child-seat *stepper*; additional driver; extra-km pack. Defaults are preselected, with a "Skip, no extras" link | As step 1 |
| 3 | `/book/driver` | Full name; *phone-input* labelled "WhatsApp number" (+971 default, `autocomplete="tel"`); email (optional); licence issuing country (shows an International Driving Permit (IDP) note when needed); checkbox "I am {minAge}+ and have held a licence for 1+ year". Four required fields. No document upload at MVP: documents are collected on WhatsApp and checked at handover | Mobile: correct `inputmode` per field |
| 4 | `/book/review` | *quote-table*: rate x days, delivery, extras, VAT 5% (included), total. The refundable deposit is shown separately, as "held at handover". Cancellation summary; terms checkbox (links open in a sheet, so the draft is untouched); **Send booking request** | Mobile: total and CTA in the bottom bar |
| 4b | Simulated payment | Only when `PAYMENTS_MODE=simulated`, on preview deployments and with `?demo=1`. A mock card form under a "DEMO, no charge" banner. **Never on production**, because a fake card form tells real customers they have paid | Desktop: modal. Mobile: full screen |
| 5 | `/book/confirmed?ref=` | Reference `LR-261024-K7QM` (date plus 4 unambiguous characters); status "Request received, not yet confirmed"; 3-step timeline; **Confirm on WhatsApp** (primary); Copy reference; Add to calendar (.ics). Details come only from the local draft, so a shared link shows the reference without personal data | Mobile: full-width WhatsApp button above the fold |

**WhatsApp handoff.** The button links to `https://wa.me/971500000000?text=` plus the URL-encoded message, with the number taken from the CMS `siteSettings`. It opens the app on phones and WhatsApp Web on desktop. The page also shows the number and a "Copy message" fallback. The reference comes first so ops can find the server record. The price in the message is for information only: visitors can edit the text, so the server record is the source of truth.

```
Hello Luxuryrentals, I'd like to confirm booking request LR-261024-K7QM.
Car: Lamborghini Revuelto
From: Fri 24 Oct 2026, 10:00   Until: Sun 26 Oct 2026, 10:00
Handover: Delivery to Dubai Marina · Extras: Premium insurance
Quote: AED 13,650 incl. VAT · Refundable deposit: AED 10,000
Name: {fullName}
```

| State | Behaviour |
|---|---|
| Loading quote | A skeleton on the total only. The CTA stays enabled. After 400 ms the button shows a spinner and "Checking..." |
| Car blocked on the chosen dates (CMS blackout) | An inline alert: "Booked 24–26 Oct. Free from 27 Oct. [Use these dates]", plus 3 similar cars. Never a dead end |
| Inside the notice period | Those slots are disabled with visible text: "Same-day delivery needs 4 hours' notice. Need it sooner? Ask on WhatsApp" (prefilled) |
| Over 30 days, or outside Dubai | "Monthly rentals and deliveries outside Dubai are quoted personally", with a WhatsApp CTA carrying the car and dates |
| Validation | Inline under the field when it loses focus. On submit, an *error-summary* links to each field and takes focus. Input is never cleared |
| Submit fails | The draft is kept. "We couldn't send your request. [Try again] [Send on WhatsApp instead]". The WhatsApp message carries every detail entered |
| Stale draft (over 24 h old, or the CMS price changed) | Re-quote with "Prices have changed since your last visit" before Review |
| No JavaScript, or not yet hydrated | Forms are real `<form>`s using Server Actions, and date chips are links. Native date inputs are the fallback. The request still submits |
| Out of hours (23:00–09:00) | Requests are still accepted. The dock hint changes from "Replies in about 15 min" to "Replies from 09:00". The confirmation says "We're back at 09:00, and your request is first in the queue." WhatsApp stays the primary button |

**Abandoned-booking fallback.** There is no outbound messaging without consent, and the WhatsApp Business API is a later item.
1. The draft saves to `localStorage` on every step (wrapped in try/catch, and the flow works without it). Returning visitors see a dock banner: "Continue your Revuelto request (Fri 24 – Sun 26 Oct)".
2. Every step has a quiet "Finish on WhatsApp" link that sends what has been filled so far.
3. After 60 seconds idle on Review, an inline nudge (not a modal) offers the same handoff. No exit-intent popups, and Back is never hijacked.
4. Phase 2: an opt-in at the Driver step ("Message me on WhatsApp if I don't finish") allows one template reminder after 30 minutes through the WhatsApp Business API.

**Tap count.** The requirement is dates + car → Reserve in three taps or fewer. Counting rule: a tap is a deliberate activation; scrolls and typing are not counted; defaults cost nothing (10:00 pickup, location chosen at step 1).

| Path | Taps | Result |
|---|---|---|
| Car page: preset chip ("This weekend") → Reserve | 2 | Pass |
| Car page: start → end on the 30-day rail → Reserve | 3 | Pass |
| Home Ch3, featured car preselected: chip → Reserve | 2 | Pass |
| Home Ch2: switch car in the top-5 tabs → chip → Reserve | 3 | Pass |
| Fleet card Reserve, with dates already set in the dock | 1 | Pass |
| Car page, dates more than 30 days out: More dates → start → end → Reserve | 4 | Accepted exception (rare for short-notice luxury rentals) |
| Dates first, from the mobile dock: Edit trip → start → end → Show cars → Reserve | 5 | Not a car-first path. With the dock's default dates it takes 2 taps (Show cars → Reserve) |

**Performance.** The dock and `reserve-card` are server-rendered, with a client island of 30 KB gzip or less that hydrates before any scene code loads. Chips and Reserve work as plain links and forms before hydration. Target: usable at first paint and hydrated within 2.5 s on a mid-range Android over throttled 4G.

## 6.4 Homepage adaptation (image-based cars, real fleet)

**Working top 5:** 1 Lamborghini Revuelto · 2 Ferrari SF90 Stradale · 3 Rolls-Royce Cullinan · 4 McLaren 750S · 5 Bugatti Chiron. Replace these with the fleet section's final pick. Every slot reads `featuredRank` from Sanity, so swapping cars needs no development work.

| Chapter | Car | Change from the prototype | CMS data |
|---|---|---|---|
| Ch0 Skyline | Rank 1, fixed | The rank-1 image replaces the particle car on the helipad (technique: visual specialist). The hero image is the LCP element: AVIF, 150 KB or less at 390w, `fetchpriority="high"`, with separate crops at 4:5 (mobile) and 16:9 (desktop). Rank 1 never rotates, so the LCP image can be cached and preloaded | `homeHero`, `heroImage`, `heroImageMobile` |
| Ch1 Tunnel | Top-ranked car in each category | Three cards (Supercars, Luxury SUVs, Chauffeur), each with a car cutout image. "From AED X / day" is computed from the fleet, never typed in | lowest `dailyRate` in each category |
| Ch2 Sculpture | Car of the day, plus tabs | Top-5 *tabs* (thumbnail and name) above the scene. The default car rotates daily on the server (ISR revalidated at 00:00 GST), never randomly in the browser, which avoids layout shift, hydration mismatches and analytics that can't be attributed. Callouts are anchored at x/y percentages of the image. "See this car" → car page | `featuredRank`, `callouts[]` (label, value, anchorX, anchorY) |
| Ch3 Reserve | The car selected in Ch2 | `reserve-card` shows that car's rate, deposit and date chips. Reserve → `/book/trip` | shared state, `?car=` |

**Dock placement**
- **Desktop (1024px and up):** a bottom-centre `booking-panel`, max 960px wide (the prototype's is wider), on home, fleet, brand, delivery, about, FAQ and contact pages. It hides while the Ch3 `reserve-card` is at least 40% in view, so only one booking form is on screen at a time. It also hides on car pages, where the sticky `reserve-card` takes over.
- **Mobile:** the prototype's collapsed bar ("Your trip · Sat 24 – Tue 27 · Edit trip"), which expands into a *bottom-sheet*. On car pages it becomes "AED X / day · Reserve".
- **Hidden on** `/book/*`, where the step bar owns the bottom of the screen, and on `/legal/*` and 404.
- **Clearance:** every page sets `scroll-padding-bottom` to the dock's height, so the dock never covers focused fields or content.
- **WhatsApp:** no floating WhatsApp button stacked on the dock. WhatsApp sits in the header.

## 6.5 Design system gaps

**MASTER still assumes 3D** in the §2 chapter-map "Build" column (glTF meshes), the car detail page's OrbitControls 360° view, the §8 3D/WebGL rules and the §9 React Three Fiber and 3D asset rows. All of these need rewriting once the image technique is chosen. The skyline and tunnel can stay as WebGL shaders, and the cars become images. Production chrome also drops the "Concept prototype" tag and the sample-price notes. The QA screenshots show native date inputs rendering as 10/24/2026, which breaks the DD/MM/YYYY rule, so the custom picker is required and native inputs are only a pre-hydration fallback.

| New file under `docs/design-system/luxuryrental-ae/pages/` | Overrides |
|---|---|
| `home.md` | Image-based chapter map, top-5 slot rules, dock hide rules, LCP budget |
| `fleet.md` | Grid of 1 column below 768px, 2 columns at 768–1439px, 3 columns at 1440px+; filter sheet; 4:3 card images |
| `car-detail.md` | Flip pair (card image → hero), sticky `reserve-card`, gallery of at least 4 stills, illustrative-image note |
| `booking.md` | Density 6 (forms need a tighter rhythm than density 3). No glass except the summary. No Syncopate in labels or inputs. Motion limited to fades of 200 ms or less. Step header spec |
| `legal.md` | 70ch measure, 17px type at 1.7 line height, table of contents, no scene, no dock |
| `error.md` | Static scene for 404 and 500, and the link set |

**New tokens**
- `--color-warning` and `--color-info` for notices, kept clearly apart from gold so a warning never reads as a CTA (verify both with `qa/scripts/contrast.py`); a z-index scale (header 40, dock 50, sheet 60, modal 70, toast 80); container widths.
- `--scrim-text`: a gradient behind any text over imagery, which must reach 4.5:1 at the worst pixel. `color-scheme: dark`, so native controls and scrollbars render dark.
- No theme toggle. MASTER is dark-only by design, and that overrides the usual light/dark/system default.

**RTL rules**
- Logical CSS properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`), enforced by `stylelint-use-logical` from the first commit.
- Mirror directional icons, the side of the chapter rail and carousel order. Never mirror logos, car images (badges and plates would read backwards), phone glyphs or media controls.
- GSAP and Flip x-offsets are multiplied by a direction sign.
- Arabic text gets no letter-spacing and no uppercase transform, a line height of 1.7, and one size step above English for the same role.
- Prices, dates, phone numbers and booking references use Western digits inside `<bdi>` or `dir="ltr"`. Dates are DD/MM/YYYY, and calendars start on Monday.

**Missing form components:** *date-range picker* (WAI-ARIA APG grid), *date-rail*, *date-chips*, *time-select*, *segmented*, *radio-card*, *stepper*, checkbox, *phone-input*, country select, textarea, field hint, *error-summary*, *step-header* ("Step 2 of 4" + Back), sticky action bar, *quote-table*, *bottom-sheet*, dialog, *accordion*, *filter-chip*, *tabs*, breadcrumb, toast, *skeleton* (static under reduced motion).
- **WhatsApp button:** `.btn-secondary` with the official WhatsApp glyph in white, never recoloured gold. It is the one allowed exception to "Lucide only", because Lucide has no brand icons.

**Empty states.** Each one gets a message and an action, never a blank area. No cars match the filters: "Clear price filter" plus the 3 nearest matches. Car blocked on the chosen dates: the next free dates plus similar cars. Fewer than 5 featured cars in the CMS: fill the slots with the highest daily rates. Missing image: a monogram silhouette at the reserved aspect ratio. Draft expired: re-quote. Offline: "You're offline. Your request is saved and will send when you reconnect."

**CMS badges.** Each card shows at most one badge plus its category label. Every badge is text, never colour alone.

| Badge | Rule | Priority |
|---|---|---|
| Booked until {date} | An active blackout covers today | 1 |
| Offer | Linked to an active offer (Phase 2) | 2 |
| New arrival | `addedAt` within 30 days, or set manually | 3 |
| Featured | `featuredRank` 1–5 | 4 |

Badge style: 12px uppercase label in gold, with a 1px gold outline at 40% opacity on `--color-card`. "Booked" uses muted text. "Chauffeur available" is not a badge; it appears as an icon with text in the specs row.

## 6.6 Content inventory

**Placeholders:** business name **Luxuryrentals** · address `Office [000], [Building], Dubai Silicon Oasis, Dubai, UAE` · phone `+971 4 000 0000` · WhatsApp `+971 50 000 0000` (wa.me format `971500000000`) · email `bookings@luxuryrental.ae` · hours `Daily 09:00–23:00 GST` · trade licence `[TL-000000]` · RTA permit `[RTA-000000]` · VAT TRN `[TRN-000000000000000]`. All of these live in one Sanity `siteSettings` document, so a single edit updates the header, footer, schema and WhatsApp links. A launch check fails the build while any value still contains `000`.

| Content | Qty | Producer | Notes |
|---|---|---|---|
| Car records: specs, day/week/month rates, deposit, km per day, extra-km fee, minimum age, 50- and 150-word descriptions, 3 callouts, SEO title and description | 16 | Claude (estimates); client checks specs and prices | Mark uncertain specs "approx." |
| Car images: 4:3 card, 16:9 and 4:5 hero, 4 gallery stills, alt text for each | 16 sets, plus chapter assets for the top 5 | Image specialist (AI); client approves likeness | No fake number plates; only colours the fleet actually has |
| Brand intros and category blurbs | 8 + 3 | Claude | Brand names as text only: no manufacturer logos, no "official dealer" wording |
| Homepage chapter copy, How it works, trust row | 1 set | Claude, adapting the prototype | Prototype claims need ops sign-off: "Salik included", "confirm within 15 minutes", "rooftop handover", "DXB T3 valet" |
| Chauffeur and Delivery pages | 2 | Claude (estimated fees and zones) | Client approves the numbers |
| About | 1 | Claude (simulated) | No invented founding year, awards or customer counts |
| FAQ | about 28 | Claude, from the assumed rules | Must match the legal texts |
| Legal pages (5) | 5 | Client, who says these are in place; Claude writes flagged placeholders only | Draft banner until replaced |
| Microcopy: labels, errors, empty states, out-of-hours notices, WhatsApp templates, ops email | about 120 strings | Claude | Kept in `messages/en.json` from day one |
| SEO metadata, per-car OG images (`next/og`), schema (`AutoRental`, `Car`, `FAQPage`, `BreadcrumbList`) | All pages | Claude | |
| Social links | 3–4 | Client | Hidden until real |
| Arabic translation and review | All | Translator nominated by the client | Phase 2 |

**SVG logo brief (for the designer)**
- **Name:** Zubair confirms the wordmark text first (open question 1).
- **Variants:** full horizontal lockup (monogram + wordmark), stacked lockup, wordmark only, and an "LR" monogram (favicon, app icon, WhatsApp and Instagram avatars). Each comes in gold on black as the primary (#CA8A04 on #0C0A09) and in single colour: white #FAFAF9, black #0C0A09 and gold. Add a `currentColor` version for inline use in the header, and reserve a slot for an Arabic lockup (Phase 2).
- **Form:** wide geometric capitals that sit well with Syncopate (OFL-licensed, so it can be outlined and modified). No wings, shields, horses, bulls, tridents or car silhouettes, because the fleet's own brands use those shapes. Primary marks use flat colour; a metallic version may exist as an extra, never as the primary.
- **Technical:** SVG with a `viewBox` and no fixed width or height; text converted to outlines; no raster images, filters or masks; a `<title>` element; optimised with SVGO. Monogram under 4 KB, lockup under 10 KB. Clear space is half the monogram's height. Minimum sizes: lockup 120px wide; monogram 16px, with a simplified 16px favicon cut tested at actual size.
- **Pack, delivered to `/public/brand/`:** `favicon.svg`, `favicon.ico` (16 and 32px), `apple-touch-icon.png` at 180px on solid #0C0A09, maskable `icon-192.png` and `icon-512.png` (80% safe zone), a 640x640 avatar that survives a circle crop, a 1200x630 OG template, a one-page usage sheet and the editable source file.

## 6.7 Accessibility and reduced-motion acceptance criteria (launch gate)

The target is WCAG 2.2 AA, and each item is pass/fail.

1. axe-core runs in CI with zero serious or critical issues on: home, `/cars`, one brand page, one car page and every `/book/*` step.
2. The full booking flow can be completed by keyboard alone, and with VoiceOver (iOS Safari), TalkBack (Android Chrome) and NVDA (Chrome).
3. Focus is always visible, including on glass panels, and is never hidden behind the header or dock (2.4.11). `scroll-padding` is set from their heights.
4. "Skip intro" and "Skip to booking" are the first two tab stops on the homepage.
5. The date picker follows the APG grid pattern: arrow keys, PageUp/PageDown, Home/End. A polite live region announces the selected range and the total. Day cells are at least 44px on mobile.
6. No interaction requires dragging (2.5.7). Carousels, the top-5 tabs and the price filter all have buttons.
7. Forms have visible labels and `autocomplete` on name, phone and email. Errors appear as text next to the field and in an error summary. No CAPTCHA puzzles (use a honeypot and rate limits instead). Nothing times out while someone is filling in a form.
8. Text over imagery reaches 4.5:1 at the worst sampled pixel, using `--scrim-text`.
9. The canvas is `aria-hidden`, and every callout spec also exists in the DOM `spec-list`. Alt text is a required CMS field for every car image. Decorative scene images use `alt=""`.
10. Pages reflow at 320px and 400% zoom with no horizontal scroll. A text-spacing override (1.4.12) doesn't clip the Syncopate headlines.
11. With `prefers-reduced-motion: reduce`, there is no pinning, scrubbing, parallax, Lenis smooth scroll or Flip transition, and every chapter renders in its final state. In the prototype this shortened the page from about 8,800px to 4,550px. The top-5 tabs never auto-rotate, video never autoplays (poster and a play button instead), and the tunnel becomes a static image.
12. A **Pause motion** control in the chapter rail stops all ambient animation (gold dust, light streaks, headlight glow) and is remembered for each visitor. WCAG 2.2.2 requires it, because that motion runs for more than 5 seconds without any input.
13. `prefers-reduced-transparency` switches glass panels to solid. `prefers-contrast: more` raises muted text to the foreground colour. `Save-Data` and low-tier devices get static images.
14. On a mid-range Android profile in Lighthouse: LCP 2.5 s or less, CLS under 0.1, INP under 200 ms, and the booking UI hydrated within 2.5 s.

## 6.8 Tasks, risks and open questions

| ID | Task | Days | Depends on | Phase |
|---|---|---|---|---|
| UX-01 | Rewrite MASTER §2, §8 and §9 for image-based cars; add the new tokens | 1 | Visual technique | MVP |
| UX-02 | Six page override files | 1.5 | UX-01 | MVP |
| UX-03 | RTL rules and logical-property lint config | 0.5 | none | MVP |
| UX-04 | URL map, route skeleton, nav and footer, hreflang, schema map | 0.5 | none | MVP |
| UX-05 | Mobile-first wireframes for every MVP page and booking step | 4 | UX-04 | MVP |
| UX-06 | Form component specs (6.5) | 2.5 | UX-01 | MVP |
| UX-07 | Booking flow spec: states, out-of-hours, WhatsApp templates, ops email, analytics event names | 1.5 | Booking rules | MVP |
| UX-08 | Catalogue of empty, error and loading states; badge system | 1 | UX-06 | MVP |
| UX-09 | Sanity content model: car, brand, category, siteSettings, offer, image slots, callouts | 1 | Visual technique | MVP |
| UX-10 | Fleet, brand and category copy | 2.5 | Fleet and pricing | MVP |
| UX-11 | Page copy, FAQ, microcopy, SEO metadata | 3 | UX-07, UX-10 | MVP |
| UX-12 | Five placeholder legal drafts, flagged | 1.5 | Booking rules | MVP |
| UX-13 | Logo, SVG pack, favicon and OG | 3 | Q1 | MVP |
| UX-14 | Audit against 6.7 | 2 | Staging | MVP |
| UX-15 | Tap-count and usability check with 5 people on their own phones | 1 | Staging | MVP |
| UX-16 | Arabic: RTL QA of every template, Arabic copy review | 4 | Translator, UX-03 | P2 |
| UX-17 | Category and delivery-area landing pages | 3 | Keyword set | P2 |
| UX-18 | Offers page and Offer badge; opt-in WhatsApp reminder | 2.5 | WhatsApp Business | P2 |
| UX-19 | Live deposit payment UX | 2 | Gateway decision | P2 |
| UX-20 | Reviews section, once there are 10+ verified reviews | 1 | Review source | P2 |
| UX-21 | Customer account, booking history, car comparison | 4.5 | Auth, booking backend | P3 |
| UX-22 | Art direction for a real photo shoot to replace the AI images | 2 | Budget | P3 |

MVP total is 27.5 ideal days. UX-03, UX-04 and UX-13 can start today. UX-01 is on the critical path because it waits on the visual technique.

**Risks**
- **AI images may misrepresent the actual car** (colour, trim, wheels), which invites consumer complaints. Mitigation: the client approves each image, car pages carry an "Illustrative image" note, and real photos replace them in Phase 3.
- **Trademarks.** Naming brands in text to describe rentals is fine. Manufacturer logos, "official" wording and logo shapes that echo theirs are not.
- **Prototype claims become promises**: Salik included, 15-minute confirmation, rooftop handover. Each needs ops sign-off or removal.
- **No availability system.** Two people can request the same car. "Request" wording, CMS blackouts and the ops reply are the only safeguards until a booking backend exists.
- **WhatsApp drop-off.** Mitigated by storing the request and emailing ops before the handoff.
- **Cinematic weight versus the 2.5 s target** on mid-range Android. Mitigated by loading the dock first and scenes when the browser is idle, and by defaulting to the static tier when `Save-Data` is on.
- **Placeholder legal text gets published** if the client's documents arrive after launch.
- **Arabic retrofit cost** if logical CSS and message files are skipped now.

**Open questions for Zubair**
1. Should the wordmark say "Luxuryrentals" (the trade name) or "LuxuryRental.ae" (the domain, used in the prototype)? Default: the trade name, with the domain set beneath it. Do you own luxuryrentals.ae, so it can redirect?
2. What are the real WhatsApp number and staffed hours, and who handles requests between 23:00 and 09:00?
3. Can customers collect cars from the DSO office, or is it delivery only?
4. Do we keep or drop each of these: Salik included, 15-minute replies, DXB T3 handover, out-of-hours delivery?
5. Is the deposit a card pre-authorisation at handover (assumed), or taken online beforehand?
6. What is the minimum driver age per category? (Assumed: 21+, and 25+ for supercars.)
7. Can we show VAT-inclusive prices everywhere? (Assumed. UAE rules require consumer prices to include VAT.)
8. Please send the real terms, privacy policy and rental agreement.
9. What are the social handles, who should receive booking-request emails, and what reply time do you commit to?
