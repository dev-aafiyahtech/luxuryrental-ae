# 1. Technical architecture

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **Software Architect** agent. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - Sanity Studio is hosted at `luxuryrentals.sanity.studio`, not embedded at `/studio` (D-04).
> - URLs follow D-14: `/cars/{brand}/{model}`, `/cars/{brand}`, `/book/*`, `/legal/*`. They replace `/cars/[slug]`, `/brands/[slug]`, `/reserve` and `/policies/[slug]` used below.
> - Particle budgets (10k desktop, 3k phones), the ±10° camera limit and colour-by-component come from [03 Car visuals](03-car-visuals.md).
> - Rate ladder and categories come from [04 Fleet and pricing](04-fleet-pricing.md). Launch publishes the peak rate card; seasonal automation stays in Phase 2.
> - Data retention follows [05 §5](05-booking-rules-compliance.md#5-data-handling-plan-for-booking-requests).

**Status:** Proposed, 23 Oct 2026 · **Scope:** production build of luxuryrental.ae on Vercel · **Inputs:** `docs/brief/requirements-answers.md` (binding), `docs/tech/production-stack.md`, `docs/design-system/luxuryrental-ae/MASTER.md`, `prototype/index.html`.

This section replaces the glTF/Blender parts of `production-stack.md`. Every car visual comes from AI-generated images (transparent cutouts, depth maps, part masks). The skyline and tunnel stay procedural WebGL.

## 1.0 Architecture at a glance

One **modular monolith**: a single Next.js app in this repo, deployed to Vercel. No microservices and no event bus, because the team is small, there are 16 cars, and there is one operator. The booking, pricing and payments core uses a light ports-and-adapters design, because that core has real rules and two adapters that will be swapped (payment gateway, WhatsApp link to WhatsApp API). Content pages are plain server components that run a GROQ query and render, without extra layers.

```
Visitor ──HTTPS──▶ Vercel CDN ── static pages (prerendered, tag-revalidated)
   │                   └─ Next.js functions (fra1): /reserve quote, /api/bookings, webhooks, cron
   │                          ├─▶ Neon Postgres (aws-eu-central-1): bookings, payments, audit events
   │                          ├─▶ Sanity Content Lake (cached reads)   ├─▶ Resend (ops + customer email)
   │                          └─▶ PaymentProvider port: Mock now → Stripe / Checkout.com / N-Genius
   ├─ Browser: lazy WebGL stage (images from cdn.sanity.io) · wa.me deep link → WhatsApp
Editors ──▶ /studio (Sanity) ──publish──▶ GROQ webhook ──▶ /api/revalidate ──▶ revalidateTag
Ops (Zubair) ◀── email with signed one-click actions + WhatsApp chat (booking ref in message)
```

| ADR | Decision | One-line rationale |
|-----|----------|--------------------|
| 001 | Vercel **Pro** from day one | Hobby is "personal, non-commercial use" only; Pro is $20/month per deploying seat |
| 002 | Next.js 16 App Router + Cache Components, a single app | Static CDN pages with on-demand tag revalidation, plus server code for bookings, in one deploy |
| 003 | Sanity (free plan) for content, embedded at `/studio` | Best image pipeline (hotspot, CDN transforms, LQIP, CORS for canvas sampling); free tier covers 16 cars many times over |
| 004 | Neon Postgres via Vercel Marketplace for bookings | Transactional data and PII stay out of a public CMS dataset; standard Postgres can move to a UAE host later |
| 005 | Booking = request → ops confirms → pay; WhatsApp is the confirmation channel | Matches how the business works today; there is no live inventory to promise instant booking against |
| 006 | `PaymentProvider` port with a MockProvider | Gateway decided last; the webhook path runs end-to-end now |
| 007 | One pure-TypeScript pricing module, server-authoritative | The same code gives instant client previews and the stored server quote, so they cannot drift |
| 008 | next-intl, `localePrefix: 'as-needed'`, logical CSS only | Clean English URLs with no redirect on `/`; Arabic becomes a content task, not a refactor |
| 009 | R3F stage, image-sampled particle car, 3 device tiers, behind a flag | Fleet changes are content uploads, not 3D work; launch is never blocked by WebGL |
| 010 | BotID Basic + Vercel Firewall rate limit + DB throttle | All included in Pro; no extra vendor or visible CAPTCHA |

## 1.1 Framework and versions

**Decision:** pin the versions below, checked against the npm registry on 23 Oct 2026. Renovate runs weekly and adopts a new minor only after 14 days. **Verify again at kickoff.**

| Package | Pin | Note |
|---------|-----|------|
| Node.js | 24 LTS | Next 16 needs ≥ 20.9 |
| `next` | 16.4.x (16.4.2, 15 Oct 2026) | App Router, Cache Components (`'use cache'`, `cacheTag`), Turbopack, `proxy.ts` (replaces `middleware.ts`) |
| `react`, `react-dom` | 19.3.x | React Compiler enabled (`reactCompiler: true`) |
| `typescript` | 6.0.x | typescript-eslint 8.72 supports `<6.1`; TS 7 (native) only once lint tooling supports it |
| `three` | 0.186.x | `WebGLRenderer`. WebGPU/TSL rejected for now: weaker mobile coverage, and the prototype GLSL ports directly |
| `@react-three/fiber` / `@react-three/drei` | 9.8.x / 10.7.x | Avoid the v10 / v11 alphas. Use drei only for `PerformanceMonitor`, `AdaptiveDpr`, `useTexture` |
| `gsap` + `@gsap/react` | 3.15.x / 2.1.x | All plugins free for commercial use (ScrollTrigger, Flip); no Club licence needed |
| `lenis` | 1.3.x | Fine pointer only, as in the prototype; avoid the 2.0 dev line |
| `next-intl` | 4.14.x | |
| `sanity` / `next-sanity` | 6.x (track the `stable` dist-tag) / 13.3.x | |
| `tailwindcss` | 4.3.x | MASTER.md tokens as `@theme`; logical utilities (`ms-*`, `pe-*`, `start-*`) plus the `rtl:` variant |
| `drizzle-orm` + `@neondatabase/serverless` | 0.45.x / 1.2.x | Stay off the Drizzle 1.0 RC until GA |
| Others | `zod` 4, `resend` 6, `jose` 6, `botid` 1.5, `@vercel/firewall` 1.2, `@sentry/nextjs` 11, `libphonenumber-js` | |

## 1.2 Rendering strategy

**Decision:** enable `cacheComponents`. Public pages are prerendered and cached with `cacheLife('max')` plus a daily fallback. A Sanity GROQ webhook calls `/api/revalidate`, which checks the signature with `@sanity/webhook` and then runs `revalidateTag('type:<_type>')`. **Why:** content changes go live in seconds with no rebuild, and every visitor gets a CDN hit.

| Route (under `/[locale]`) | Strategy | Invalidated by |
|---------------------------|----------|----------------|
| `/` cinematic home | Static | `type:siteSettings`, `type:page`, `type:car`, `type:category`, `type:priceRate` |
| `/cars` fleet | Static; filters and per-date totals run client-side from URL params (Suspense island) | `type:car`, `type:brand`, `type:category`, `type:priceRate` |
| `/cars/[slug]` | `generateStaticParams` for all cars; a new slug renders on first hit, then is cached | same as above |
| `/brands/[slug]`, `/about`, `/faq`, `/contact`, `/policies/[slug]` | Static | `type:brand`, `type:page`, `type:faq`, `type:policy` |
| `/reserve?car&from&to&zone` | Static shell; the quote is computed server-side in a streamed Suspense boundary; `noindex` | Reads cached rates |
| `/booking/[ref]?t=` | Dynamic, `no-store`, `noindex`; needs a 128-bit access token (stored hashed) | Database |
| `/api/*`, cron | Node route handlers, pinned to `fra1`, next to Neon Frankfurt | — |
| `/studio` | Client-only Sanity Studio, `noindex`, its own CSP | — |

**Revalidation profiles:** `priceRate` and `siteSettings` use `revalidateTag(tag, { expire: 0 })`, so no stale price is ever served; everything else uses `'max'` (stale-while-revalidate). Tags are per document type because, at about 300 documents, coarse tags are always correct; per-document tags can come later if ever needed.

**SEO on the cinematic homepage.** The HTML carries the full story before any JavaScript runs: the H1 and all four chapters' copy, the five hero cars linking to all 16 car pages, the spec list that the 3D callouts duplicate (prototype `desktop-sr` pattern), and JSON-LD (`AutoRental` business, plus `Car` with `Offer` on car pages). The canvas is `aria-hidden` decoration, and no text exists only in WebGL.

**Booking UI interactive in under 2.5 s:**
1. The dock is a real `<form method="get" action="/cars">`, and the reserve card links to `/reserve`. Both work before hydration.
2. The initial client JS is only the dock, reserve card and header menu. GSAP, Lenis and three.js load after `load` plus `requestIdleCallback` (2 s timeout). A lint rule bans importing them into shell components.
3. The LCP element is the H1 or a preloaded skyline poster (AVIF ≤ 80 KB on mobile). Fonts use `next/font` with fallback metrics adjusted.
4. Chapters are pinned with CSS `position: sticky` and reserved heights, as in the prototype, not GSAP pin spacers, so late JS never shifts the layout. No third-party scripts at MVP.

## 1.3 CMS: keep Sanity

**Decision:** confirmed, on Sanity Free (20 seats, 2 datasets, both public, 10k documents; usage stops at the limit rather than billing), with `production` and `development` datasets. **Why:** hotspot and crop, `cdn.sanity.io` transforms (`auto=format`, `w`, `rect`), `lqip` and `palette` metadata, and CORS-enabled assets that a Web Worker can sample. **Rules:** no PII ever goes into Sanity. Images go through a custom `next/image` loader pointing at the Sanity CDN, which skips Vercel Image Optimization, so it is free and unmetered on our side.

**Adding a car in minutes:** Fleet desk → "New car" template (prefilled with the category's default rate card) → pick the brand, enter specs, drop in the image set → publish → webhook → live in under 60 s. Validation blocks publishing if the cutout has no alpha (`metadata.hasAlpha`) or the depth map's size differs from the cutout's. Localised fields use a simple object, `localeString { en, ar }`, read in GROQ as `coalesce(name[$locale], name.en)`; the `ar` inputs stay hidden until Phase 3.

| Type | Fields |
|------|--------|
| **Car** | `name`, `slug`, `brand→`, `category→`, `rate→PriceRate`, `model`, `year`, `status` (active/coming-soon/hidden), `heroRank` (1–5), `featured`, `chauffeurOnly`, `minDays`, `minDriverAge`, `tagline`, `description` (blocks), `specs` {engine, `engineLayout` (V8/V12/W16/hybrid/EV, drives the procedural powertrain glyph), hp, torqueNm, zeroTo100, topSpeedKmh, transmission, drivetrain, seats, doors, luggage, colours}, `highlights[]` {text, `part`: body/cabin/wheels/powertrain/lights} (sculpture callouts), `views[]` (below), `cardImage` (16:10, with background), `gallery[]` {image, alt}, `poster` (optional low-tier still), `imagesIllustrative` (bool, shows "Images are illustrative"), `particle` {density, depthScale, tint} overrides, `seo` |
| `views[]` item (`carView`) | `angle` (side-l/r, front34-l/r, rear34-l/r, front, rear); `cutout` (RGBA, ≥ 2400 px long edge, ground line at the bottom); `depth` (16-bit greyscale, same pixel size, near = white); `partsMask` (indexed colours: body, glass, wheels, front lights, rear lights, trim); `shadow` (optional alpha); `anchors` {wheelF, wheelR, headlight} (normalised; derived from the mask if empty). Slot names are final once agreed with the visual-pipeline section. |
| **Brand** | `name`, `slug`, `wordmark` (text; logos only with permission), `country`, `description`, `order`, `seo` |
| **Category** | `name` (Supercar, Luxury SUV, Grand Tourer, Chauffeur), `slug`, `description`, `tunnelCopy` {eyebrow, heading, lede}, `representativeCar→` (fly-by cutout), `order`. "From" prices are computed, not stored. |
| **PriceRate** | `title`, `daily`, `weekly` (7-day total), `monthly` (30-day total), `deposit`, `kmPerDay`, `kmPerMonth`, `extraKmFee`, `chauffeurDaily` (10 h), `chauffeurHourly`, `chauffeurMinHours`, `seasonal[]` {from, to, multiplier, label} (Phase 2), `validFrom`. All amounts are AED, VAT-inclusive, whole dirhams. |
| **DeliveryZone** | `name`, `slug`, `kind` (branch/zone/airport), `areas[]`, `deliveryFee`, `collectionFee`, `freeFromDays`, `leadTimeHours`, `hours` {from, to}, `outOfHoursFee`, `geo`, `isDefault` (DSO branch, fee 0), `active`, `order` |
| **Policy** | `title`, `slug`, `kind` (rental-terms, cancellation, insurance, fuel-salik-fines, driver-requirements, privacy, cookies), `summary[]` (shown at quote), `body` (blocks), `version`, `effectiveDate` |
| **FAQ** | `question`, `answer` (blocks), `topic`, `relatedCars[]→`, `showOnHome`, `order` |
| **Page** | `title`, `slug`, `sections[]` (hero, richText, imageText, carGrid, faqList, ctaBand), `seo`. `home` adds `chapters[]` {key, eyebrow, heading, lede, cta}, `featuredCar→` (sculpture) and `heroCars[]→` (top 5). |
| **SiteSettings** (singleton) | `businessName` (Luxuryrentals), address (DSO, placeholder), phone, `whatsappE164`, `waTemplate` (tokens `{ref} {car} {dates} {zone} {total} {name}`), `opsEmails[]`, hours, socials, licence / RTA / TRN placeholders, `vatRate` (5), `minLeadHours`, `maxAdvanceDays`, `graceMinutes`, `addOns[]` {key, label, unit: day/rental, price}, `flags` {showArabic, paymentsDemo, stage}, `defaultSeo` |

## 1.4 Booking flow

**Decision:** every booking is a *request*. The site stores it, emails ops and hands the customer to WhatsApp with the reference prefilled. Ops confirm, then payment follows. **Why:** inventory and the conversation live on WhatsApp today, and promising instant booking without live availability would cause double bookings. The prototype's "We confirm within 15 minutes" line becomes an operational commitment, so it is listed as an open question.

**Flow** (dates plus car to Reserve in 3 taps or fewer):
1. Dock (zone, dates, type) → `/cars?from&to&zone`. Totals are previewed client-side.
2. Car → `/reserve`. The server computes the quote.
3. Details form: name, mobile (E.164 via `libphonenumber-js`), email, notes, a driver age and licence declaration, T&Cs consent and a separate unticked marketing opt-in.
4. `POST /api/bookings` checks the `Idempotency-Key` header, Origin, BotID, rate limit and zod validation, then **recomputes the quote** (a total that differs from the displayed one returns 409 with the new quote). It inserts the booking and a `booking_events` row in one transaction, sends email to ops and the customer inside `after()`, and returns `{ref, statusUrl, waUrl}`.
5. Success screen. The primary CTA is "Continue on WhatsApp": `https://wa.me/<digits>?text=<encoded>`, built **server-side** from the stored booking. Example: *"Hello Luxuryrentals, booking LR-7K3QZM: Lamborghini Urus, Fri 30 Oct 10:00 → Mon 2 Nov 10:00, delivery Dubai Marina, AED 9,450 incl. VAT."*
6. The ops email has customer `tel:` and `wa.me` links plus **signed action links** (Confirm, Decline, Mark paid offline, Cancel). Each is a single-use `jose` HS256 token {bookingId, action, nonce, exp 7d}, with the nonce recorded in `booking_events`. The GET only shows a confirmation page and the change happens on POST, because email scanners prefetch links.

**Status lifecycle** (the transition table lives in `domain/booking/status-machine.ts`, and every change writes `booking_events`):

```
requested ─confirm─▶ confirmed ─pay link─▶ awaiting_payment ─provider ok─▶ paid ─handover─▶ in_progress ─return─▶ completed
   ├─decline─▶ declined        │                └─fail─▶ payment_failed ─retry─┘
   └─24 h idle (cron)─▶ expired └─cancel (customer/ops, from confirmed..paid)─▶ cancelled ─▶ refund_pending ─▶ refunded
```

**Data lives in Neon Postgres** (Vercel Marketplace, Free plan: 0.5 GB, 100 CU-hours/month, scales to zero) in `aws-eu-central-1`, with functions in `fra1`. Neon has no Gulf region; Frankfurt is co-located with the functions and close to European tourists. Cold start is about 0.5 s on the first submit after idle, never on a page render. Each Preview deployment gets its own Neon branch. Tables (Drizzle):
- `bookings`: id, `ref` (LR- plus 6 Crockford base32 characters, unique), status, locale, car_id, car_name_snapshot, pickup_at / return_at (timestamptz, entered in Asia/Dubai), zones, address, chauffeur, `quote_snapshot` jsonb (lines plus pricing version), total_minor, deposit_minor, customer name / phone / email, consents, idempotency_key (unique), access_token_hash, ip_hash, timestamps, `pii_purged_at`
- `booking_events`, `payments`, `payment_events` (unique provider plus event_id), `notifications` (channel, attempts, last_error)

**Abuse controls**, all included in Pro, with no Redis and no visible CAPTCHA: BotID Basic (`initBotId` protects `/api/bookings`, `checkBotId()` on the server); a Vercel Firewall rate-limit rule called from code via `@vercel/firewall` `checkRateLimit('booking-submit')` (5 per 10 min per IP); a honeypot field; and a database throttle of at most 3 open requests per phone or email in 24 h.

## 1.5 Pricing and quote engine

**Decision:** `domain/pricing` is a pure function, `quote(input, rate, zones, settings) → Quote`, with no framework imports, working in integer fils. It runs in the browser for instant previews, and on the server for the quote shown on `/reserve` and the one stored at submit. **Why one module:** rates are public, so one module removes any risk of preview and server totals drifting apart.

| Rule | Behaviour |
|------|-----------|
| Duration | `days = max(car.minDays, ceil((returnAt − pickupAt − grace) / 24 h))`. All times are Asia/Dubai (UTC+4, no DST). Pickup must be ≥ now + `minLeadHours` (or the zone's lead time) and ≤ `maxAdvanceDays`. |
| Tiers | 1–6 days at `daily`; 7–27 at `weekly/7` per day; 28 or more at `monthly/30` per day. **Cliff cap:** the total never exceeds the next tier's minimum (6 days ≤ the 7-day price). |
| Km | Included = `kmPerDay × days` (monthly tier: `kmPerMonth` pro rata). `extraKmFee` is shown and charged after return, not quoted. |
| Deposit | `rate.deposit`. Shown separately, refundable, not part of the total, and not subject to VAT. Pre-authorised at handover (card holds expire in about 7 days). |
| Delivery | Pickup zone's `deliveryFee` plus return zone's `collectionFee`. Waived when `days ≥ freeFromDays`. `outOfHoursFee` when a time falls outside zone hours. DSO branch is 0. |
| Chauffeur | Add-on: `chauffeurDaily × days` (10 h blocks). For `chauffeurOnly` cars, `chauffeurHourly × max(hours, chauffeurMinHours)` replaces the day rate. |
| Add-ons | From `SiteSettings.addOns`, priced per day or per rental. |
| VAT 5%, inclusive | All CMS prices include VAT. `vat = round(total × 5 / 105)` is computed once on the total and shown as "includes VAT AED X". Salik, fuel and fines follow policy after the rental. |
| Output | `{days, tier, lines[], totalMinor, vatMinor, depositMinor, includedKm, extraKmFeeMinor, warnings[], pricingVersion}`. The version is a hash of the PriceRate and SiteSettings `_rev` values. |

**Tests:** table-driven cases from the pricing section, plus property tests (fast-check): totals never decrease as days increase, VAT equals 5/105 of the total within 1 fils, and the deposit is never included in the total.

## 1.6 Payment adapter

**Decision:** a port in `domain/payments`, adapters in `infrastructure/payments/*`, chosen by `PAYMENTS_PROVIDER`. **Why:** Stripe Checkout, Checkout.com Hosted Payments and Network International N-Genius all fit the same flow: create session → redirect → signed webhook.

```ts
interface PaymentProvider {
  id: 'mock' | 'stripe' | 'checkoutcom' | 'ngenius';
  createSession(i: { bookingId: string; kind: 'rental' | 'deposit_hold'; amountMinor: number; currency: 'AED';
    customer: { name: string; email: string }; returnUrl: string; cancelUrl: string; idempotencyKey: string }):
    Promise<{ sessionId: string; redirectUrl: string; expiresAt: Date }>;
  capture(paymentId: string, amountMinor?: number): Promise<void>;     // deposit holds
  void(paymentId: string): Promise<void>;
  refund(paymentId: string, amountMinor: number, reason: string): Promise<{ refundId: string }>;
  parseWebhook(req: Request): Promise<PaymentEvent>;                    // verifies signature or throws
}
type PaymentEvent = { provider: string; eventId: string; occurredAt: Date; bookingId: string;
  type: 'payment.authorized' | 'payment.succeeded' | 'payment.failed' | 'payment.canceled' | 'refund.succeeded';
  providerPaymentId: string; amountMinor: number; currency: 'AED' };
```

- **Webhook:** `POST /api/payments/webhook/[provider]` runs `parseWebhook`, inserts `payment_events` (a duplicate returns 200), then applies `applyPaymentEvent` to the state machine in one transaction and returns 200. Nothing else touches booking status.
- **MockProvider:** `/pay/mock/[session]` offers "Simulate success / failure", **collects no card fields**, and posts an HMAC-signed (`MOCK_WEBHOOK_SECRET`) event to the same webhook route.
- **Production behaviour while mocked:** the mock checkout is reachable only when `flags.paymentsDemo` is on, or on Preview deployments. Live customers see "Pay at handover or by secure link after confirmation", and ops use "Mark paid offline", so no customer thinks a simulated payment was real.

## 1.7 i18n and RTL

**Decision:** next-intl 4 with an `app/[locale]` segment and `proxy.ts`; `locales: ['en']` at launch (`'ar'` added in Phase 3), `localePrefix: 'as-needed'`, `localeDetection: false`. **Why:** `/` stays static English with no redirect, which protects LCP, and `/ar/...` arrives later with no route changes. `[locale]/layout.tsx` sets `<html lang dir>`; alternates and hreflang are generated from routing. UI strings live in `messages/{en,ar}.json`; content uses `localeString` and `localeBlock` fields.

**Rules from day one:**
- CSS logical properties and Tailwind logical utilities only. A lint rule bans `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left` / `text-right` and physical CSS properties. Directional icons flip with `rtl:-scale-x-100`.
- The WebGL stage reads `dir`: it mirrors the camera's `setViewOffset` x-offsets and flips the callout side, so the car always sits opposite the text column.
- Formatting goes through one `format.ts`: `Intl.NumberFormat('en-AE' | 'ar-AE-u-nu-latn', AED)` and `Intl.DateTimeFormat(…, { timeZone: 'Asia/Dubai' })`, with DD/MM/YYYY and Western digits (open question for Arabic).
- **Fonts** (`next/font/google`, self-hosted, defined in the locale layout so English pages never download Arabic fonts): EN uses Syncopate 700 (preloaded) and 400 with Montserrat variable (preloaded); AR uses Noto Kufi Arabic variable and Readex Pro variable. `:lang(ar)` resets `letter-spacing: 0` and `text-transform: none`, because tracking breaks Arabic joining.

## 1.8 WebGL architecture

**Decision:** a single fixed R3F `<Canvas frameloop="never">`, loaded with `next/dynamic` (`ssr: false`) and advanced from `gsap.ticker`, so Lenis, ScrollTrigger and the renderer share one rAF, exactly as in the prototype. ScrollTrigger writes chapter progress `c1..c4` into a mutable store with no React state, and components read it in `useFrame`. The prototype's ShaderMaterials port nearly verbatim; set `colorSpace = SRGBColorSpace` on cutout textures and check against `qa/screenshots`.

| Chapter | Active nodes | Car state (uniforms) | Tier B change | Tier C / reduced motion |
|---------|--------------|----------------------|---------------|-------------------------|
| 01 Skyline | SkyDome, Stars, InstancedTowers, Supertall, Beacons, Traffic, Ground, Helipad; CatmullRom camera descent | `uForm` 0→1: gold dust gathers into the particle car, then cross-fades to the photo cutout on landing | Towers 13×13, stars 420 | Skyline poster AVIF + cutout `<img>` on the pad |
| 02 Velocity Tunnel | Streaks (instanced), road floor; 3 category **cutout billboards** fly out with a streak-smear shader | Car is particles at speed | 600 streaks, no smear | CSS gradient streaks + category cards |
| 03 Kinetic Sculpture | Studio floor, ParticleCar, PowertrainGlyph, CalloutProjector (DOM) | `uExplode` separates parts by mask; `uMorph` side → front-3/4 view | Fewer particles; DOM spec list instead of callouts | Cutout + spec list |
| 04 Reserve | Reverse explode, Headlights (glow + beams at the lights-mask centroid), tunnel relaunch | `uExplode`→0, `uHead`→1, photo cross-fade | Beams off | Static hero + reserve card |

**Image-sampled particle car** (`scene/particles/`) replaces the prototype's hand-built `buildCar()`:
1. **Sampling** happens in a Web Worker (`fetch` → `createImageBitmap` → `OffscreenCanvas.getImageData`) over each view's cutout (`?w=640&fm=webp`), depth map (`?w=320`) and parts mask. Importance sampling weights each pixel by alpha × (0.6 · Sobel edge + 0.4 · luminance), so edges and feature lines get dense, gold-bright points, reproducing the prototype's look.
2. **Per-particle attributes:** `aPosA/aPosB` (x, y from pixels; z = (depth − 0.5) · depthScale · width, plus a mirrored thin back shell), `aScatter`, `aColor` (sampled RGB, gold-tinted by `uTint`), `aComp` (from the mask), `aRnd`, `aBright`, `aExplode` (per part: body up, glass higher, wheels outward, lights forward).
3. **View morph:** every view samples exactly N points, sorted by a spatial key, so morphing between angles is a 1:1 interpolation. The camera yaw stays within ±30° of the active view, since each view is a relief and not a full 3D model.
4. **Powertrain:** photos cannot show an engine, so it is a procedural gold glyph generated from `specs.engineLayout` (cylinder count and layout), reusing the prototype's box-and-cylinder code.
5. **Photoreal hand-off:** when the car is assembled, a subdivided plane displaced by the depth map shows the actual cutout with 2.5D parallax. Particles drop to about 30% as sparkle. Visitors see the real car, which matters for conversion.
6. **Why this approach:** swapping the featured car is a CMS edit. Missing masks fall back to depth-layer explode, and missing views fall back to a single view. Asset IDs are content hashes, so results can be cached (Phase 2 IndexedDB).

**Device tiers** are decided once, before the stage loads, then adjusted at runtime by drei `PerformanceMonitor`: tier A drops to B when it averages under 45 fps for 2 s, and tier B drops to C (cross-fade to posters) under 28 fps.

| Tier | Detection | Car particles | DPR | Other |
|------|-----------|---------------|-----|-------|
| A Desktop | WebGL2, fine pointer, width ≥ 1024, `deviceMemory` ≥ 8 or unknown | 8,000 (raise to ≤ 12k only after profiling) | ≤ 1.75 | AA on, callouts on, streaks 1,400 |
| B Mid phone | WebGL2, otherwise | 3,000 | ≤ 1.5 | AA off, no Lenis (native touch scroll) |
| C Low | No WebGL2, `saveData`, `deviceMemory` < 4, context lost, or demoted | 0 (no stage chunk is downloaded) | — | Posters + cutout `<img>` |
| Reduced motion | `prefers-reduced-motion` | Stage renders one still per chapter on demand (prototype behaviour) | ≤ 1.5 | No scrub, pin, parallax or Lenis |

**Loading and pausing:** stage chunk after idle → `renderer.compileAsync` → canvas fades in over the poster; the gold-dust formation *is* the loading state while the worker samples. Rendering pauses on `visibilitychange` and when the story container leaves the viewport. `webglcontextlost` drops to tier C and sends a Sentry event tagged `gl.tier`. If Turbopack's `new Worker(new URL(...))` support has gaps, sampling runs on the main thread in chunks with `scheduler.yield()`. The whole stage sits behind `flags.stage`.

| Budget (enforced in CI by `size-limit` + Lighthouse CI on Preview URLs; field data from Speed Insights) | Target |
|---|---|
| LCP, p75 mobile field / lab (mid Android, Slow 4G) | ≤ 2.5 s / ≤ 2.0 s |
| INP p75 / CLS | ≤ 200 ms / ≤ 0.05 |
| Initial JS on home (gzip) | ≤ 150 KB |
| Deferred motion chunk (GSAP + ScrollTrigger + Lenis) / stage chunk (three + R3F + scene) | ≤ 55 KB / ≤ 260 KB |
| Hero poster / sampling images per view / fonts preloaded per locale | ≤ 80 KB / ≤ 150 KB / 2 files, ≤ 120 KB |
| Frame time | Tier A ≤ 16.7 ms, tier B ≤ 33 ms on a real mid-range Android and iPhone |

## 1.9 Repository structure

Next.js at the repo root. `docs/`, `prototype/` (frozen reference), `qa/` and `tools/` are kept. Dependency direction is enforced with `eslint-plugin-boundaries`: `domain` imports nothing outside itself; `application` imports `domain`; `infrastructure` implements ports; `app/` route handlers call `application` only.

```
src/app/[locale]/        layout, page (home), cars/, cars/[slug]/, brands/[slug]/, reserve/, booking/[ref]/,
                         pay/mock/[session]/, about|faq|contact/, policies/[slug]/, not-found, error
src/app/api/             bookings/, payments/webhook/[provider]/, ops/action/, revalidate/, cron/{expire,purge,retry}/, health/
src/app/studio/[[...tool]]/   embedded Sanity Studio     src/app/{sitemap,robots}.ts   src/proxy.ts (next-intl)
src/domain/              pricing/ booking/ (status-machine, ref) payments/ (port, events) catalog/ (types)
src/application/         requestBooking, transitionBooking, applyPaymentEvent, buildWhatsAppLink
src/infrastructure/      sanity/ (client, queries, mappers, image-loader) db/ (drizzle schema, migrations, repos)
                         payments/{mock,stripe,…}/ email/ (resend, react-email templates) security/ (botid, ratelimit, signing)
src/ui/                  primitives/ (Button, Field, Card, GlassPanel) booking/ (Dock, ReserveCard, DetailsForm) layout/
src/scene/               Stage.tsx, tiers.ts, scroll-store.ts, camera-rig.ts, chapters/{Skyline,Tunnel,Sculpture,Finale}.tsx,
                         particles/{ParticleCar.tsx, sampler.worker.ts, PhotoRelief.tsx}, shaders/*.glsl
src/i18n/  messages/  styles/tokens.css (from MASTER.md)  config/env.ts (zod-validated)
sanity/                  sanity.config.ts, schemaTypes/*, structure.ts, templates.ts
public/posters/          tier-C stills (rendered by qa/scripts/shoot.mjs)     tests/{unit,e2e,visual}/
```

## 1.10 Security, privacy and observability

- **Secrets:** Vercel env vars, scoped per environment, marked *Sensitive* and validated at build by `config/env.ts`; nothing secret uses `NEXT_PUBLIC_`. Separate secrets for the Sanity read token, webhook secret, `OPS_ACTION_SECRET`, `MOCK_WEBHOOK_SECRET`, Resend key and DB URL. Preview deployments sit behind Vercel Authentication.
- **Headers:** HSTS, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Permissions-Policy that denies camera, mic and geolocation. CSP: `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, allowlisted `img-src` / `connect-src` (`cdn.sanity.io`, `*.api.sanity.io`), `worker-src 'self' blob:`. **Trade-off:** script nonces would force dynamic rendering of every page, so `script-src` allows `'self' 'unsafe-inline'`, mitigated by having no user-generated HTML and rendering Portable Text without raw HTML.
- **PII:** collect only name, phone, email, trip details and notes. **No licence or passport uploads at MVP**; those are checked at handover. Neon encrypts at rest and in transit, and logs carry the booking ref only, never PII. **Retention** (daily cron): PII on declined, expired or cancelled-unpaid bookings is nulled after 90 days; IP hashes are deleted after 30 days; completed bookings are kept 5 years to match UAE VAT record keeping (confirm with their accountant). Neon Free's restore window is short, so during MVP the ops email doubles as an off-database record.
- **Observability:** Vercel Speed Insights (free: 10k events per 30 days) for field LCP, INP and CLS per route. Sentry Developer plan (free) for server and client errors, with `tunnelRoute: '/monitoring'`, `sendDefaultPii: false`, `beforeSend` stripping booking fields, traces at 10%, no session replay, and tags `gl.tier` and `gl.renderer`. `/api/health` checks the database and is pinged by a free uptime monitor. Funnel counts come from SQL on `booking_events` until analytics arrives in Phase 2.

| Service | Plan | Monthly cost | Note |
|---------|------|--------------|------|
| Vercel | **Pro (required)** | **$20 per deploying seat**; viewer seats free | Hobby forbids commercial use. Includes $20 usage credit, 1 TB transfer, 10M edge requests, 40 firewall rules. Set a Spend Management cap. |
| Sanity | Free | $0 | Usage stops at the limit, so watch the asset bandwidth meter. Growth is $15 per seat per month if needed. |
| Neon (Marketplace) | Free | $0 | Paid is usage-based; at this volume expect low tens of dollars. Move to paid for a longer restore window (verify days) once bookings are the system of record. |
| Resend | Free | $0 | 3,000 per month and **100 per day**; each booking uses 2. Pro is $20 per month at about 40 bookings a day. Needs DNS access for SPF, DKIM and DMARC. |
| Sentry / Speed Insights / BotID Basic / Firewall | Free / free tier / included / included | $0 | Rate-limit usage beyond the included amount costs $0.50 per 1M allowed requests (negligible). |
| Later | Payment gateway, WhatsApp Business API, analytics | Per transaction, per conversation (Meta), mostly free | Priced in their own phases |

**MVP run rate: about $20 per month** (one Vercel Pro seat), plus $20 for each additional deploying developer.

## 1.11 Work breakdown

Estimates are in ideal developer-days, assuming two developers: **FE** (front-end and WebGL) and **FS** (full-stack). **MVP-M1, launch:** about 35.5 days, so about 4 calendar weeks. **MVP-M2, cinematic stage on:** about 21 days; FE starts it in week 3, and it goes live by flipping `flags.stage`, with no relaunch. **M1 critical path:** A1 → B1 → B2 → C3 → D4 → E2 → E3, with D1 → D3 running in parallel.

| ID | Task | Days | Depends on | Phase |
|----|------|------|-----------|-------|
| A1 | Scaffold: Next 16, TS 6, Tailwind 4 tokens, ESLint boundaries + RTL lint, Vitest, Playwright, CI, Vercel Pro project, env schema | 1.5 | — | M1 |
| A2 | UI primitives and layout from MASTER.md (Button, Field, Card, GlassPanel, Header, Rail, Footer, Lucide) | 2 | A1 | M1 |
| A3 | i18n plumbing: next-intl (en), `[locale]`, dir/lang, fonts per locale, `format.ts` (AED, Asia/Dubai) | 1 | A1 | M1 |
| B1 | Sanity project, embedded Studio, 9 types + locale and image-slot objects, validation, desk, "New car" template, TypeGen | 2.5 | A1 | M1 |
| B2 | Data layer: GROQ, mappers, `'use cache'` + tags, Sanity image loader + LQIP | 1.5 | B1 | M1 |
| B3 | Revalidation webhook (signature check, tag map, `expire: 0` for prices) | 0.5 | B2 | M1 |
| B4 | Load 16 cars, rates, zones, policies, FAQ, pages (developer support for content and visual sections) | 1 | B1, image set | M1 |
| C1 | Homepage DOM shell ported from prototype: 4 chapters, dock as GET form, reserve card, sticky CSS, reduced-motion layout | 2 | A2, B2 | M1 |
| C2 | Fleet page: filters, per-date totals | 1.5 | C1, D1 | M1 |
| C3 | Car detail: gallery, specs, rate table, reserve sheet, "Ask on WhatsApp" | 2 | B2, D1 | M1 |
| C4 | About, FAQ, Contact, Policies (Portable Text), 404/error | 1 | B2 | M1 |
| C5 | SEO: metadata, sitemap, robots, JSON-LD, canonical and hreflang scaffolding | 1 | C1–C4 | M1 |
| C6 | Tier-C posters rendered from prototype scenes + cutout compositing | 1 | C1 | M1 |
| D1 | Pricing engine + table and property tests | 2 | Pricing rules section | M1 |
| D2 | Neon via Marketplace, Drizzle schema and migrations, repositories, preview branches | 1 | A1 | M1 |
| D3 | `requestBooking` use case, `/api/bookings`, state machine, ref + idempotency | 2 | D1, D2 | M1 |
| D4 | `/reserve` (server quote), details form, success + wa.me, booking status page | 2.5 | D3, C3 | M1 |
| D5 | Resend + React Email (ops, customer), signed ops action links | 2 | D3, DNS | M1 |
| D6 | Payment port, MockProvider, mock checkout, webhook route, idempotent events | 1.5 | D3 | M1 |
| D7 | BotID, Firewall rate-limit rule, honeypot, per-contact throttle | 1 | D3 | M1 |
| D8 | Cron: expire requests, PII purge, notification retry | 0.5 | D3 | M1 |
| E1 | Headers and CSP, Sentry, Speed Insights, health check, uptime | 1 | A1 | M1 |
| E2 | QA: e2e booking, axe, iOS Safari / Android, reduced motion, 375–1440 | 2.5 | all M1 | M1 |
| E3 | Go-live: DNS, email DNS, Search Console, smoke test, rollback (instant rollback to previous deployment) | 1 | E2, domain access | M1 |
| F1 | Stage infrastructure: R3F on GSAP ticker, Lenis, scroll store, tiers + PerformanceMonitor, lazy load, context-loss fallback, pausing | 3 | C1 | M2 |
| F2 | Port Skyline chapter (sky, stars, towers, supertall, beacons, traffic, helipad) | 2.5 | F1 | M2 |
| F3 | Port Velocity Tunnel + category cutout fly-bys | 2 | F1 | M2 |
| F4 | Image-sampled particle car: worker sampler, form / explode / morph shaders, mask parts, powertrain glyph, headlights | 5 | F1, visual asset spec | M2 |
| F5 | Photo relief plane (depth parallax) + particle-to-photo cross-fade | 2 | F4 | M2 |
| F6 | Camera rig and choreography, DOM callout projector, RTL mirroring | 2.5 | F2–F5 | M2 |
| F7 | Real-device performance pass; size-limit + Lighthouse CI budgets | 2.5 | F6 | M2 |
| F8 | Brand and category landing pages, per-car OG images (`next/og`) | 1.5 | C3 | M2 |
| P2a | Ops console `/ops`: magic-link auth, list and filter, transitions, notes | 4 | D3 | Phase 2 |
| P2b | Availability blocks + Postgres exclusion constraint (`tstzrange &&`) + "available" badges | 2.5 | P2a | Phase 2 |
| P2c | Live gateway adapter: 3DS, deposit pre-auth / capture / void, refunds, reconciliation | 4 | D6, merchant account | Phase 2 |
| P2d | Analytics, Meta Pixel, consent banner, Google Business, conversion events | 2 | Client accounts | Phase 2 |
| P2e | Sanity Presentation (visual editing) | 1.5 | B3 | Phase 2 |
| P2f | Seasonal and weekend rates, promo codes | 2 | D1 | Phase 2 |
| P2g | Multi-angle drag viewer on car pages + Flip card-to-detail transition | 3 | F4 | Phase 2 |
| P2h | Precomputed particle packs on publish + IndexedDB cache (only if F7 shows sampling cost) | 2 | F7 | Phase 2 |
| P2i | Studio action that triggers the visual pipeline (cutout, depth, mask) | 2 | Visual pipeline section | Phase 2 |
| P3a | Arabic launch: enable `ar`, translation workflow, RTL QA of pages and scene, hreflang | 5 | MVP, translator | Phase 3 |
| P3b | WhatsApp Business Cloud API: template notifications, inbound webhook matched by ref | 4 | Meta verification | Phase 3 |
| P3c | Licence, passport and IDP upload to private storage with auto-delete | 3 | P2a | Phase 3 |
| P3d | Customer "my bookings" via magic link | 2 | P2a | Phase 3 |

Phase totals: MVP 56.5 days (M1 35.5 + M2 21), Phase 2 23, Phase 3 14.

## 1.12 Top risks and open questions

| # | Risk | Mitigation |
|---|------|-----------|
| R1 | AI images vary in angle, lighting and alpha fringe, so the particle car looks inconsistent across the fleet | Strict asset spec agreed with the visual-pipeline section; Studio validation; a per-car `particle` override; `flags.stage` falls back to the photo relief only |
| R2 | AI images misrepresent the real car (consumer protection), and brand logos raise trademark issues | "Images are illustrative" label per car; brand names as text, not logos; replace with real photos when available |
| R3 | Mid-range Android or iOS Safari GPU and memory limits | Tiers, runtime demotion, budgets in CI, testing on real devices before M2 goes live |
| R4 | A simulated payment on the live site misleads customers | No card fields ever; the demo checkout only appears with `paymentsDemo` or on Preview |
| R5 | No live availability, so double bookings with the WhatsApp channel | Request semantics, ops confirmation, and the exclusion constraint in Phase 2 |
| R6 | Domain and DNS access arrives late ("at production push"), blocking email sender verification | Ask for DNS access in week 1; until then send from Resend's test domain on Preview only |
| R7 | Free tiers cap out (Resend 100/day, Sanity hard stops) | Usage alerts; upgrade paths priced in 1.10 |
| R8 | Data residency under the UAE PDPL (database in Frankfurt) | Legal confirmation; Drizzle on standard Postgres means a move to a UAE host is a connection-string change |

**Open questions for Zubair:**
1. Can we use the "Pay at handover / link after confirmation" wording while payments are simulated, instead of a public demo checkout?
2. Which WhatsApp number receives bookings, and is the prototype's "confirm within 15 minutes" promise operationally true? If so, during which hours?
3. Who receives ops emails, and should ops be able to confirm bookings from email, as planned?
4. Should the deposit be taken by card pre-authorisation at handover (assumed), or online later?
5. Retention periods and actual privacy policy text: "in place", but we need the documents.
6. When will real car photos arrive? Is there permission to show brand logos?
7. Who owns the Vercel, Sanity, Neon and Resend accounts? Recommend client-owned organisations with the agency invited.
8. Who translates and reviews the Arabic, and when is Phase 3 targeted? Should Arabic use Western digits?
