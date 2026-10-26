# 07 · SEO, AI search and launch visibility

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **SEO Specialist** agent. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - The canonical host is `www.luxuryrentals.ae` (D-07), so the apex URLs in the examples become www.
> - URL patterns follow D-14 (`/cars/{brand}/{model}`, `/cars/{brand}`, `/cars/type/{category}`); update the JSON-LD example to match. The fleet car is the Urus SE, not the Urus S.

Prepared 23 Oct 2026 for LuxuryRentals.ae (Luxuryrentals, Dubai Silicon Oasis). The domain is new, so there are no legacy URLs and no reviews. English launches first and Arabic follows. **No search volumes are quoted here.** Wherever a figure would go, the text says "check in a keyword tool": Google Keyword Planner (location UAE, English/Arabic) or the Ahrefs/Semrush UAE database. Prices, specs and NAP below are samples or placeholders until the client confirms them.

**SERP snapshot (web research, Oct 2026).** Model and "luxury" queries are led by marketplaces (OneClickDrive lists many owners' cars per model) and by multi-area operators that already run area pages, including one for Dubai Silicon Oasis (Octane). Published Urus day rates range from roughly AED 700 to 3,800 across sources. The head term is a 6–12 month goal. Model, chauffeur and DSO long-tail terms are the realistic first wins.

## 7.1 Keyword strategy

Each URL owns one primary cluster. Its terms may appear in body copy elsewhere, but never in another page's title or H1. Volume, difficulty and seasonality for every row are not yet known: check in a keyword tool.

| # | Cluster | Example queries (EN) | Intent | Owner page | Phase |
|---|---------|----------------------|--------|------------|-------|
| 1 | Head | luxury car rental Dubai, luxury car hire Dubai, rent a luxury car in Dubai | Commercial/transactional | `/` | MVP |
| 2 | Fleet | exotic car rental Dubai, luxury cars for rent Dubai | Commercial | `/cars` | MVP |
| 3 | Category | supercar rental Dubai, luxury SUV rental Dubai, convertible rental Dubai, grand tourer hire Dubai | Commercial | `/categories/{supercars,suvs,convertibles,grand-tourers}` | MVP |
| 4 | Brand (x8) | rent Lamborghini Dubai, Ferrari rental Dubai, Rolls-Royce rental Dubai, Bugatti rental Dubai | Commercial | `/brands/{brand}` | MVP |
| 5 | Model (x16) | rent Lamborghini Urus Dubai, Rolls-Royce Cullinan rental Dubai, {model} rental Dubai price per day | Transactional | `/cars/{brand-model}` | MVP |
| 6 | Chauffeur | chauffeur service Dubai, Rolls-Royce with driver Dubai, luxury car with driver Dubai | Transactional | `/chauffeur` | MVP |
| 6b | Chauffeur occasions | wedding car rental Dubai, Rolls-Royce airport transfer Dubai | Transactional | `/chauffeur/weddings`, `/chauffeur/airport-transfers` | Phase 2 |
| 7 | Airport + home base | luxury car rental Dubai airport, car rental DXB delivery, car rental Dubai Silicon Oasis | Transactional, local | `/delivery/dubai-airport-dxb`, `/delivery/dubai-silicon-oasis` | MVP |
| 7b | Areas | luxury car rental Dubai Marina / Downtown Dubai / Palm Jumeirah / Business Bay; Al Maktoum airport (DWC) | Transactional, local | `/delivery/{area}` | Phase 2 |
| 8 | Price | luxury car rental Dubai price, how much to rent a Lamborghini in Dubai, monthly supercar rental Dubai | Commercial/info | `/pricing` (per-model price stays on the car page) | MVP |
| 9 | Requirements | documents to rent a car in Dubai as a tourist, age to rent a supercar in Dubai, IDP Dubai, Salik rental car, deposit | Informational | `/requirements` | MVP |
| 10 | Navigational | luxuryrentals, luxuryrentals.ae, luxuryrentals DSO | Navigational | `/` | MVP |
| 11 | Experience | supercar drive routes Dubai, Hatta road trip, Jebel Jais drive, supercar photo spots Dubai | Informational | `/guides/{slug}` | Phase 2 |

**Arabic (Phase 3).** Validate every term with a native Gulf-Arabic speaker and a keyword tool, testing both تأجير and ايجار and both فاخرة and فخمة. Proposed mapping: تأجير سيارات فاخرة دبي and ايجار سيارات فخمة في دبي → `/ar`; تأجير سيارات رياضية دبي → `/ar/categories/supercars`; تأجير لامبورغيني دبي → `/ar/brands/lamborghini`; تأجير رولز رويس مع سائق دبي and سيارة مع سائق دبي → `/ar/chauffeur`; تأجير سيارات مطار دبي → `/ar/delivery/dubai-airport-dxb`.

**Modifiers.** Avoid "cheap". Target "no deposit" or "monthly" only if the offer is real (open question 6). The plan assumes demand peaks in winter (Oct–Apr); confirm this in Google Trends (UAE) before scheduling content.

## 7.2 URLs, metadata templates and internal linking

**URL rules.** Use the apex `https://luxuryrentals.ae`, with `www` redirecting to it via 308 (set in Vercel). Slugs are lowercase and hyphenated, with no trailing slash and no years or colours. Car slugs use the model family (`/cars/lamborghini-urus`), so a trim swap keeps the URL. Filter states on `/cars` canonicalise to `/cars`; brand and category pages are the crawlable versions. There is **no `/categories/chauffeur`**: the fleet's "Chauffeur" filter links to `/chauffeur`, so two pages never compete. A retired car 301s to its successor or to its brand page (set by a `redirectTo` field in Sanity), never a 404. Arabic mirrors the English slugs under `/ar/`, since Latin slugs stay readable in WhatsApp shares.

| Page type | Title template (≤ ~60 chars) | Meta description template | H1 |
|-----------|-------------------------------|---------------------------|----|
| Home `/` | Luxury Car Rental in Dubai, Delivered \| Luxuryrentals | 16 cars from Ferrari, Lamborghini, Rolls-Royce, Bugatti and more, delivered across Dubai incl. DXB. Book on WhatsApp. | Luxury car rental in Dubai |
| Fleet `/cars` | Exotic Cars for Rent in Dubai: The Full Fleet \| Luxuryrentals | All 16 cars with day rates from AED {min}, specs and delivery. Filter by marque or type, then book on WhatsApp. | The fleet |
| Car | Rent {Brand} {Model} in Dubai \| From AED {price}/day | {Model}: {power} hp, 0–100 km/h in {s} s. AED {price}/day incl. VAT, {km} km/day, delivered across Dubai and DXB. | {Brand} {Model} rental in Dubai |
| Brand | {Brand} Rental in Dubai: {Model A} & {Model B} | Rent a {Brand} in Dubai: {Model A} from AED {a}/day, {Model B} from AED {b}/day. Delivered incl. airports. | {Brand} rental in Dubai |
| Category | {Category} Rental in Dubai from AED {min}/day | {n} {category} for rent in Dubai: {models}. Daily, weekly and monthly rates, delivered to your door. | {Category} rental in Dubai |
| Chauffeur | Chauffeur Service Dubai: Rolls-Royce & Bentley with Driver | Chauffeur hire from AED {x}/hour: airport pickups, weddings, business. Professional drivers across Dubai. | Chauffeur service in Dubai |
| Delivery area | Luxury Car Rental {Area}: Delivery & Handover | Delivery to {Area} from AED {fee}, typically {time} from our DSO base. {Area-specific handover detail}. | Luxury cars delivered to {Area} |
| Pricing | Luxury Car Rental Prices in Dubai (Updated {Mon YYYY}) | Day, week and month rates for all 16 cars, plus deposit, mileage, Salik, fuel and delivery fees in one table. | Luxury car rental prices |
| Requirements | What You Need to Rent a Supercar in Dubai: Age, Licence, IDP | Minimum age, licence history, IDP rules by country, deposit and documents, for residents and tourists. | What you need to rent a luxury car in Dubai |
| FAQ / Guide | Luxury Car Rental FAQ \| Luxuryrentals; {Guide headline} \| Luxuryrentals | First answer or summary, 140–155 chars | Question-led H1 |

Change the "(Updated {Mon YYYY})" stamp only when the content changes. `metadata.title.template` adds the brand suffix once.

**Internal linking**
- **Depth:** every car is at most 2 clicks from home. The server-rendered homepage fleet grid links to each car with real `<a href>` anchors, and the nav reaches them via `/cars`.
- **Car pages** link to their breadcrumb (Home › Fleet › {Brand} › {Model}), brand page, category page, 2 sibling cars from the same category, `/requirements`, `/pricing` and `/delivery/dubai-airport-dxb`.
- **Brand pages** link to their 2 models and the other 7 brands. **Category pages** link to their cars and related categories.
- **Homepage chapters:** the Velocity Tunnel category labels and the Kinetic Sculpture "See this car" link are DOM anchors, not canvas click handlers.
- **Footer:** 8 brands, 4 categories, chauffeur, delivery areas, pricing, requirements, FAQ, policies and the NAP.
- **Guides** link to cars with descriptive anchors ("rent the Rolls-Royce Cullinan").
- **One home per fact:** each fact (price, deposit, age) lives on one page, and every other page links to it.

## 7.3 Technical SEO (Next.js App Router on Vercel)

**Rendering and metadata.** Every public route is statically generated from Sanity (`generateStaticParams`), and a Sanity publish webhook triggers `revalidateTag`. Car name, price, specs, FAQs and CTAs are in the initial HTML; check with `curl` and GSC URL Inspection, not only a browser. The root `layout.tsx` sets `metadataBase: new URL('https://luxuryrentals.ae')` and `title.template: '%s | Luxuryrentals'`. Each route's `generateMetadata()` reads the same Sanity document as the page and sets a self-referencing absolute `alternates.canonical`, `openGraph`, and `twitter.card: 'summary_large_image'`.

**robots.txt (`app/robots.ts`).** In production, allow everything except `/api/` and the simulated checkout routes, and declare the sitemap. When `VERCEL_ENV !== 'production'`, serve `Disallow: /`. Vercel also sends `X-Robots-Tag: noindex` on previews; keep both guards. Explicitly allow `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot` and `Bingbot`. The training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`) are the client's call, and the recommendation is to allow them. Blocking `Google-Extended` does not remove the site from AI Overviews. Check that Vercel Firewall and bot protection don't challenge any of these bots.

**sitemap.xml (`app/sitemap.ts`).** Generated from Sanity, listing only canonical, indexable 200 URLs, with `lastModified` from `_updatedAt` and car images in `images`. Add `alternates.languages` when `/ar` ships. Submit it to GSC (domain property, DNS TXT) and Bing Webmaster Tools. The Sanity webhook also pings IndexNow (key file at `/{key}.txt`).

**Hreflang (Arabic in Phase 3; routing built in the MVP).** Use `next-intl` with `localePrefix: 'as-needed'`: English stays unprefixed and Arabic sits at `/ar/...`, so English URLs never move. Translated pairs emit reciprocal, absolute `alternates.languages: { en, ar, 'x-default': en }` in the head and in the sitemap. Use language-only codes, because `en-AE` would undersell the site to tourists searching from abroad. `app/[locale]/layout.tsx` sets `<html lang="ar" dir="rtl">`. Only emit hreflang where an Arabic page exists. Never redirect by IP or `Accept-Language` (Googlebot would only ever see English); offer a visible language switcher instead. Arabic copy is written or reviewed by a person, not bulk machine output.

**OG images per car.** `app/cars/[slug]/opengraph-image.tsx` uses `ImageResponse` from `next/og` at 1200x630. Each image shows the car, the model name, "From AED {price}/day" and the logo, with Syncopate and Montserrat loaded as font files. Brand and category pages get their own OG images; RTL variants follow with Arabic. Bookings happen on WhatsApp, so test real WhatsApp previews and keep files small (WhatsApp is known to drop large preview images).

**Core Web Vitals with the WebGL homepage.** Targets at mobile p75: LCP < 2.5 s, INP < 200 ms, CLS < 0.1.
- **LCP:** the LCP element is a server-rendered poster (`next/image` with `priority`, AVIF/WebP), with the H1, intro and booking bar in the HTML. The canvas is never the LCP element.
- **Lazy WebGL:** the canvas loads via `next/dynamic(..., { ssr: false })` after first paint or idle, and only on capable devices (checks: `prefers-reduced-motion`, `saveData`, device memory, GPU). Phones get the MASTER §2 video and poster. Three.js, R3F and GSAP stay out of shared chunks, so car pages ship none of them.
- **Visible by default:** animate from a visible state. SSR text never waits at `opacity: 0` for ScrollTrigger, so it stays readable with JS off and in Googlebot's render.
- **CLS and INP:** fixed `aspect-ratio` boxes for the canvas, video and images; `next/font`; reserved space for the booking bar. Shader compilation and Lenis must not create long tasks during input. The WhatsApp CTA responds on the first tap.
- **Measure from day 0:** Vercel Speed Insights (field RUM, no client account needed) and Lighthouse CI on previews. CrUX will have no data for a new domain for weeks.

**Images (AI-generated for now).**
- **Filenames:** `{brand}-{model}-{view}`, for example `rolls-royce-cullinan-rear-three-quarter`, never the generator's name. Sanity's CDN serves files by hash, so use Sanity vanity filenames (verify during the build).
- **Alt text:** a required Sanity field that describes what is shown, for example "Lamborghini Urus in matte black, front three-quarter view, Dubai skyline at night".
- **AI disclosure:** embed IPTC `DigitalSourceType = trainedAlgorithmicMedia`. Show one line on each car page: "Images are illustrative; the car supplied is the model listed, colour and trim may vary."
- **Real photos:** swap them in as soon as possible. GBP needs them, they do better in image search, and they build trust.

**Structured data.** Rendered from Sanity in server components, with `<` escaped as `<`. Every value must match the visible text.
- **Site-wide `@graph`:** `Organization`, `WebSite` and `AutoRental` (a LocalBusiness subtype, `@id` `https://luxuryrentals.ae/#business`). Fields: name, logo, DSO `PostalAddress` (placeholder until final), `geo`, `telephone`, WhatsApp `contactPoint`, opening hours, `areaServed`, `priceRange`, and `sameAs` (Instagram, TikTok, and GBP once live).
- **No ratings yet:** no `aggregateRating` or `review` until real reviews exist. Even then, self-serving reviews on your own site earn no stars.
- **Per page type:** car pages get `Car` with an `Offer` (`businessFunction` LeaseOut, `UnitPriceSpecification` with `unitCode: DAY`). `/chauffeur` gets `Service` with an hourly offer (`HUR`). Every page except home gets `BreadcrumbList`. `/faq` and `/requirements` get `FAQPage`.
- **Expectations:** Google has no rental-car rich result, and it retired Vehicle listing markup in June 2025. FAQ rich results reportedly ended on 7 May 2026. The markup's value is entity clarity for Google, Bing and AI engines.
- **Validation:** Rich Results Test, validator.schema.org, and a JSON-LD snapshot test in CI.

Car page example (`/cars/lamborghini-urus`). The specs are Lamborghini's published Urus S figures. The price, image hash and project ID are placeholders.
```json
{ "@context": "https://schema.org", "@graph": [
  { "@type": "BreadcrumbList", "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://luxuryrentals.ae/" },
    { "@type": "ListItem", "position": 2, "name": "Fleet", "item": "https://luxuryrentals.ae/cars" },
    { "@type": "ListItem", "position": 3, "name": "Lamborghini", "item": "https://luxuryrentals.ae/brands/lamborghini" },
    { "@type": "ListItem", "position": 4, "name": "Lamborghini Urus S" } ] },
  { "@type": "Car", "@id": "https://luxuryrentals.ae/cars/lamborghini-urus#car",
    "name": "Lamborghini Urus S", "url": "https://luxuryrentals.ae/cars/lamborghini-urus",
    "image": "https://cdn.sanity.io/images/{projectId}/production/{hash}-2400x1600.jpg/lamborghini-urus-front-three-quarter.jpg",
    "description": "Rent the Lamborghini Urus S in Dubai, delivered to your hotel, home or DXB.",
    "brand": { "@type": "Brand", "name": "Lamborghini" }, "model": "Urus S", "bodyType": "SUV",
    "vehicleSeatingCapacity": 5, "vehicleTransmission": "Automatic", "fuelType": "Petrol",
    "driveWheelConfiguration": "https://schema.org/AllWheelDriveConfiguration",
    "vehicleEngine": { "@type": "EngineSpecification",
      "enginePower": { "@type": "QuantitativeValue", "value": 490, "unitCode": "KWT" } },
    "accelerationTime": { "@type": "QuantitativeValue", "value": 3.5, "unitCode": "SEC", "description": "0-100 km/h" },
    "speed": { "@type": "QuantitativeValue", "maxValue": 305, "unitCode": "KMH" },
    "offers": { "@type": "Offer", "url": "https://luxuryrentals.ae/cars/lamborghini-urus",
      "businessFunction": "http://purl.org/goodrelations/v1#LeaseOut",
      "price": 3500, "priceCurrency": "AED",
      "priceSpecification": { "@type": "UnitPriceSpecification", "price": 3500, "priceCurrency": "AED",
        "unitCode": "DAY", "valueAddedTaxIncluded": true },
      "availability": "https://schema.org/InStock",
      "areaServed": { "@type": "City", "name": "Dubai" },
      "offeredBy": { "@id": "https://luxuryrentals.ae/#business" } } } ] }
```

## 7.4 AI search and answer engines (ChatGPT, Perplexity, Google AI Overviews)

- **How each engine finds us.** Google AI Overviews and AI Mode draw on the normal Google index. Google says no special files or markup are needed (AI features doc, updated Dec 2025). ChatGPT search uses `OAI-SearchBot` and leans on Bing, so Bing Webmaster Tools, IndexNow and Bing Places matter from launch. Perplexity crawls with `PerplexityBot` and Claude with `Claude-SearchBot`.
- **`/llms.txt`.** Takes about 0.25 day. Evidence that engines use it is weak, and Google ignores it. A route handler, `app/llms.txt/route.ts`, generates it from Sanity so it never goes stale. It holds a business summary, the NAP, "bookings via WhatsApp", and links to `/pricing`, `/requirements`, `/faq`, `/cars`, `/chauffeur` and `/delivery`. It contains nothing that is not also on the site.
- **Citable fact pages.** Lead with the answer, one question per H2 or H3. Put numbers in HTML tables: rates per car per day, week and month; deposit; km per day; extra-km fee; Salik and fuel; delivery fee by zone; minimum age; licence and IDP rules; cancellation windows. Show a visible "Last updated {date}". Each fact appears in one place only, so engines never see two different prices.
- **Entity consistency.** The site, JSON-LD, GBP, Instagram and TikTok bios, and directories all use the same name, NAP, one-line description and logo. That lets models resolve "Luxuryrentals, DSO" as one business.
- **Third-party mentions** feed answers to "best luxury car rental Dubai". Sources: marketplace listings, Dubai lifestyle and motoring press, and honest participation in Reddit and Tripadvisor threads (no astroturfing).
- **Monthly check.** Run 10 fixed prompts in ChatGPT, Perplexity, Gemini and Google AI Mode. Examples: "Rolls-Royce with chauffeur Dubai", "luxury car rental near Dubai Silicon Oasis", "Lamborghini Urus rental Dubai price". Log whether we are cited, and which URL.

## 7.5 Local SEO

- **Google Business Profile.** Set it up when the client is ready, and start that day, because verification can take weeks.
  - **Format:** storefront if customers are served at the DSO address during posted hours. Otherwise a service-area business with the address hidden, listing up to 20 Dubai areas. Virtual offices are not eligible.
  - **Name:** exactly as on the trade licence and signage. Keywords in the name (e.g. "Luxuryrentals Supercar Rental Dubai") invite suspension.
  - **Category:** primary is Car rental agency. Check the picker for chauffeur or limousine secondaries.
  - **Video verification:** prepare signage, the building number, the trade licence or RTA permit, a fleet car and live access to the business tools.
  - **Profile:** hours, the WhatsApp number, the site link tagged `utm_source=google&utm_medium=organic&utm_campaign=gbp`, services with prices, cars as products, and **real photos only**.
- **NAP consistency.** One Sanity `siteSettings` document feeds the footer, `/contact`, the JSON-LD and llms.txt. Use one format: `Luxuryrentals, [Unit], [Building], Dubai Silicon Oasis, Dubai, UAE · +971 X XXX XXXX`. **Submit no directory until the NAP is final**; cleaning up placeholder citations is slow.
- **Apple Business Connect** (Apple Maps, Siri): confirm UAE eligibility at sign-up.
- **Bing Places:** import from GBP after verification. It also feeds Copilot and some ChatGPT local answers.
- **UAE directories and marketplaces:** 2GIS (widely used in Dubai), Yellow Pages UAE, Yello.ae, any DSO Authority company directory (ask DSOA), and rental marketplaces such as OneClickDrive (a lead channel and a citation). Verify each sign-up and fee. Skip anyone selling "SEO links".
- **Local links:** hotel concierges in Downtown and the Marina, wedding planners and event organisers (chauffeur), DSO community media. Paid placements use `rel="sponsored"`.

## 7.6 Launch visibility: the first 90 days with no reviews

Expect no ranking for "luxury car rental Dubai" within 90 days. Early demand will come from Instagram and TikTok, WhatsApp shares, GBP (once verified), marketplaces and the long-tail model pages.

| Window | Actions |
|--------|---------|
| Days 0–7 | Verify GSC and Bing Webmaster Tools, submit sitemaps, turn on IndexNow. Request indexing for home, `/cars`, all 16 car pages, `/chauffeur`, `/pricing` and `/requirements`. Turn on Speed Insights and pass the Rich Results Test. Add the site link to social bios. Start the GBP application if the client is ready. |
| Days 8–30 | Start the review workflow with the first rental. List in directories and marketplaces once the NAP is final. Publish the first 2 guides. Post weekly on GBP once verified. |
| Days 31–60 | Publish area pages (Marina, Downtown, Palm, Business Bay, DWC), each with its own delivery facts. A template that only swaps the area name would be a doorway page. Publish 2 more guides and start local link outreach. Run the first page+query cannibalisation audit in GSC. |
| Days 61–90 | Rewrite titles and metas for queries with impressions at positions 8–20. Swap in real photos (new filenames and alt text, regenerated OG images). Start Arabic keyword research. Repeat the AI-citation log. |

**Getting reviews after the first rentals.** Within 24 hours of the car's return, ops (Zubair) sends a WhatsApp Business template: thanks, the car name and the GBP "ask for reviews" short link. Ask **every** customer, because filtering out unhappy customers or rewarding reviews breaks Google policy. Reply to every review within 48 hours. Show real reviews on the site later, with consent, and never invent testimonials. Until reviews exist, build trust with visible RTA permit and trade-licence numbers, VAT-inclusive prices (confirm the B2C display rule with the client's accountant), clear policies, a real team and DSO photo, and fast WhatsApp replies.

**Content ideas (`/guides`).** Publish two a month, written from real drives with real photos, times and distances, and fact-check any AI drafts. Topics:
- Sheikh Zayed Road to Dubai Marina at night
- a Hatta road trip in a convertible (Hatta is inside Dubai emirate)
- Jebel Jais from Dubai (only if out-of-emirate driving is allowed)
- the Al Ain Road (E66) drive from DSO
- supercar photo spots (check shoot-permit rules)
- Ferrari vs Lamborghini: which to rent in Dubai
- Rolls-Royce vs Bentley for a wedding (adjust to the final fleet)
- supercars in summer heat

Price, requirements and airport questions are **not** guides. They belong to `/pricing`, `/requirements` and `/delivery/dubai-airport-dxb`, and guides link to those pages.

**Instagram/TikTok discovery.** The working assumption is that discovery in this market is mostly social; check it against UTM data. Every post and reel links through an on-domain `/links` page (noindex, not Linktree) to the specific car page, with UTMs. Use real footage, because AI-generated cars on social lose trust quickly. Paid or gifted creator work needs the creator's UAE Media Council Advertiser Permit (launched 30 Jul 2025; check current rules at uaemc.gov.ae) and a clear ad label. Social reach should show up as rising branded queries in GSC. Social embeds on the site use a poster with click-to-load to protect CWV.

**What to measure once GA4 and Meta Pixel arrive** (with a consent banner and Consent Mode):

| Metric | Source | Note |
|--------|--------|------|
| WhatsApp clicks by car and page type | GA4 event `whatsapp_click` | Primary conversion |
| Bookings by source | Prefilled WhatsApp text with a ref code (e.g. `Ref: URUS-IG`), plus the ops log | Works from day 0, before GA4 |
| Indexed vs submitted URLs | GSC Pages | Target: all sitemap URLs indexed by day 30 |
| Branded vs non-branded clicks | GSC, brand regex `luxuryrentals` | Keep it strict; "luxury rentals" is generic |
| Positions, model + Dubai and chauffeur queries | GSC (rank tracker optional) | Weekly; call a trend only after 4+ weeks |
| CWV p75 on mobile | Speed Insights, then CrUX | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 |
| GBP calls, website clicks, directions | GBP Performance | After verification |
| Reviews: count, rating, reply time | GBP | From the first rental |
| AI citations | Monthly prompt log | Cited yes/no, and which URL |

## 7.7 Tasks, risks and open questions

LB = launch-blocking. The LB tasks add up to about 11 ideal days, 4 of them copy, and can run in parallel with the build.

| # | Task | Phase | Ideal days | LB |
|---|------|-------|-----------|----|
| 1 | Validate keywords in a keyword tool, review the SERPs, finalise the keyword-to-URL map | MVP | 1.5 | |
| 2 | Metadata API: `metadataBase`, title template, `generateMetadata` per route, canonicals | MVP | 1 | LB |
| 3 | `robots.ts` (env-gated, AI bot rules), `sitemap.ts`, www-to-apex redirect, preview noindex | MVP | 0.5 | LB |
| 4 | JSON-LD components (site graph, Car + Offer, Service, BreadcrumbList, FAQPage) with CI validation | MVP | 1.5 | LB |
| 5 | Per-car OG images (`opengraph-image.tsx`) and WhatsApp preview tests | MVP | 0.75 | |
| 6 | Homepage CWV acceptance: SSR text and poster LCP, gated lazy WebGL, JS budgets, Lighthouse CI | MVP | 1.5 | LB |
| 7 | Image hygiene: rename AI images, required alt field, IPTC tag, disclosure line | MVP | 0.75 | LB |
| 8 | SEO copy: 16 unique car texts (no manufacturer copy), 8 brand + 4 category intros, pricing, requirements, FAQ, chauffeur, DXB and DSO pages | MVP | 4 | LB |
| 9 | `llms.txt` route and Vercel bot-protection check | MVP | 0.5 | |
| 10 | GSC (DNS), Bing Webmaster Tools, IndexNow, Speed Insights; submit sitemaps; URL Inspection | MVP | 0.5 | LB |
| 11 | NAP in `siteSettings`, footer and contact block, WhatsApp ref codes | MVP | 0.5 | LB |
| 12 | Pre-launch crawl (Screaming Frog), rendered-HTML and canonical checks | MVP | 0.75 | LB |
| 13 | GBP setup and verification support | Phase 2 | 1 | |
| 14 | Apple Business Connect, Bing Places, 2GIS, Yellow Pages, Yello, DSOA, marketplaces | Phase 2 | 1.5 | |
| 15 | Review workflow: WhatsApp template, GBP link, reply guide | Phase 2 | 0.5 | |
| 16 | Five area delivery pages with unique facts | Phase 2 | 2.5 | |
| 17 | Chauffeur sub-pages (weddings, airport transfers) | Phase 2 | 1 | |
| 18 | Six guides over the 90 days (research, writing, editing, photos) | Phase 2 | 6 | |
| 19 | GA4, Meta Pixel, consent, events, Looker Studio dashboard | Phase 2 | 1.5 | |
| 20 | Day-60 cannibalisation audit and title/meta changes | Phase 2 | 1 | |
| 21 | Real-photo swap, SEO side (filenames, alt text, OG images) | Phase 2 | 0.5 | |
| 22 | Local link and PR outreach (hotels, wedding planners, Dubai media) | Phase 2 | 3 | |
| 23 | Arabic SEO: native keyword research, `/ar` metadata, hreflang and sitemap alternates, RTL OG images | Phase 3 | 3 | |
| 24 | Arabic GBP description and directory entries | Phase 3 | 0.5 | |
| 25 | Decide on more languages (e.g. Russian) from GSC country data | Phase 3 | 0.5 | |
| 26 | Refresh content, price facts and the AI-citation log | Phase 3 | 1 per quarter | |

Totals: MVP 13.75 · Phase 2 18.5 · Phase 3 4, plus 1 per quarter.

**Risks**
- **Estimated prices go live.** They then spread through JSON-LD, OG images and AI answers. Mitigation: client sign-off before launch, "from" wording, and one price field in Sanity.
- **AI-generated car images.** Risks are misrepresentation complaints, removal from GBP and weak image search. Mitigation: the disclosure line, the IPTC tag, real photos in Phase 2, and no AI images on GBP.
- **Generic brand name.** "Luxuryrentals" blurs into "luxury rentals", so navigational searches can land on other businesses. Mitigation: always pair "Luxuryrentals · LuxuryRentals.ae", plus `sameAs` and GBP.
- **Zero reviews.** Competitors with many reviews will hold the local pack early. Lean on the long tail, social and marketplaces.
- **WebGL homepage.** INP or LCP can regress, or text can stay hidden until JS runs. Mitigation: CI budgets and SSR checks on every deploy.
- **Doorway and duplicate content.** Templated area pages look like doorway pages, and manufacturer text on car pages is duplicate content. Mitigation: unique facts on every page.
- **Fleet churn** creates 404s unless the 301 field is used.
- **Placeholder NAP or legal copy** could be indexed. Publish the real legal pages before launch.
- **GBP suspension** can follow keywords in the name or an ineligible address.
- **Creators without an Advertiser Permit** put the brand at legal risk.
- **"Immediate launch"** conflicts with about 11 LB days.

**Open questions for Zubair**
1. What is the exact trading name on the licence? It will also be the GBP name.
2. Can customers collect at DSO, or is it delivery only? Is there signage?
3. What are the final phone/WhatsApp number and opening hours?
4. When will confirmed rates, deposit, km/day, Salik/fuel and delivery fees be ready?
5. Is driving outside Dubai allowed (RAK, Oman)? This decides the Jebel Jais guide.
6. Is there a "no deposit" or monthly offer?
7. Should AI training crawlers be allowed?
8. Which 16 models are final? They set the slugs.
9. When is the real photo shoot?
10. When does Arabic launch, and who translates? Do other languages (Russian, Chinese) matter?
11. Is there budget for a keyword tool (Ahrefs or Semrush), or Keyword Planner only?
12. Are marketplace listings acceptable, given the commission and the competition with our own site?
13. Who posts on social and replies to reviews?

**Sources:** [Google AI features](https://developers.google.com/search/docs/appearance/ai-features) · [Google retires 7 structured data features (Jun 2025)](https://developers.google.com/search/blog/2025/06/simplifying-search-results) · [FAQ rich results ended (SEJ)](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/) · [AI crawler tokens](https://ppc.land/the-user-agent-strings-every-seo-and-site-owner-needs-right-now/) · [llms.txt and Google](https://ecorpit.com/does-llms-txt-help-seo-google-2026/) · [UAE Advertiser Permit (WAM)](https://www.wam.ae/en/article/bkxzoe1-uae-media-council-launches-advertiser-permit) · [GBP help: business representation](https://support.google.com/business/answer/10514137?hl=en) · [Octane DSO page](https://octane.rent/rent-car-dubai-silicon-oasis/) · [OneClickDrive Urus](https://www.oneclickdrive.com/de/lamborghini-urus-hire) · [Gulf News: tourist licence rules](https://gulfnews.com/ask-gulf-news/ask-gulf-news-driving-in-the-uae-as-a-tourist-licence-rules-car-rentals-and-insurance-1.500388132) · [schema.org UnitPriceSpecification](https://schema.org/UnitPriceSpecification)
