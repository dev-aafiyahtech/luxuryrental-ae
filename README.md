# LuxuryRentals.ae

The world's most beautiful, futuristic luxury car rental website for **Luxuryrentals**, Dubai Silicon Oasis, Dubai.

**Status (25 Oct 2026):** plan approved ([docs/plan/PROJECT-PLAN.md](docs/plan/PROJECT-PLAN.md)). The **front-end demo** is complete in English and Arabic (`/ar`, right to left): every page and the full booking flow run in the browser, with bookings, availability, the ops team, payments, accounts, documents and e-signatures simulated, and the AI car images in place. Backend and production (Vercel, CMS, database, payment gateway) come next.

## Direction

One continuous scroll story in four chapters, built from three themes:

| # | Chapter | Theme |
|---|---------|-------|
| 01 | Skyline | **Burj by Night**: the camera descends through Dubai at night onto a rooftop helipad where the car forms from gold dust |
| 02 | Fleet | **Velocity Tunnel**: a warp tunnel carries the visitor past the three fleet categories |
| 03 | Sculpture | **Kinetic Sculpture**: the featured car comes apart into floating components with spec callouts |
| 04 | Reserve | The car reassembles, its headlights ignite, it launches into the tunnel and the reservation card rises |

Sea Moss `#2C5252`, Antique Gold `#EBDAB0` and Alabaster `#F4EADE` (changed from black and gold on 23 Oct 2026), Syncopate + Montserrat, dark only. Full spec: [docs/design-system/luxuryrental-ae/MASTER.md](docs/design-system/luxuryrental-ae/MASTER.md).

## Run the demo

**Live demo:** https://luxuryrental-ae.vercel.app (Vercel, deploys from `main`; English at `/`, Arabic at `/ar`).

Needs Node.js 20.9 or later (Vercel builds with Node 24, pinned in `package.json`; older versions only print an engine warning).

```bash
npm install
npm run dev        # then open http://localhost:3000
```

Checks: `npx tsc --noEmit`, `npx eslint src`, `npx next build`, `node qa/scripts/i18n-keys.mjs` (Arabic strings match the English keys), and with the dev server running `node qa/scripts/audit.mjs` (every English and Arabic route at 390 and 1440 px). How the code is organised and the rules for changing it: [docs/dev/FRONTEND-GUIDE.md](docs/dev/FRONTEND-GUIDE.md).

**What's simulated.** Booking requests, ops actions, payments, accounts, document uploads and e-signatures are stored in the browser (`src/lib/booking/store.ts`, `src/lib/customer/store.ts`), so everything works without a server, but each browser has its own data. Uploaded files are never stored or sent: only their name and size are kept. Every page shows a demo bar. The WhatsApp buttons open a real chat with +971 52 965 2722. Car pictures are AI-generated illustrations, labelled as such, until photos of the real cars arrive.

**Demo walk-through**
1. Home: scroll the four chapters (night skyline, Velocity Tunnel, Kinetic Sculpture with the top-5 tabs, Reserve). "Pause motion" sits in the chapter rail.
2. Fleet (`/cars`): filter by type, price or chauffeur; open a brand or a car.
3. Car page: pick "This weekend" in the reserve card, then **Reserve**. The request takes four steps (trip, extras, driver, review), then **Send booking request**.
4. Confirmation: reference number, **Confirm on WhatsApp**, add to calendar, **Track this request**.
5. Open **Ops view** (top bar) in a second tab and press **Confirm**. The customer's status page updates live.
6. On the status page, **Pay advance (demo)**: try a failed, then a successful demo payment. No card details are collected.
7. Before the rental: on the status page, upload the driver's documents, then open the **rental agreement** and sign it with a finger, mouse or typed name.
8. In the ops view, verify or reject the documents and **record the handover check** (km, fuel, damage marks on the car diagram). Back on the agreement page, the customer signs the vehicle check.
9. **Your account** (person icon in the header): sign in with the one-time code shown on screen to see every request, document and agreement in one place, and edit the driver profile.
10. Availability: the Revuelto is in for service and the Phantom is out for an event on sample dates; their calendars cross those days out, and a clashing request offers the next free dates. In the ops view, **Car availability** blocks or frees any car.
11. Arabic: the **العربية** switch in the header (or `/ar`) shows the same site right to left, with Arabic dates, prices and plurals.
12. Also try: the Phantom (chauffeur first), a Bugatti (price on request), `/book/review?fail=1` (send error and retry), the dock's "Edit trip" on a phone, and sharing a car page link (each car has its own preview image).

## View the prototype

The original concept prototype is still in `prototype/`: open `prototype/index.html` in a browser. It needs an internet connection to load Three.js, GSAP, Lenis and Google Fonts from their CDNs.

The hosted version is a private Claude artifact: https://claude.ai/artifact/A9w1rnorC61uzhPxaMGs6f

The car, prices, specs and availability are samples. The booking form validates dates and updates the reservation total, but does not take bookings.

## Repository map

```
README.md
docs/
  thread/THREAD.md                     Full project conversation, start to now
  concepts/themes.md                   All 20 themes, the shortlist and the final direction
  concepts/concept-art-tools.md        Tools for concept art
  tech/production-stack.md             Production stack and build rules
  design-system/luxuryrental-ae/
    MASTER.md                          Design system: source of truth for every page
  brief/requirements-checklist.md      What the client needs to supply
  brief/requirements-answers.md        The client's answers (23 Oct 2026)
  brief/plan-answers.md                Zubair's answers to the plan's first questions (23 Oct 2026)
  brief/assumptions.md                 Every value assumed for the demo, to confirm later (24 Oct 2026)
  brief/car-image-brief.md             The 58 AI car images the site needs: views, colours, prompt, file names
  plan/PROJECT-PLAN.md                 Project plan: scope, decisions, timeline, budget, launch checklist
  plan/workstreams/                    The 7 specialist sections behind the plan (architecture, Vercel,
                                       car visuals, fleet and pricing, booking rules, UX, SEO)
src/
  app/[lang]/                          All pages (English at /, Arabic at /ar)
  components/                          UI, layout, car, booking, fleet, home, content, brand
  content/                             Fleet, brands, zones, rules, site settings, copy (future CMS data)
  lib/                                 Pricing engine, dates, simulated booking store, WhatsApp links
  scene/                               WebGL homepage: skyline, tunnel, particle car per body style
  messages/en/                         UI strings per feature
public/brand/                          Logo pack and icons
docs/dev/FRONTEND-GUIDE.md             How the front end is built; rules for changes
docs/brand/logo.md                     Logo usage sheet (source in docs/brand/source/)
docs/ops/vercel-settings.md            Vercel project settings that live outside the code
vercel.json                            Vercel config: Next.js, functions in fra1 (Frankfurt)
prototype/
  index.html                           Standalone prototype; open in a browser
  artifact-source.html                 The same page as published to Claude (no html/head/body wrapper)
qa/
  README.md                            What was tested and what was fixed afterwards
  screenshots/                         Desktop, mobile and reduced-motion renders
  scripts/audit.mjs                    Every route at 390 and 1440 px: status, console errors, overflow, H1
  scripts/snap.mjs                     Screenshot one page of the running dev server
  scripts/shoot.mjs                    Playwright render script (prototype)
  scripts/contrast.py                  WCAG contrast check for the palette
tools/
  ui-ux-pro-max.md                     Skill used to generate the design system, with commands
  ingest-car-images.mjs                Imports car images: `node tools/ingest-car-images.mjs <folder>`
```

## Decisions log

| Date | Decision |
|------|----------|
| 22 Oct 2026 | 20 themes proposed; shortlisted Burj by Night, Velocity Tunnel, Silent Thunder, Kinetic Sculpture |
| 22 Oct 2026 | Production approach: custom Next.js + React Three Fiber + GSAP, Sanity CMS, Vercel |
| 22 Oct 2026 | Design system generated with UI/UX Pro Max, adapted to dark mode and contrast-checked |
| 22 Oct 2026 | Silent Thunder removed; the finale becomes Kinetic Sculpture reassembly + Velocity Tunnel launch |
| 23 Oct 2026 | First prototype published; direction approved by Zubair |
| 23 Oct 2026 | Client answers captured: 16 cars from 8 brands, pick a top 5, estimate pricing, WhatsApp bookings, no 3D budget (use AI images), simulate payments, English first with Arabic planned |
| 23 Oct 2026 | Repo moved to GitHub (`dev-aafiyahtech/luxuryrental-ae`); Vercel confirmed for production |
| 23 Oct 2026 | Project plan v1 drafted: image-sampled particle cars instead of 3D, booking requests handed to WhatsApp, Vercel Pro + Sanity + Neon (Frankfurt), launch 26 Nov, cinematic 17 Dec. Awaiting Zubair's approval and the answers in plan §9 |
| 23 Oct 2026 | Plan answers: wordmark "LuxuryRentals.ae"; AI images for all 16 cars; Bugatti partner confirmed; top 5 and launch prices approved; WhatsApp +971 52 965 2722; Zubair owns Vercel; DNS access later. Zubair is reviewing the plan |
| 23 Oct 2026 | Plan approved. First objective: a front-end-only working demo with every flow simulated; backend and production later |
| 23 Oct 2026 | Front-end demo built: Next.js 16.4, cinematic homepage ported from the prototype, 16 car pages, booking flow with simulated ops desk and payment, content and draft legal pages, logo "Corner" (LR. monogram, gold .ae) |
| 23 Oct 2026 | Palette changed from black and gold to Sea Moss `#2C5252` (background and brand), Antique Gold `#EBDAB0` (calls to action) and Alabaster `#F4EADE` (type). Tokens, components, the WebGL night scene and the whole logo pack recoloured; every text pair re-checked for contrast |
| 24 Oct 2026 | Demo completed with assumed content (Zubair: don't wait for approvals): sample company details, estimated rules, Salik and Darb tariffs, zone and chauffeur fees, and each car's year, colours, wheels and equipment. Listed in docs/brief/assumptions.md |
| 24 Oct 2026 | Customer documents, e-signed rental agreement, vehicle checks and customer accounts simulated in the browser |
| 24 Oct 2026 | AI images for all 16 cars received (Google Drive) and imported: hero, side, card, interior and extra views, labelled "Illustrative AI image" |
| 25 Oct 2026 | Demo completed in Arabic (`/ar`, right to left, demo translation to be reviewed), with simulated car availability (no double bookings), per-car share images and particle cars sampled from the AI images on the homepage |
| 25 Oct 2026 | Logo accent (".ae" and the monogram square) deepened to Burnished Gold `#D6AE4F` so it stands apart from the Alabaster letters; buttons stay Antique Gold. Demo branch merged into `main` |
| 26 Oct 2026 | Brand corrected to **LuxuryRentals.ae** (Zubair): wordmark redrawn with the S, domain and emails now luxuryrentals.ae. The desktop text menu now starts at 1280 px so the logo keeps its full size on smaller laptops |

## Open items

- **Arabic review:** the Arabic is a demo translation; a translator should review it, and a UAE lawyer the legal pages. Terms and rules: [docs/dev/ARABIC-GUIDE.md](docs/dev/ARABIC-GUIDE.md).
- **Real car photos:** the AI images stand in until photos of the actual cars arrive (`node tools/ingest-car-images.mjs <folder>` imports a new set).
- **Assumed content to confirm:** company details (shown as samples), booking rules and fees, Salik and Darb, delivery zones, chauffeur rules, and each car's model year, colours, wheels and equipment. All are listed in [docs/brief/assumptions.md](docs/brief/assumptions.md), with the file each one lives in. The real legal documents and the UAE lawyer review are still needed before launch.
- **Logo questions:** minimum size (180 px recommended), the OG tagline "Delivered across Dubai", who designs the Arabic lockup. See [docs/brand/logo.md](docs/brand/logo.md).

## Owner

Zubair, Adz Tech Solutions: approver and operations contact.
