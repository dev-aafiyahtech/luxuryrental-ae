# LuxuryRental.ae: Project Plan

**Version 1 · 23 Oct 2026 (Asia/Dubai) · Approver: Zubair (Adz Tech Solutions) · Status: for approval**

This is the plan for turning the approved prototype into the production site for **Luxuryrentals, Dubai Silicon Oasis**, hosted on **Vercel**. It combines seven specialist sections, listed in [§12](#12-workstream-documents). Where those sections disagreed, this file records the choice in [§4](#4-decisions), and this file wins.

Every price, rule and spec in this plan is an **estimate or assumption for Zubair to confirm**, as the client answers asked. None of it is legal advice.

---

## 1. Summary

- **What we launch:** a 16-car luxury rental site where a visitor picks a car and dates. The site stores a **booking request** and hands the visitor to **WhatsApp** with a reference number. Nothing is charged online until the payment gateway arrives.
- **How the cars look without 3D models:** each car is a few **AI-generated studio images**. The prototype's gold-dust light sculpture is rebuilt by **sampling particles from the car's own image**, so any new car can form from dust, come apart and light up. Adding a car takes about an hour of hands-on work and no code.
- **Launch in two steps, so launch never waits on WebGL:**
  - **M1, Thu 26 Nov 2026:** the full site and booking flow. The homepage chapters are high-quality stills.
  - **M2, Thu 17 Dec 2026:** the cinematic WebGL homepage is switched on with a flag, before the Christmas–New Year peak.
- **Effort:** M1 is about **95 ideal days** of work spread over 7 parallel lanes, with the longest lane about 15 days. M2 adds about 27 days. Phases 2 and 3 follow in Jan–Apr 2027.
- **Running cost:** about **US$30–75 a month in the launch month, then US$20–60** (AED 110–275, then AED 75–220). Vercel Pro is required, and everything else starts on free tiers. The one-off AI image generation for the first 16 cars costs about US$75–140.
- **What we need from Zubair this week:** the [§9](#9-decisions-needed-from-zubair) list. The most urgent items are the logo name, fleet confirmation, the WhatsApp number, account ownership and DNS access.

## 2. Goals and launch criteria

| Goal | Measure | Where it's checked |
|------|---------|--------------------|
| Fast booking | Dates + car → Reserve in **3 taps or fewer** from any car page | Playwright test, plus a 5-person phone test |
| Booking first | Booking UI usable before JavaScript and interactive in **under 2.5 s** on a mid-range Android over 4G | Playwright timing gate in CI |
| Speed | Mobile p75: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 | Lighthouse CI, then Speed Insights field data |
| Accessible | WCAG 2.2 AA on the booking flow and legal pages. Zero serious axe issues. Reduced motion shows every chapter as a still, and a Pause motion control is provided | axe in CI, plus screen-reader passes |
| No lost leads | Every request is stored and emailed to ops **before** the WhatsApp hand-off | e2e test, plus daily reconciliation in launch week |
| Easy fleet changes | A new car goes live with about 1 hour of work. A CMS edit is live in under 60 s | Pipeline timing, webhook test |
| Honest | No fake reviews, prices shown with VAT, AI images labelled, nothing implies a payment was taken | Launch checklist, lawyer review |
| Found | All 16 car pages indexed within 30 days of launch | Search Console |

Business targets such as requests per week and WhatsApp conversion are set after the first month. Until GA4 arrives, they're measured from booking references.

## 3. Scope by phase

| Phase | When | In scope |
|-------|------|----------|
| **M0: Set-up** | 26–30 Oct | Decisions ([§9](#9-decisions-needed-from-zubair)), client-owned accounts, repo scaffold and CI, design-system update for image-based cars, logo concepts, the "golden car" look-dev. Optional: a holding page on luxuryrental.ae with the logo, "Launching soon" and a WhatsApp button, as soon as DNS access arrives |
| **M1: Launch** | Go-live **Thu 26 Nov** | Home (4 chapters as stills), fleet, 8 brand pages, 16 car pages, 5 category pages, chauffeur, delivery (+ DXB and DSO pages), pricing, requirements, about, FAQ, contact, legal pages. 4-step booking request, ops email with one-click Confirm/Decline, WhatsApp hand-off. Pricing engine. Mock payment adapter (no card form on the live site). Sanity CMS. Technical SEO and JSON-LD. Security, monitoring, backups. 16 AI image sets |
| **M2: Cinematic** | Flag on **Thu 17 Dec** | WebGL stage: Burj by Night skyline, Velocity Tunnel, Kinetic Sculpture with image-sampled particles, headlight finale, device tiers, real-device performance pass, per-car OG images |
| **Phase 2** | Jan–Feb 2027 | Payment gateway (hosted checkout, deposit pre-auth, refunds) and a staging environment. Ops console with availability blocks to stop double bookings. GA4 + Meta Pixel with consent. Google Business Profile, Bing Places, directories. Seasonal rates automated before peak ends on 31 Mar. Real photo shoot of the top 5. Car "Views" strip. Secure document upload. Area delivery pages and guides |
| **Phase 3** | Mar–Apr 2027 | **Arabic (RTL)** site, legal pages and SEO. WhatsApp Business API. E-signed rental agreement and condition report. Customer accounts. Fines and Salik reconciliation. Re-evaluate UAE hosting for booking data. Evaluate a true 360° view for the top 5 |

**Not in scope until asked:** 3D car models, a reviews section (until there are real reviews), live inventory or instant booking, languages beyond English and Arabic.

The plan follows the `launch` skill's "Simple, Lovable, Complete" gate. M1 does one job, requesting a specific luxury car for specific dates, and does it completely. The cinematic layer and payments are not allowed to hold that back.

## 4. Decisions

**Platform and hosting**

| ID | Decision | Why |
|----|----------|-----|
| D-01 | **Vercel Pro from day one**, under a team owned by Luxuryrentals, with the agency as a Member. 1–2 paid seats (US$20 each) | Vercel's Hobby terms forbid commercial sites and paid builds |
| D-02 | **One Next.js 16 App Router app** at the repo root, with TypeScript and Tailwind 4 tokens from MASTER.md. Versions are re-verified at kickoff | One deploy covers static pages and booking code |
| D-03 | Public pages are **prerendered and refreshed on demand** by a signed CMS webhook. Prices are never served stale. The booking dock is a real form that works before JavaScript | CDN speed for every visitor; booking is never blocked by heavy code |
| D-04 | **Sanity (free plan)** for content. The Studio is hosted at `luxuryrentals.sanity.studio`, not embedded in the site. **No personal data in Sanity** | Best image pipeline, editors need no developer, keeps the site bundle small. Free datasets are public |
| D-05 | **Booking data in Neon Postgres (Frankfurt)** via the Vercel Marketplace, with functions in `fra1` | Neon has no Gulf region, and Vercel's Dubai region (`dxb1`) is reported unavailable. Standard Postgres can move to a UAE host later by changing the connection string. **UAE lawyer sign-off on EU storage is a launch gate** |
| D-06 | **Email via Resend** from `bookings@luxuryrental.ae`. **DNS stays at the .ae registrar**: we add records and don't move nameservers | Keeps any existing email and DNSSEC safe and independent of the Vercel account |
| D-07 | Canonical host is **`www.luxuryrental.ae`**; the bare domain 308-redirects to it | Vercel's recommended setup. The SEO section preferred the bare domain; either works, but the choice must be fixed before Search Console submission |

**Booking, pricing and payments**

| ID | Decision | Why |
|----|----------|-----|
| D-08 | Every booking is a **request**: stored → ops emailed → WhatsApp hand-off with the reference → ops confirm → pay at handover or by link. Copy never says "booked" or "reserved" before confirmation | Matches how the business works today; there is no live availability to promise against |
| D-09 | **Payment adapter with a mock provider.** No card fields and no demo checkout on the live site; the demo runs only on previews. Live wording: "Nothing is charged on this website. Pay at handover or by secure link after confirmation." | The gateway is decided last, and a fake card form would make real customers think they'd paid |
| D-10 | **One pricing module** used by both browser and server. Prices are VAT-inclusive round AED. Ladder: 3–6 days at 93%, 7 days = 6× daily, 30 days = 20× daily. The deposit is shown separately. **Launch publishes the peak rate card** (+15%, Nov–Mar); seasonal automation comes in Phase 2 | Preview and final quote can't drift apart; UAE rules require VAT-inclusive consumer prices |
| D-17 | Spam protection uses Vercel BotID, a firewall rate limit, a honeypot and a per-phone limit. **No CAPTCHA.** Anyone blocked by mistake sees a WhatsApp button | Included in Pro; no lost leads |
| D-23 | Booking references look like **`LR-7K3QZM`** (6 unambiguous characters) | Short, readable on WhatsApp, reveals nothing |

**Cars, visuals and homepage**

| ID | Decision | Why |
|----|----------|-----|
| D-11 | **AI images, no 3D.** MVP needs 3 images per car (front 3/4, side, cockpit); the top 5 get 3 more. Everything else (cutout, depth, layers, sampling maps, social image) is derived by a script. **Never mirror a car image**, including in Arabic layouts. Cars are labelled "illustrative" until real photos replace them | Scales to a changing fleet with no 3D budget; honest representation |
| D-12 | The **cinematic stage sits behind a flag.** M1 launches with stills; M2 switches on WebGL. Desktop gets 10k particles (cap 12k), phones 3k, and low-end devices and reduced motion get stills | Launch date is protected; performance is tested on real phones before go-live |
| D-13 | Camera changes from the prototype: it stays **within ±10° of each photo's angle**, the Kinetic Sculpture is shot side-on (the orbit goes), and the 360° viewer becomes a "Views" strip. Colour comes from the car part, not the paint, so all 16 cars read as one sculpture | A 2.5D image tears beyond that angle; bigger moves happen inside the particle cloud |
| D-18 | **Fleet and top 5** as set in [04](workstreams/04-fleet-pricing.md). Top 5: Lamborghini Revuelto, Rolls-Royce Cullinan Series II, Bugatti Chiron Super Sport, Ferrari 296 GTS, McLaren 750S Spider. Bugattis are 2021–24 Chirons from a partner, "price on request". **If no Bugatti partner is confirmed by launch, Bugatti shows "coming soon" and the Purosangue takes hero slot 3** | A hero car must be bookable |
| D-20 | **Chauffeur service** on the Phantom, Cullinan and Bentayga: 3-hour minimum, AED 550–900/hour | Pricing section's researched rates win over the rules section's earlier figures |

**Site, content and compliance**

| ID | Decision | Why |
|----|----------|-----|
| D-14 | **URL map** in [§4.1](#41-url-map) | One map for the build, SEO and the sitemap |
| D-15 | **English at launch, Arabic in Phase 3.** From day one: locale routing (English at `/`, Arabic at `/ar`), message files, CSS logical properties only (lint-enforced), Western digits and DD/MM/YYYY | Arabic becomes a content task, not a rebuild |
| D-16 | At launch, only **cookieless Vercel Web Analytics and Speed Insights**, so no consent banner. A consent manager arrives with GA4 and the Meta Pixel in Phase 2 | No tracking without consent; counsel to confirm |
| D-19 | **Booking rules** as listed in [05](workstreams/05-booking-rules-compliance.md), all marked "assumed, client to confirm" and signed off in an approval log. Examples: drivers 25+, 30+ for Bugatti; deposit held for 21 days (30 for Bugatti); 4-hour notice (72 for Bugatti). Money values (rates, deposits, km) come from [04](workstreams/04-fleet-pricing.md); policy values (excess, release timing, cancellation) from [05](workstreams/05-booking-rules-compliance.md) | One source per fact |
| D-21 | **Prototype claims fixed:** "Salik tolls and full insurance included" becomes "Comprehensive insurance included". "Reservation held" becomes "Request sent". "We confirm within 15 minutes" becomes "We reply on WhatsApp, usually within 1 hour, 09:00–22:00" until ops commits to something faster. The rooftop handover and DXB T3 valet are removed unless ops confirms them | Every line on the site is a promise under UAE consumer law |
| D-22 | **Trademarks:** brand names appear as text only, with no manufacturer logos as graphics and no "official" or "authorised" wording. A footer disclaimer is added. Our logo avoids wings, shields, horses, bulls and tridents | Identifies the cars without implying affiliation |
| D-24 | **WCAG 2.2 AA is a launch gate**, including a Pause motion control for the ambient gold dust and streaks | Required by WCAG 2.2.2, and right for a motion-heavy site |
| D-25 | **Data minimisation:** no ID or licence uploads at MVP (documents are checked at handover). Retention follows [05 §5](workstreams/05-booking-rules-compliance.md#5-data-handling-plan-for-booking-requests); for example, requests that never become rentals are deleted after 90 days | Least risk while data sits in the EU |
| D-26 | **CI:** Vercel builds and deploys; GitHub Actions runs lint, types, unit tests, audit, secrets scan, contrast, Playwright, axe and Lighthouse. All must pass before merge to `main` | A bad deploy can't reach customers; rollback is one click |

### 4.1 URL map

| URL | Page | Phase |
|-----|------|-------|
| `/` | Home: 4 chapters, then fleet strip, how it works, FAQs | M1 |
| `/cars` | Fleet (filters are query parameters, canonical to `/cars`) | M1 |
| `/cars/{brand}` | 8 brand pages, e.g. `/cars/lamborghini` | M1 |
| `/cars/{brand}/{model}` | 16 car pages, e.g. `/cars/lamborghini/revuelto` (model-family slugs, no year or colour) | M1 |
| `/cars/type/{hypercars,supercars,convertibles,grand-tourers,suvs}` | Category pages (no chauffeur category; the filter links to `/chauffeur`) | M1 |
| `/chauffeur` | Chauffeur service | M1 |
| `/delivery`, `/delivery/dubai-airport-dxb`, `/delivery/dubai-silicon-oasis` | Zones, fees, airport handover, home base | M1 |
| `/pricing`, `/requirements` | Fact pages: all rates and fees; age, licence, IDP, documents, deposit | M1 |
| `/book/trip` → `/book/extras` → `/book/driver` → `/book/review` → `/book/confirmed` | Booking request (noindex) | M1 |
| `/booking/{ref}` | Request status, opened from emails with a token (noindex) | M1 |
| `/about`, `/faq`, `/contact` | | M1 |
| `/legal/{terms-of-rental,privacy,cookies,cancellation,terms-of-use,accessibility}` | Legal pages (draft banner until the client's documents arrive) | M1 |
| `/api/bookings`, `/api/revalidate`, `/api/payments/webhook/{provider}`, `/api/health` | Server routes | M1 |
| `/delivery/{area}`, `/chauffeur/{weddings,airport-transfers}`, `/guides/{slug}`, `/offers` | SEO and offers pages | Phase 2 |
| `/ar/...` | Arabic mirror with the same Latin slugs | Phase 3 |

A retired car's page 301-redirects to its successor or its brand page, set in the CMS.

## 5. Timeline

All dates are Asia/Dubai, Monday–Friday weeks. The timeline assumes the "this week" answers in [§9](#9-decisions-needed-from-zubair) arrive by **Fri 30 Oct**. Each week of delay on those moves go-live by about a week.

| Week | Dates | Build | Zubair's approvals |
|------|-------|-------|--------------------|
| 0 | 26–30 Oct | Accounts (Vercel, Sanity, Neon, Resend, Sentry). Scaffold and CI. CMS schema. Booking-rules config. Design-system rewrite for image-based cars. Logo concepts. Studio plate, prompt kit and golden car | Answers to §9. Logo direction. **Golden car look, approved in-engine** |
| 1 | 2–6 Nov | UI components (date picker, forms, sheets). Car, fleet and brand pages. Pricing engine and tests. Asset script. Image batch starts (brand pairs). Copy and legal drafts. Holding page live if DNS is ready | Final logo. Contact sheet of the first 8 cars |
| 2 | 9–13 Nov | Booking flow, API, ops emails, WhatsApp hand-off. Homepage chapters as stills. Content loaded. Technical SEO. Image batch done | **Content freeze Fri 13 Nov:** 16 cars, prices, rules, copy |
| 3 | 16–20 Nov | Integration. e2e, accessibility and performance gates. Lawyer review pack sent. WebGL lane starts (M2) | **UAT on your phone, Wed 18–Fri 20 Nov.** Lawyer feedback back |
| 4 | 23–26 Nov | Fixes. Launch checklist ([§10](#10-launch-checklist)). DNS and email cut-over. Rollback rehearsal. **Go-live Thu 26 Nov** | Go/no-go on Wed 25 Nov |
| 5–7 | 30 Nov–17 Dec | Cinematic stage built, tested on real phones, then the flag is switched on **Thu 17 Dec**. Search Console and Bing set-up. Review-request workflow. Super-peak rate update (20 Dec–5 Jan, +30%) | Cinematic sign-off on Tue 15 Dec |
| Phase 2 | Jan–Feb 2027 | See [§3](#3-scope-by-phase). Seasonal rates must be live before 1 Apr | Gateway choice, analytics accounts, photo-shoot budget |
| Phase 3 | Mar–Apr 2027 | Arabic and the remaining Phase 3 items | Translator, WhatsApp Business verification |

**Critical path:** fleet confirmation → golden car approval → 16 image sets → content freeze → UAT → lawyer sign-off → DNS cut-over. Code is not on the critical path. Approvals and access are.

## 6. Workstreams and effort

Effort is in **ideal days**: focused work, with no waiting. Overlaps between the specialist sections have been removed. Lanes run in parallel, either as Claude agents or as developers, using the agents and skills in [§7](#7-who-does-what-agents-and-skills).

| # | Workstream | M1 | M2 | Main tasks (details in the linked section) |
|---|-----------|----|----|---------------------------------------------|
| W1 | Platform and Vercel ops | 6 | – | Pro team, env vars, Neon branches per preview, CI workflows, Sentry, uptime, headers and CSP, backups, domain and email ([02](workstreams/02-vercel-devops.md)) |
| W2 | CMS and data model | 5 | – | 9 content types plus image slots, publish gates, revalidation webhook, draft preview ([01 §1.3](workstreams/01-architecture.md#13-cms-keep-sanity)) |
| W3 | Front end | 13 | – | Primitives and about 24 new form components, all pages in §4.1, static homepage chapters, posters ([01](workstreams/01-architecture.md), [06](workstreams/06-ux-content.md)) |
| W4 | Booking, pricing, rules | 14 | – | Rules config, pricing engine with property tests, booking API and state machine, ops email actions, WhatsApp link, mock payments, spam controls, retention jobs ([01 §1.4–1.6](workstreams/01-architecture.md#14-booking-flow), [05](workstreams/05-booking-rules-compliance.md)) |
| W5 | Car visuals | 11.5 | 13.5 | Look-dev, prompt kit, `lr-assets` script, 16 car sets plus top-5 extras, labels. M2: layer tool, particle sampler, photo plate, chapter integration, tiers ([03](workstreams/03-car-visuals.md)) |
| W6 | Design system, UX, brand | 15 | – | MASTER rewrite, 6 page overrides, RTL rules, wireframes, component specs, states, SVG logo pack ([06](workstreams/06-ux-content.md)) |
| W7 | Content and copy | 7 | – | 16 car texts, 8 brand and 5 category intros, homepage, chauffeur, delivery, pricing, requirements, about, about 28 FAQs, about 120 UI strings ([06 §6.6](workstreams/06-ux-content.md#66-content-inventory), [07](workstreams/07-seo-launch.md)) |
| W8 | SEO and visibility | 6 | 1.5 | Metadata, robots, sitemap, JSON-LD, OG images, llms.txt, image hygiene, Search Console and Bing, pre-launch crawl ([07](workstreams/07-seo-launch.md)) |
| W9 | Legal and compliance | 8.5 | – | Legal page templates and drafts, consent and log, footer disclosures, accessibility statement, processing record and breach plan, lawyer pack, sign-off log ([05](workstreams/05-booking-rules-compliance.md)) |
| W10 | QA and launch | 9 | 12 | e2e, axe, device matrix, tap-count test, launch checklist, cut-over, launch-week monitoring. M2: stage infrastructure (render loop, scroll store, tiers, lazy load), skyline and tunnel port, budgets in CI, real-device performance |
| | **Total** | **≈ 95** | **≈ 27** | Phase 2 ≈ 55–65 and Phase 3 ≈ 40–45 days, re-planned after launch |

The specialist sections' own totals (for example architecture M1 35.5, visuals MVP 25) are larger in sum, because they double-count shared tasks. The table above is the de-duplicated figure.

## 7. Who does what: agents and skills

The same agents and skills that wrote this plan carry out the build. Zubair approves.

| Workstream | Lead agent | Supporting agents | Skills |
|-----------|-----------|-------------------|--------|
| Plan, tracking, weekly status | Senior Project Manager | Project Shepherd | `launch` |
| W1 Platform and Vercel | DevOps Automator | Senior SecOps Engineer | `security-review` before launch |
| W2 CMS and data | Software Architect | Backend Architect | |
| W3 Front end | Frontend Developer | UX Architect, UI Designer | `ui-ux-pro-max`, `design-system`, `ui-styling` |
| W4 Booking and pricing | Backend Architect | Payments & Billing Engineer (Phase 2 gateway), API Tester | `code-review` |
| W5 Car visuals | Technical Artist | Image Prompt Engineer, 3D & Scene Developer (M2), Performance Benchmarker | `image` |
| W6 Design system and brand | UX Architect | Brand Guardian, UI Designer | `brand`, `design` (logo), `ui-ux-pro-max` |
| W7 Content and copy | Content Creator | SEO Specialist | `copywriting`, `copy-editing` |
| W8 SEO and visibility | SEO Specialist | AEO Foundations Architect | `seo-audit`, `schema`, `ai-seo`, `site-architecture`; `programmatic-seo` for Phase 2 area pages |
| W9 Legal and compliance | Legal Compliance Checker | Privacy Engineer. **A UAE lawyer and tax advisor (external) must review** | |
| W10 QA and launch | Test Automation Engineer | Accessibility Auditor, Evidence Collector, Reality Checker (go/no-go) | `launch` (site-launch QA), `code-review` |
| Phase 2 analytics | Tracking & Measurement Specialist | | `analytics`, `conversion-tracking` |
| Phase 3 Arabic | Internationalization Engineer | Arabic translator (client nominates) | |

## 8. Budget

**Monthly running cost** (US$, excluding VAT; details in [02 §9](workstreams/02-vercel-devops.md#9-cost-monthly-usd-excl-vat)):

| Service | Plan | Per month |
|---------|------|-----------|
| Vercel | Pro, 1–2 deploying seats; usage mostly covered by the included US$20 credit | 20–40, plus 0–20 if traffic passes the base CDN tier |
| Speed Insights Plus | Launch month only, to prove the speed targets on real phones | 10–13, then 0 |
| Sanity, Neon, Resend, Sentry, Better Stack, GitHub Actions | Free tiers, each with a stated upgrade trigger | 0 |
| **Total** | | **≈ 30–75 in the launch month (AED 110–275), then ≈ 20–60 (AED 75–220)** |

**One-off costs:**
- AI image generation for 16 cars, about US$75–140.
- UAE lawyer and tax advisor review, client-arranged and not estimated here.
- Phase 2 options: real photo shoot of the top 5, a keyword tool, Neon's paid plan for 7-day restore once bookings pass about 100 a month (about US$3–5 a month).

**Free-tier limits to watch:** Resend allows 100 emails a day, about 50 bookings, before it costs US$20 a month. Sanity stops at its limits rather than billing. Vercel spend alerts are set at US$50.

## 9. Decisions needed from Zubair

The specialist sections raised about 70 questions. These are the ones that block work, in order. The full lists are at the end of each section.

> **23 Oct 2026:** Zubair answered questions 1–7. See [plan-answers.md](../brief/plan-answers.md): wordmark "LuxuryRental.ae", AI images for all 16 cars (all in the fleet), Bugatti confirmed, top 5 and prices approved, WhatsApp +971 52 965 2722, Zubair owns Vercel, DNS access later (needed by Fri 20 Nov).

**This week (by Fri 30 Oct): these block the build**

1. **Logo name:** should the wordmark read "Luxuryrentals" (trade name) or "LuxuryRental.ae" (domain)? Default: Luxuryrentals, with the domain beneath. Also, do you own luxuryrentals.ae?
2. **Fleet:** are all 16 cars physically in the fleet now? For each car: model year, paint, wheels and interior. Five phone photos per car are needed as image references.
3. **Bugatti:** is there a partner owner, and can the car be insured for rental? If not, show "coming soon" and use the Purosangue as hero slot 3.
4. **Top 5 and prices:** approve the top 5 and the launch rate card in [04](workstreams/04-fleet-pricing.md#7-recommended-rates-estimates). Launch would use peak rates.
5. **WhatsApp:** which number takes bookings, the staffed hours, and the reply time you can promise.
6. **Accounts:** who owns the Vercel team and whose card pays? One or two deploying seats? Sanity, Neon and Resend should also be client-owned, with the agency invited.
7. **Domain:** the registrar, and read access to DNS **now** rather than at the production push. Does the domain already have email? www or bare domain?
8. **Prototype promises:** keep or drop "Salik included", "confirm within 15 minutes", rooftop handover and DXB T3 valet ([D-21](#4-decisions)).
9. **Payments wording:** approve "Nothing is charged on this website. Pay at handover or by secure link after confirmation" with no demo checkout on the live site.

**Before content freeze (Fri 13 Nov)**

10. Can customers collect from the DSO office, and is there signage? This affects delivery fees and the Google Business listing.
11. Legal entity name, trade licence number and issuing authority, RTA permit number, VAT TRN and full address, for the footer and schema.
12. Insurer terms: driver age and licence-years rules, excess per car, and Full Cover availability.
13. Deposit method: credit-card pre-authorisation at handover (assumed)? And how is any advance collected before the gateway exists?
14. Sign-off of every rule in [05 §1](workstreams/05-booking-rules-compliance.md#1-booking-rules-sheet), recorded in the approval log.

**Before launch (by Fri 20 Nov)**

15. Send the real T&Cs, privacy policy and rental agreement, and arrange the UAE lawyer review. The lawyer should cover the assumed rules, EU storage of booking data, the AI-image labels and brand use, and whether any Arabic price or terms text is required at launch.
16. Who receives ops emails and alerts, and on which channel?

**Later (Phase 2 or 3):** payment gateway shortlist; analytics and Google Business accounts; budget for a real photo shoot; who produces car images after launch (in-house or agency); Arabic translator and timing; whether to list on marketplaces; whether to allow AI training crawlers.

## 10. Launch checklist

This merges the `launch` skill's site-launch QA with the specialist sections. Every item must pass before go-live; the owner is in brackets.

**Content and claims**
- [ ] 16 cars, 5 hero picks, prices and rules published, with no `000` placeholders left. The build fails if any remain [Ops]
- [ ] Every rule and price has a "confirmed" entry in the approval log, and the lawyer's feedback has been applied [Owner]
- [ ] Prototype claims fixed (D-21). AI-image labels and the trademark disclaimer are live [Content]
- [ ] Legal pages live, with a draft banner if the client's text hasn't arrived. Privacy notice names the processors and EU storage [Owner]

**Booking**
- [ ] A production test booking: form → database row → ops email in the Gmail and Outlook inboxes (not spam) → WhatsApp opens the right number with the reference. Test row deleted afterwards [Ops]
- [ ] Ops email Confirm and Decline links work. Bot protection doesn't block a real phone [Dev]
- [ ] Tap count is 3 or fewer from a car page. Booking UI is usable in under 2.5 s on a real mid-range Android and an iPhone over UAE 4G [QA]

**Quality**
- [ ] All CI checks green on the release commit: lint, types, unit, audit, secrets, contrast, e2e, axe, Lighthouse [Dev]
- [ ] Keyboard-only and screen-reader passes on the booking flow. Reduced motion and Pause motion work [QA]
- [ ] Safari, Chrome and the Instagram and WhatsApp in-app browsers checked at 375–1440 px [QA]

**SEO**
- [ ] Production is indexable and previews are not. Canonicals point to www. Sitemap lists production URLs only [Dev]
- [ ] JSON-LD validates. OG images render in a real WhatsApp share [SEO]
- [ ] Search Console and Bing Webmaster Tools verified, sitemaps submitted [SEO]

**Infrastructure**
- [ ] Vercel team client-owned, billing card on file, US$50 spend alert set [Owner]
- [ ] www primary, bare domain 308-redirects, certificates valid, HSTS sent. Email records pass SPF, DKIM and DMARC [Dev]
- [ ] Sentry release tagged, uptime monitors green, one backup and one restore drill completed [Dev]
- [ ] Instant Rollback rehearsed once on production before the launch is announced [Dev]

**Launch week:** daily reconciliation of database rows, ops emails and WhatsApp leads. Errors checked twice a day. Speed Insights, firewall and usage reviewed. Retro on day 7. Details in [02 §8](workstreams/02-vercel-devops.md#8-release-process).

## 11. Top risks

| Risk | Mitigation |
|------|-----------|
| Assumed rules or prices go live and contradict the real agreement, insurer or RTA terms | Approval log before launch, lawyer review, "from" wording, one price field per car |
| AI images misrepresent a car, or brand use draws a trademark complaint | Owner photos as references, a QA gate in the CMS, labels, brand names as text only, a fast swap path to real photos (Phase 2) |
| Bugatti can't be sourced or insured | "Coming soon" status; Purosangue takes the hero slot |
| Approvals or DNS access arrive late | Fixed approval dates in §5; DNS records prepared in advance so the cut-over takes 30 minutes |
| Booking data stored in the EU under the UAE PDPL | Minimum data, explicit consent, named processors, lawyer sign-off, portable Postgres |
| WebGL too heavy for mid-range phones | Behind a flag, three device tiers, CI budgets, real-device testing before M2 goes live |
| Double bookings with no availability system | Request wording, ops confirmation, availability blocks in Phase 2 |
| A mock payment is taken for a real one | No card UI on the live site, ever |
| Free-tier caps (Resend 100 emails a day) | Usage alerts; upgrade paths priced in §8 |
| No reviews at launch, against established competitors | Long-tail model, chauffeur and DSO pages; social; a review request after every rental |

## 12. Workstream documents

Each section was drafted by a specialist agent from the repo's brief, design system and prototype. The banner at the top of each lists where this plan overrides it.

| # | Section | Agent (skills) |
|---|---------|----------------|
| 01 | [Technical architecture](workstreams/01-architecture.md) | Software Architect |
| 02 | [Delivery, Vercel and operations](workstreams/02-vercel-devops.md) | DevOps Automator |
| 03 | [Car visuals: image-based pipeline](workstreams/03-car-visuals.md) | Technical Artist (`image`) |
| 04 | [Fleet and pricing](workstreams/04-fleet-pricing.md) | Pricing Analyst (web research, 23 Oct 2026) |
| 05 | [Booking rules, policies and UAE compliance](workstreams/05-booking-rules-compliance.md) | Legal Compliance Checker |
| 06 | [Site architecture, UX and content](workstreams/06-ux-content.md) | UX Architect (`ui-ux-pro-max`, `site-architecture`, `cro`) |
| 07 | [SEO, AI search and launch visibility](workstreams/07-seo-launch.md) | SEO Specialist (web research) |

The phasing and launch checklist use the `launch` skill.

### Where the sections disagreed

| Topic | Options in the sections | Plan picks |
|-------|------------------------|-----------|
| URLs | `/cars/[slug]` + `/brands/` + `/reserve` (01); `/cars/{brand}/{model}` + `/book/*` (06); `/brands/` + `/categories/` (07); `/supercars`, `/rent-ferrari-dubai` (04) | §4.1: hierarchical `/cars/...` with `/book/*` |
| Canonical host | www (02); bare domain (07) | www (D-07) |
| Sanity Studio | Embedded `/studio` (01); hosted `*.sanity.studio` (02) | Hosted (D-04) |
| Top 5 | Fleet section's list (04); a working list with an SF90, which isn't in the fleet (06) | 04's list (D-18) |
| Chauffeur pricing | 4-hour minimum from AED 450/h (05); 3-hour minimum, AED 550–900/h (04) | 04 (D-20) |
| Deposit release | 14–21 days (04); 21 days, 30 for Bugatti (05) | 05 (D-19) |
| Particles and camera | 8k desktop, ±30° yaw, paint-tinted (01); 10k, ±10°, colour by part (03) | 03 (D-12, D-13) |
| Driver minimum age | 21+, 25+ for supercars (06); 25+, 30+ for Bugatti (05) | 05 (D-19) |
| Booking reference | `LR-261024-K7QM` (06); `LR-7K3QZM` (01) | `LR-7K3QZM` (D-23) |
| Retention | 90 days unconverted, 5 years completed (01); flat 24 months (02); per-record table (05) | 05 (D-25) |
| Seasonal pricing | Peak rates from 1 Nov (04); seasonal rates in Phase 2 (01) | Launch with the peak rate card; automation in Phase 2 (D-10) |
