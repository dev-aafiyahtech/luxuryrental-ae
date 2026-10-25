# Frontend guide (demo phase)

How the LuxuryRental.ae front end is built. Read this before changing code. The first objective is a **working demo**: every page and flow runs in the browser, with bookings and payments simulated. Backend and production work come later (plan §3).

## Run it

```bash
npm install
npm run dev            # http://localhost:3000
npx tsc --noEmit       # typecheck
npx next typegen       # regenerate PageProps / LayoutProps after adding routes
node qa/scripts/snap.mjs /cars /tmp/cars.png mobile full   # screenshot + console errors + overflow check
```

During parallel work there is **one shared dev server on port 3000**. Do not start a second one or kill it. If `curl -s localhost:3000` fails, restart it in the background with `npx next dev -p 3000`.

## Stack

Next.js 16.4 (App Router, Turbopack, **Cache Components on**), React 19.3, TypeScript, Tailwind CSS 4, three 0.186, GSAP 3.15 (ScrollTrigger), Lenis 1.3, lucide-react icons, zod. This Next.js differs from older versions: when unsure, read `node_modules/next/dist/docs/`.

### Next 16 rules that bite

- **Cache Components:** a Server Component must not call `new Date()`, `Date.now()`, `Math.random()` or `crypto.randomUUID()` during prerender, because the build fails. Get today's Dubai date from `await getToday()` (`src/lib/server-time.ts`) and pass it down. Client Components may use the clock.
- `params` and `searchParams` are Promises. Every dynamic segment needs `generateStaticParams` listing all values (the data is local, so this is easy).
- A Client Component that calls `useSearchParams()` must sit inside `<Suspense>` with a sensible fallback.
- Pages and layouts get the global `PageProps<'/[lang]/cars/[brand]'>` / `LayoutProps` types. Run `npx next typegen` after adding a route.
- With Cache Components, navigating away keeps the previous route mounted but hidden (React `<Activity>`), so effects are cleaned up and re-run. Effects must clean up fully (WebGL contexts, GSAP/ScrollTrigger, Lenis, listeners).
- Middleware is now `src/proxy.ts`. It rewrites unprefixed URLs to `/en/...`.

## Locale routing and strings

- Every page lives under `src/app/[lang]/`. English URLs have no prefix (`/cars`); Arabic is `/ar/cars`, right to left. How Arabic works (locale helpers, data overlays, terms, RTL rules): `docs/dev/ARABIC-GUIDE.md`.
- Build links with `const href = await getHref()` (Server) or `const href = useHref()` (Client). Never hard-code `/en`.
- UI strings: `const t = await getT("namespace")` (Server) or `const t = useT("namespace")` (Client), from `src/messages/{en,ar}/<namespace>.json`. Add every new key to both files; `node qa/scripts/i18n-keys.mjs` checks they match. Pass the locale to the format helpers (`formatAED(n, locale)`, `formatDay(iso, locale)`). Each workstream owns one namespace file. Page body copy can live in `src/content/` modules instead, because it will move to the CMS.
- **Logical CSS only:** `ms-* me-* ps-* pe-* start-* end-* text-start text-end`, `margin-inline`, `inset-inline`. Never `ml/mr/pl/pr/left/right/text-left/text-right`. Flip directional icons with `rtl:-scale-x-100`. Never mirror car images.

## Design system

Source of truth: `docs/design-system/luxuryrental-ae/MASTER.md`. Dark only: Sea Moss `#2C5252` background, Antique Gold `#EBDAB0` for calls to action, Alabaster `#F4EADE` for type. Syncopate for headlines (uppercase), Montserrat for body. Never hard-code hex colours in components; use the tokens.

- Tokens are Tailwind theme colours: `bg card elevated fg muted accent accent-hover on-accent ring line input danger success warning info ice champagne amber` (e.g. `bg-card text-muted border-line`).
- Component classes in `src/app/globals.css`: `.btn .btn-primary .btn-secondary .btn-ghost .btn-sm .btn-block`, `.card .card-hover .glass`, `.field .input .field-hint .field-error`, `.eyebrow .display .display-md .display-sm .lede .fine .label .tabular`, `.spec-list .trust .badge .notice`, `.container-site .container-narrow .prose-legal`.
- React pieces: `src/components/ui` (ButtonLink, Button, Breadcrumbs, Badge, Notice, Eyebrow, PageHeader), `src/components/car` (CarArt, CarCard, PriceFrom, SpecList, specRows, headlineSpecs, callouts).
- Gold buttons always have dark text. Touch targets are at least 44 px. Labels are always visible above fields. Use Lucide icons only (plus the WhatsApp glyph) and no emojis. Use `.glass` only for booking panels and the nav.
- Motion: 150–300 ms micro-interactions; respect `prefers-reduced-motion` (no scrub, pin, parallax or smooth scroll; show final states).
- Do **not** edit `globals.css` during parallel work. Use Tailwind classes in your components; if something must be global, ask the lead.

## Data and logic (read-only for workstreams)

| Module | What |
|--------|------|
| `src/content/cars.ts` | 16 cars: specs, rates (standard + approved peak), tier, body style, hero rank. Helpers: `getCar`, `getCarByPath`, `carsByBrand`, `carsInCategory`, `chauffeurCars`, `heroCars`, `carPath` |
| `src/content/brands.ts` | 8 brands, 5 categories (`getBrand`, `getCategory`) |
| `src/content/zones.ts` | Delivery zones and fees |
| `src/content/rules.ts` | Booking rules, tiers (age, excess, Full Cover), chauffeur rules, ladder, seasons, offers, cancellation summary |
| `src/content/site.ts` | Business details, WhatsApp +971 52 965 2722, placeholders, `demo: true` |
| `src/content/copy.ts` | Car and brand marketing copy (filled by the content workstream) |
| `src/lib/pricing.ts` | `quote(input)` (the only way to price anything), `fromPrice`, `lowestFrom`, `minDaysFor`, `seasonalDaily` |
| `src/lib/booking/draft.ts` | `useTripDraft()` shared trip draft (car, dates, handover, extras, driver), `updateDraft`, `resetDraft`, `useBookings`, `useBooking` |
| `src/lib/booking/store.ts` | **Simulated backend** in localStorage: `submitBookingRequest`, `updateBookingStatus`, `recordDemoPayment`, `getBooking`, `listBookings`, `resetDemoBookings`; rental agreement and vehicle checks: `agreementFor`, `signAgreement`, `recordConditionReport`, `signConditionReport` |
| `src/lib/booking/availability.ts` | **Simulated** car availability: ops blocks (`addBlock`, `removeBlock`, seeded samples), `busyRanges`, `clashIn`, `nextFreeStart`, hooks `useBlocks`, `useAvailability(carSlug)` |
| `src/content/localize.ts`, `src/content/ar/data.ts` | Arabic overlays for data text: `localizeCar(s)`, `localizeCategory`, `localizeZone(s)`, `localizeOffer`, `seasonName`, `tierName`, `siteFor`; `copyFor(locale)` in `copy.ts` |
| `src/lib/customer/store.ts` | **Simulated** accounts and documents: one-time-code sign-in (`requestSignInCode`, `verifySignInCode`, `useAccount`), profile, document consent, uploads (metadata only, files never stored), ops review, `requiredDocuments`, `documentProgress` |
| `src/content/car-media.ts` | Car image paths, generated by `node tools/ingest-car-images.mjs <folder>`; `imageStatus(car)` drives the AI-image labels |
| `src/lib/whatsapp.ts` | `whatsappHref(text)`, `bookingMessage(record)`, `draftMessage(trip, carName)` |
| `src/lib/dates.ts`, `format.ts` | Dubai-time date strings, `formatAED`, `formatRange`, `formatDay`, DD/MM/YYYY |

If you need a change in one of these, keep it minimal and additive, and say so in your report.

## Content rules (plan D-08, D-09, D-21, D-22)

- Say **"request"**, never "booked" or "reserved", until ops confirm. Nothing is charged on the live site. In the demo, the mock payment page shows a clear "Demo, no charge" banner and collects **no card fields**.
- No fake reviews, ratings, customer counts, founding years or AI "team" photos.
- Don't claim "Salik included" (Salik is charged per crossing + AED 1), "confirm within 15 minutes", rooftop handover or DXB T3 valet. Use `site.replyPromise`.
- Brand names as text only: no manufacturer logos.
- Prices are AED including 5% VAT. The deposit is a refundable card hold shown separately.
- Car images are AI illustrations until photos of the real cars arrive; label them.

## Known gaps (demo phase)

- **CSS modules** return no class names with the current Turbopack + Tailwind loader rule in `next.config.ts`; use Tailwind classes (or fix the rule before relying on modules).
- All content values (company details, rules, fees, zones, car trim) are assumptions for the demo, listed in `docs/brief/assumptions.md`. Company details show as samples while `site.sampleDetails` is true.
- Dynamic pages read `params` inside `<Suspense>` (Next 16.4 instant navigation), so an unknown slug (e.g. `/cars/nope`) renders the 404 page with `noindex` but an HTTP 200. Fix with the backend work. URLs that match no route at all get a real 404 from `src/app/[lang]/[...missing]`.
- The Dock and the car page's mobile bar render into `<body>` after hydration (portals), so they aren't in the server HTML.
- Booking steps need JavaScript (no Server Actions yet); without it they show a placeholder.
- The homepage particle cars are sampled from each car's side image (`node tools/sample-car-particles.mjs <slug>` after replacing an image). Plan §3.1's photo dissolve and the morph to the front three-quarter image are not built yet.
- The Arabic is a demo translation: a translator should review it, and a UAE lawyer the legal pages (`docs/dev/ARABIC-GUIDE.md`).

## Ownership during parallel work

| Workstream | Owns |
|-----------|------|
| Lead | `src/content/*` (except `copy.ts`), `src/lib/*`, `src/i18n/*`, `src/components/{ui,layout,car}`, `src/app/[lang]/layout.tsx`, `src/app/globals.css`, `src/proxy.ts`, config files |
| Home | `src/app/[lang]/page.tsx`, `src/components/home/**`, `src/scene/**` (keep `profiles` and `smoothPath` exports stable), `src/messages/en/home.json` |
| Fleet and car pages | `src/app/[lang]/cars/**`, `src/components/fleet/**`, `src/messages/en/fleet.json` |
| Booking flow | `src/app/[lang]/{book,booking,pay,demo}/**`, `src/components/booking/**` (keep the `ReserveCard` and `Dock` props stable), `src/messages/en/booking.json` |
| Content pages | `src/app/[lang]/{chauffeur,delivery,pricing,requirements,about,faq,contact,legal}/**`, `src/components/content/**`, `src/content/copy.ts`, `src/content/pages/**` |
| Brand | `src/components/brand/**`, `public/brand/**`, `src/app/[lang]/icon.svg`, `src/app/[lang]/apple-icon.png`, `docs/brand/**` |

Don't edit files you don't own. Don't commit, and don't `npm install` into the repo.
