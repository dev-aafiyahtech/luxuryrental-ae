# 02 · Delivery, Vercel and operations

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **DevOps Automator** agent. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - Route names in the CI examples (`/fleet`, `/book`) become `/cars` and `/book/trip` (D-14); the booking endpoint is `/api/bookings`.
> - Data retention follows [05 §5](05-booking-rules-compliance.md#5-data-handling-plan-for-booking-requests), not a flat 24 months.
> - The Dubai-region findings are reported, not confirmed by Vercel; re-check at kickoff. The Frankfurt decision holds either way, because Neon has no Gulf region.

LuxuryRental.ae production plan, section 2. Draft, 23 Oct 2026. Assumed stack (being finalised by the architect): one Next.js App Router app in `dev-aafiyahtech/luxuryrental-ae`, Sanity for content, Postgres from the Vercel Marketplace (Neon assumed below), Resend for transactional email. Payments are simulated and the site is English first.
**[V]** means checked on the vendor's own page on 23 Oct 2026. **[U]** means unverified: an estimate or a third-party source, to be confirmed before anyone relies on it. Prices are USD excluding VAT (1 USD = 3.6725 AED). The sizing assumes 20k visits/month at launch, about 70% of them on mobile **[U]**.

## 1. Vercel plan

**Decision: Pro from the first day of the build, not just from launch.** Hobby is "restricted to non-commercial personal use". The terms count "advertising the sale of a product or service" and "receiving payment to create, update, or host the site" as commercial [V], so both the live site and the paid build need Pro.

| Item | Pro terms [V] | Our setting |
|---|---|---|
| Platform fee | $20/month. Includes 1 deploying seat and $20 of usage credit, which resets monthly and doesn't roll over | 1 team, 1 project |
| Extra Owner/Member seat | $20/month each | Each person who pushes deploying commits needs one. Vercel blocks deploys from commit authors outside the team on private repos [U] |
| Viewer seat | Free and unlimited. Can open previews, read analytics and comment | Client staff |
| Spend management | Alerts by default at $200 of on-demand spend | Set the alert to $50 (email + SMS). **Don't auto-pause**: pausing takes the site offline |

**Seats: 2 paid seats, $40/month.** The Owner is Luxuryrentals' business account (Zubair), which holds billing, domains and the final say. The lead developer is a Member. One seat ($20) is enough only if the same person owns the team and deploys.

| Resource | Pro allowance / rate [V] | Expected use | How we keep it low |
|---|---|---|---|
| CDN requests + Fast Data Transfer | Pro includes the base Flat Rate CDN tier: 1M requests and 1 TB/month. Overrunning it moves the team to the $20 tier (10M requests, 50 TB) at the next cycle. The pricing-page summary says 10M requests are included, which conflicts with the docs; confirm in Billing | ~1.0–1.4M requests (40–70 per visit: JS chunks, prefetch, fonts, mobile video), ~150 GB [U] | Serve images from Sanity's CDN (doesn't count against Vercel), limit `<Link>` prefetch on the fleet grid, cache assets as immutable |
| Function invocations, Active CPU | $0.60 per 1M invocations; Active CPU from $0.128/h ($0.14/h in `bom1`) | <50k/month (booking, revalidate, draft mode, health) | Static/ISR public routes; no SSR on public pages |
| Image Optimization | $0.05 per 1K transformations; $0.40 per 1M cache reads; $4 per 1M cache writes | <2k transformations | A custom `next/image` loader sends CMS images to the Sanity image CDN. Vercel only optimises local static images. `minimumCacheTTL` 31 days, trimmed `deviceSizes` |
| Web Analytics | No events included on Pro; $0.03 per 1K events | ~70k events ≈ $2 | Paid from the $20 credit |
| Speed Insights | Free tier: RES (Real Experience Score) only, 10K events per rolling 30 days, then collection pauses for at least 14 days. Plus: $10/project/month + $0.65 per 10K events | See §6 | `sampleRate` setting |

**Expected Vercel bill: $20–40 base + $0–20 CDN tier + $0–13 Speed Insights Plus, so $20–73/month; typically $40–60.**

## 2. Project setup

There is one project, `luxuryrental-ae`: Next.js preset, Node 24 LTS pinned in `engines`, Git integration with the GitHub repo. Any setting that can live in code does (`vercel.json` for regions, `next.config.ts` for headers and redirects, the workflows). Dashboard-only settings (domains, firewall rules, env vars, protection) get written down in `docs/ops/vercel-settings.md`.

| Environment | Source | URL | Data | Protection |
|---|---|---|---|---|
| Production | `main` | www.luxuryrental.ae | Neon `main` branch; Sanity `production` dataset | Public |
| Preview | every PR or branch push | `luxuryrental-ae-git-<branch>-<team>.vercel.app` | One Neon branch per preview (Marketplace preview branching, cleanup on, free cap 10 branches [V]); Sanity `production` + draft mode | Standard Protection with Vercel Authentication, free on all plans [V]. Viewers sign in, or use a shareable link |
| Development | local `next dev` | localhost | Neon `dev` branch via `vercel env pull` | n/a |

- **Branch strategy: trunk-based.** Short-lived feature branch → PR → squash merge into `main` → production. **No long-lived `staging` branch at MVP.** PR previews are already production-like, and one developer doesn't need a second merge queue. A Vercel custom environment `staging` comes in Phase 2, when the payment gateway's sandbox needs a stable callback URL.
- **Env vars live only in Vercel.** Secrets are marked Sensitive (write-only), and `.env*` is already in `.gitignore`. Only the Owner sets production values.

| Variable | Scope | Sensitive | Note |
|---|---|---|---|
| `DATABASE_URL` | all (one per branch in Preview) | yes | Injected by the Neon integration. The `app` role can only touch the booking tables |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET` | all | no | Dataset `production` everywhere; a second dataset, `development`, is for schema work |
| `SANITY_API_READ_TOKEN` / `SANITY_REVALIDATE_SECRET` | all / Production | yes | Viewer-role token for draft mode / HMAC secret for the webhook |
| `RESEND_API_KEY` | separate keys for Production and Preview | yes | Sending access only, scoped to the domain |
| `BOOKING_NOTIFY_TO` | Prod: ops inbox; Preview: `delivered@resend.dev` | no | Previews never email real people |
| `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SENTRY_DSN` | all | no | |
| `SENTRY_AUTH_TOKEN` | build | yes | Uploads source maps at build time |
| `E2E_BYPASS_KEY` | Preview only | yes | Lets Playwright skip BotID on previews. Never set in Production |

**Function region: findings.** Vercel launched a Dubai region, `dxb1` (on AWS me-central-1), on 16 Jun 2025 [V]. Physical strikes from 1 Mar 2026 knocked out two of me-central-1's three availability zones, and the region was still not fully restored in Sep 2026 [U, press reports]. `dxb1` no longer appears in Vercel's region list (updated 11 Aug 2026, 19 regions) [V], and a 3 Sep 2026 report quotes "The region dxb1 is currently unavailable" [U]. **Treat `dxb1` as unavailable, and re-check it every quarter.**

**Decision: functions run in the database's region. The default is `fra1` (Frankfurt) with Neon `aws-eu-central-1`.**

| Option | Round trip from Dubai [U] | Postgres via the Marketplace | Cost | Legal position |
|---|---|---|---|---|
| `fra1` Frankfurt | ~110–130 ms | Neon Frankfurt: free tier, preview branching [V] | $0 | EU/GDPR jurisdiction, the strongest argument for "adequate protection" |
| `bom1` Mumbai | ~30–45 ms | Neon has no Mumbai region [V]. Supabase has one, but free projects pause after about 7 idle days [U], which effectively means Pro at $25 | +$25 | India's DPDP Act; adequacy unclear |

Frankfurt is fast enough here. Public pages are static/ISR and served from Vercel's CDN (126 points of presence [V]). Only the booking POST, revalidation and draft mode reach the function, so the extra ~90 ms is one round trip when a booking is submitted, well inside the 2.5 s budget. If the architect picks a Mumbai database, switch to `bom1` and keep the same rule. Pro allows up to 5 regions, but automatic failover is Enterprise-only [V], so we use a single region.

**Data residency.** Booking PII (name, phone, email, dates, car, delivery area) will be stored outside the UAE. DSO is not DIFC or ADGM, so the federal PDPL (Decree-Law 45/2021) applies [U]. The PDPL allows transfers to jurisdictions with adequate protection, or under contract or consent. Reports on the status of its executive regulations conflict in 2026, and one law firm cites a full-compliance date of 1 Jan 2027 [U].
- Mitigations: collect the minimum (no licence or passport uploads at MVP; documents are checked at handover); an explicit consent checkbox that says the data is stored in the EU; a privacy policy naming the processors (Vercel, Neon, Resend, Sentry); 24-month retention enforced by a purge job; PII scrubbing in Sentry.
- **Sign-off from UAE counsel is a launch gate.**

## 3. Domain and DNS (luxuryrental.ae)

- **The canonical host is `https://www.luxuryrental.ae`; the apex 308-redirects to www** (set as a Vercel domain redirect). Vercel recommends www on a CNAME: a CNAME lets Vercel steer traffic for DDoS protection and performance, while an A record pins a fixed IP [V]. Chrome hides "www", and printed material can still say luxuryrental.ae. If the client prefers the apex, switch before submitting to Search Console.
- **DNS stays at the client's .ae registrar; we add A and CNAME records instead of moving to Vercel nameservers.** That avoids a nameserver change through the .ae registry, and it keeps DNS and email independent of the Vercel team and its billing. It also keeps DNSSEC available: Vercel nameservers only work with DNSSEC turned off at the registrar [U]. Fall back to `ns1/ns2.vercel-dns.com` only if the registrar's DNS editor can't hold a long DKIM TXT record.
- **SSL.** Vercel issues and renews certificates for both hosts once DNS resolves. Send HSTS `max-age=63072000; includeSubDomains`. Add `preload` in Phase 2, after a month of stable HTTPS.

| Host | Type | Value | Purpose |
|---|---|---|---|
| `@` | A | `76.76.21.21`, or the value shown on the Vercel domain card [V] | Apex → Vercel (redirect to www) |
| `www` | CNAME | The project-specific `…vercel-dns-0xx.com` value from the domain card [V] | The site |
| `send` | MX 10 | `feedback-smtp.<region>.amazonses.com` (copy from Resend) | Resend bounce / return-path domain |
| `send` | TXT | `v=spf1 include:amazonses.com ~all` (copy from Resend) | SPF for the return path, aligned with the root domain |
| `resend._domainkey` | TXT | DKIM key from Resend | DKIM signing with `d=luxuryrental.ae` |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:<report address>; adkim=r; aspf=r` | Monitor first. `p=quarantine` at launch + 14 days, `p=reject` at + 45 days |
| `@` | MX / TXT | The existing mailbox provider's records, left untouched | Only if mailboxes already exist |
| `@` | CAA | If any CAA record exists, it must allow `letsencrypt.org` [U] | Certificate issuance |

**Email.** Send as `Luxuryrentals <bookings@luxuryrental.ae>`, with Reply-To set to the ops inbox, from Resend's EU region to sit near `fra1` [U]. The email is sent after the response, using Next.js `after()`, so email latency never delays the booking confirmation. If the domain has no mailboxes, DMARC `rua` reports go to a free report service, because a report address on another domain needs an authorisation record there.

**Cut-over.** There's no live site, so the only thing that can break is email that already exists.
1. Three days before: get registrar access. Record the registrant (it must be the client's legal entity) and the expiry date, turn on auto-renew and the transfer lock, and export the zone (`dig` for NS/MX/TXT/DS, plus screenshots).
2. Add `www.luxuryrental.ae` and `luxuryrental.ae` to the Vercel project, set the redirect, and copy the exact record values Vercel shows.
3. Add the Resend records, verify the domain in Resend, and score a test email on mail-tester (target ≥ 9/10) [U].
4. Add the A and CNAME records with TTL 300, then wait until Vercel shows "Valid Configuration" with certificates issued (minutes to a few hours).
5. Smoke test: `curl -sI https://luxuryrental.ae` should return a 308 to `https://www.luxuryrental.ae/`, which returns 200 with an HSTS header. Then submit a test booking.
6. After 48 h, raise the TTLs to 3600 and verify the domain in Search Console with a DNS TXT record.

## 4. CI on GitHub Actions + Vercel

**Decision: Vercel's Git integration builds and deploys; GitHub Actions only runs checks.** No Vercel deploy token has to live in GitHub, preview links post to PRs automatically, and Actions minutes stay low.

| Workflow | Trigger | Jobs (time) |
|---|---|---|
| `ci.yml` | `pull_request`, push to `main` | Cached pnpm install, then `lint` (ESLint + Prettier), `typecheck` (`tsc --noEmit`), `unit` (Vitest: price and deposit maths, lead-time and minimum-rental rules, Zod schemas, webhook signature check), `audit` (`pnpm audit --prod --audit-level=high`), `gitleaks`, `contrast` (~4 min) |
| `e2e.yml` | `deployment_status` = success. Full suite on Preview; `@smoke` only when `deployment.environment` starts with "Production" | Playwright against `deployment_status.target_url`, sending `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie: true` (~6 min) |
| `lighthouse.yml` | `deployment_status` = success, Preview | Lighthouse CI, mobile preset, 3 runs on each of `/`, `/fleet`, one car page and `/book`; the bypass header goes in `extraHeaders` (~4 min) |
| `backup.yml` | Nightly cron, 02:15 GST | See §7 |

The Playwright suite reuses `qa/scripts/shoot.mjs`:
- It launches Chromium with the flags from shoot.mjs (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`) so WebGL runs headless. As in the prototype QA, there are three projects: desktop 1440×900, mobile 390×844 with touch, and reduced motion.
- Checks ported from shoot.mjs: no console or page errors; no horizontal overflow at 375, 390, 768, 1024 or 1440 px; every chapter renders. Chapter screenshots are uploaded as artifacts but not pixel-compared at MVP, because SwiftShader output isn't deterministic.
- **Booking:** picking dates and a car reaches "Reserve" in ≤ 3 taps. Errors appear inline, the success state shows, and a row lands in the preview's Neon branch. The WhatsApp deep link carries the right number and prefilled text.
- **Booking load time (the contractual gate):** the app sets `performance.mark('booking-interactive')` once the booking form hydrates. Under Slow 4G and 4× CPU throttling (via CDP), Playwright asserts that the mark fires before 2,500 ms. Lighthouse can't time a single section, so this test is the gate.
- **INP in the lab:** `web-vitals` `onINP` with `reportAllChanges` records INP while the test opens the date picker and picks a car under 4× CPU throttling; it must stay under 200 ms. Field INP comes from Speed Insights (§6).
- **Accessibility:** `@axe-core/playwright` runs on every route and on the open booking sheet, with tags `wcag2a, wcag2aa, wcag21aa, wcag22aa`, and fails on serious or critical issues.

**Lighthouse CI assertions** (errors unless marked): `largest-contentful-paint` ≤ 2500 ms; `cumulative-layout-shift` ≤ 0.1; `total-blocking-time` ≤ 200 ms (warning only; it stands in for INP); `categories:accessibility` ≥ 0.95; `resource-summary:script:size` ≤ 350 KB on first load, before the WebGL chunk is requested [U; set the real number after the first build]. Reports are kept as workflow artifacts, not in Lighthouse's public temporary storage. `contrast.py` needs two changes in the app repo: exit with code 1 on any FAIL, and read colours from the theme tokens file instead of hard-coded hex values.

**Required checks on `main`** (branch protection): `ci/lint`, `ci/typecheck`, `ci/unit`, `ci/audit`, `ci/gitleaks`, `ci/contrast`, `e2e/playwright`, `e2e/axe`, `lighthouse/mobile` and Vercel's deployment check. Branch protection also requires a PR, an up-to-date branch and linear history, blocks force-pushes, and requires 1 approval once there are two developers. If a Vercel build fails, the deployment-triggered checks never report and the PR stays blocked, which is what we want.

**Actions minutes:** about 15 min per PR push × 80 pushes/month ≈ 1,200 min. That fits in GitHub Free's 2,000 minutes for private repos; GitHub said in its 2026 pricing update that free quotas are unchanged [U].

## 5. CMS → site operations (Sanity)

- **Plan: Sanity Free.** It gives 20 seats, 2 datasets (**public only**), 10k documents, 1M API CDN requests and 100 GB of bandwidth [V]. In a public dataset, anyone with the project ID can read published content. That's fine for the fleet, prices and copy. PII, cost prices and internal notes never go into Sanity.
- **Caching.** Public pages are static, and every Sanity fetch carries cache tags (`car`, `car:<slug>`, `offer`, `settings`). Pages also revalidate every hour, so a missed webhook fixes itself.
- **On-demand revalidation.** A Sanity GROQ webhook fires on create, update and delete for `_type in ["car","brand","offer","page","settings"]`, with projection `{_type, "slug": slug.current}`, and calls `POST https://www.luxuryrental.ae/api/revalidate`. The handler checks the `sanity-webhook-signature` HMAC against `SANITY_REVALIDATE_SECRET` (using `parseBody` from next-sanity), calls `revalidateTag` for the type and slug, and returns 401 on a bad signature. The webhook is production-only; previews always read fresh content. Target: a CMS edit is live in under 60 s. Failed deliveries show in Sanity's webhook log, and handler errors go to Sentry.
- **Draft mode.** `/api/draft-mode/enable` uses next-sanity's `defineEnableDraftMode` with the Viewer token. Editors preview the real site through Sanity's Presentation tool, with click-to-edit, so they don't need Vercel accounts. **The Studio is hosted at `luxuryrentals.sanity.studio`** (free), which keeps Studio JavaScript out of the site bundle. The CSP's `frame-ancestors` allows that origin, and Sanity's CORS list includes the production domain and the `*.vercel.app` previews (with credentials).
- **Editors.** Zubair and the ops staff use free Sanity seats. Fleet changes need neither a developer nor a deploy.

## 6. Observability

| Need | Tool and decision | Notes |
|---|---|---|
| Traffic | **Vercel Web Analytics**, on | Cookieless: visitors are identified by a hash of the request, and sessions are discarded after 24 h [V]. Custom events: `booking_started`, `booking_submitted`, `whatsapp_click`, at most 2 properties each on Pro [V]. Never PII |
| Consent | **No banner at MVP** | The site only uses cookieless analytics and strictly necessary cookies. A consent manager comes with GA4 or the Meta Pixel (Phase 2). Counsel to confirm |
| Field Core Web Vitals | **Speed Insights Plus for the launch month** ($10 + events, `sampleRate: 0.25`) | The free tier only shows RES. Plus shows LCP, INP and CLS per route, the only proof that the budgets hold on real phones in Dubai. Drop back to free at launch + 30 days if the numbers are stable |
| Errors | **Sentry Developer (free)**: 1 user, 5k errors, 5M spans, 50 replays, 1 cron monitor, 1 uptime monitor, 30-day lookback [V] | `@sentry/nextjs` with tunnel route `/monitoring`, `sendDefaultPii: false`, and a `beforeSend` that strips booking fields; source maps are uploaded, then removed from the build output. Move to Team ($29) when a second developer needs access. The free plan's terms don't say whether commercial use is allowed [U] |
| Uptime | **Better Stack free**: 10 monitors, 3-min checks, a status page [U] | Monitors: `/` with keyword "Reserve" (3 min); `/api/health` without a DB call (3 min); `/api/health?deep=1` with DB + Sanity (60 min, so Neon can still scale to zero); the apex 308; TLS expiry; the backup heartbeat. Sentry's uptime monitor watches `/` as a second check |
| Logs | **No log drain at MVP** | Vercel runtime logs, Sentry, and a `booking_events` audit table in Postgres cover it. Phase 3: drain to Better Stack Logs if incidents need longer history |
| Cost | Vercel spend alert at $50; weekly usage review | Watch CDN requests against the 1M tier, image transformations and Speed Insights events |

Sentry and Better Stack alert the developer and the ops inbox by email. A booking-route error alerts immediately; everything else goes into a daily digest. Alerts are handled in GST working hours (UTC+4).

## 7. Security

**Booking endpoint.** Bookings go to a Route Handler at `POST /api/booking-requests`, not a Server Action, so firewall rules, BotID and monitors can all target one stable path. The protections stack in layers:
1. **Vercel WAF rate limits** (Pro: 40 rules, fixed windows of 10 s–10 min, keyed by IP or JA4 [V]). Allow 5 requests per 10 min per IP and 20 per 10 min per JA4 digest, then return 429. Run the rules in *Log* mode for 48 h before enforcing. The cost is negligible: $0.50–0.55 per 1M allowed requests [V].
2. **BotID Basic** (free on all plans [V]): `initBotId({ protect: [{ path: '/api/booking-requests', method: 'POST' }] })` in `instrumentation-client.ts`, and `checkBotId()` in the handler, which returns 403 for bots. Deep Analysis ($1 per 1,000 checks [V], about $0.30/month at 300 bookings) only if spam gets through. On a 403 the UI shows the WhatsApp button, so a real customer flagged by mistake isn't lost. Previews skip the check only when `E2E_BYPASS_KEY` matches; Production doesn't have that variable.
3. **Checks in the app:** Zod validation, a honeypot field, a minimum fill time of 3 s, an idempotency key against double submits, a 10 KB body limit, and UAE phone numbers normalised to E.164.
4. **Incident switches:** Firewall Attack Challenge Mode, plus one-click IP and JA4 block rules.

**Headers.** A CSP allowing self, Vercel Analytics and Speed Insights, BotID, `cdn.sanity.io` images and Sentry through the tunnel, with `frame-ancestors` allowing the Studio; `Referrer-Policy: strict-origin-when-cross-origin`; a `Permissions-Policy` denying camera, microphone and geolocation; `X-Content-Type-Options: nosniff`. The CSP runs Report-Only (reporting to Sentry) for the first week, then enforces.

**Secrets.**
- Secrets live only in Vercel (marked Sensitive). CI needs a few GitHub Actions secrets: `VERCEL_AUTOMATION_BYPASS_SECRET`, `E2E_BYPASS_KEY`, `BACKUP_DATABASE_URL` (read-only role) and `SENTRY_*` for the backup cron monitor.
- Least privilege: three Postgres roles, `app` (booking tables only), `migrate` (CI or manual runs) and `backup` (read-only); a Resend key that can only send; a Sanity token with the Viewer role.
- Rotate secrets after any staff change and every 6 months. gitleaks blocks committed secrets. The GitHub org requires 2FA; Actions are pinned to commit SHAs with default `permissions: contents: read`; CODEOWNERS covers `.github/` and `vercel.json`.

**Dependencies: Dependabot.** It's built into GitHub and free on private repos, and its grouping covers what we need, so there's no Renovate app to install. Weekly npm updates in groups (`next`/`react*`, `three`/`@react-three/*`, `gsap`/`lenis`, dev tooling); GitHub Actions updates monthly; security updates as soon as they're published. Auto-merge only patch-level dev dependencies with green CI. Major versions of Next, three and R3F are upgraded by hand, with a look at the preview.

**Booking database backups.**
- Neon Free keeps a 6-hour restore window; the Launch plan keeps up to 7 days [V].
- Nightly `backup.yml`: `pg_dump -Fc` with the read-only role, encrypted with `age` to a public key (the Owner holds the private key offline, with a copy in a password manager), stored as a workflow artifact for 35 days. It checks in with a Sentry cron monitor, which alerts if a night is missed.
- Monthly restore drill: restore into a temporary Neon branch, check row counts, then delete the branch.
- Weekly `sanity dataset export production` (content and assets), stored as an artifact.
- Upgrade to Neon Launch (~$3–5/month [U]) for 7-day point-in-time restore once bookings pass ~100/month or compute nears the free 100 CU-hours.

## 8. Release process

**Release flow.** A merge to `main` triggers Vercel's production build, and the domains move to the new deployment. `e2e @smoke` then runs on the production `deployment_status`: it checks that home, fleet, a car page and the booking form render, and writes nothing. If smoke fails, the developer and the ops inbox get an alert. At MVP, rollback is manual (one click, under 2 minutes). Phase 2 automates it with staged production deploys, where `vercel promote` runs only after smoke passes.

**Launch checklist (every item must pass; owner in brackets):**
- [ ] Vercel Pro team owned by the client, with a billing card on file and the $50 spend alert [Owner]
- [ ] Production env vars set and marked Sensitive; previews use their own Resend key and Neon branches [Dev]
- [ ] Deployment summary shows functions running in the database's region [Dev]
- [ ] www is primary, the apex returns 308, certificates are valid and HSTS is sent [Dev]
- [ ] Resend domain verified; SPF and DKIM pass; DMARC `p=none` sending reports; a test booking email lands in the Gmail and Outlook inboxes, not spam [Dev]
- [ ] Production booking test: form → DB row (`is_test=true`) → ops email → the WhatsApp link opens the right number. Test row deleted afterwards [Ops]
- [ ] Sanity has 16 cars, 5 hero picks and prices published; webhook tested (a price edit goes live in < 60 s); CORS origins set [Ops]
- [ ] robots.txt allows production; previews send `X-Robots-Tag: noindex` (Vercel default [V]); sitemap, www canonical tags and OG images in place; Search Console verified [Dev]
- [ ] Privacy policy names the processors and the EU storage; consent checkbox live; counsel has signed off [Owner]
- [ ] All required checks green on the release commit; on a real mid-range Android and an iPhone over UAE 4G, the booking form is usable in < 2.5 s [Dev]
- [ ] Sentry release tagged, uptime monitors green, one backup run and one restore drill completed [Dev]
- [ ] Instant Rollback rehearsed once on production before the launch is announced [Dev]

**Rollback.** On Pro, Instant Rollback can return to any earlier production deployment [V]. Runbook: Project → Instant Rollback → choose the last good deployment → confirm.
- After a rollback, Vercel stops assigning production domains automatically, so new merges don't go live until someone clicks *Undo Rollback* or runs `vercel promote` [V].
- Env vars aren't rolled back [V], so an env change goes in before the code that needs it is merged, never after.
- Database migrations follow expand/contract (add first, drop at least one release later), so any earlier deployment still runs on the current schema. Content mistakes are undone in Sanity's document history, with no deploy.

**First week after launch:**

| Check | When | Threshold → action |
|---|---|---|
| Sentry issues | Twice a day | Any booking-route error → fix the same day |
| Booking reconciliation | Daily | DB rows, ops emails and WhatsApp leads don't match → investigate |
| Speed Insights Plus (mobile p75) | Daily | LCP > 2.5 s, INP > 200 ms or CLS > 0.1 on a top route → open a performance ticket |
| Firewall / BotID | Daily | Spikes in 429s or 403s, or spam rows → tighten the rules or turn on Deep Analysis |
| Uptime | Real time | Any outage → write an incident note with the cause |
| Vercel usage | Days 1, 3 and 7 | Projected > 1M CDN requests → cut prefetching and requests, or accept the $20 tier |
| DMARC reports | Days 3 and 7 | Unaligned senders → fix the records. If clean, move to `p=quarantine` on day 14 |
| Retro | Day 7 | Adjust sample rates and alert noise; decide whether to keep Speed Insights Plus |

## 9. Cost (monthly, USD excl. VAT)

| Service | Free tier (the limits that matter) | Launch choice | When it becomes paid | Estimate |
|---|---|---|---|---|
| Vercel platform | Hobby is not allowed (commercial use) | Pro, 1–2 paid seats | +$20 per extra person who deploys | $20–40 |
| Vercel usage | $20 credit; 1M CDN requests + 1 TB | Covered by the credit | >1M CDN requests → $20 tier | $0–20 |
| Speed Insights Plus | Free tier shows RES only | Plus for the launch month | Keep it if Core Web Vitals regress | $10–13, then $0 |
| Neon Postgres | 100 CU-hours, 1 GB, 6 h restore window | Free | >~100 bookings/month, or when 7-day restore is needed | $0, later ~$3–5 [U] |
| Sanity | 20 seats, 2 public datasets, 1M CDN requests, 100 GB | Free | A private dataset or more than 20 users | $0 (Growth: $15/seat) |
| Resend | 3,000 emails/month, 100/day | Free | More than 100 emails/day | $0 (Pro: $20) |
| Sentry | 1 user, 5k errors | Developer | A second developer | $0 (Team: $29) |
| Better Stack Uptime | 10 monitors, 3-min checks | Free | 30-s checks or phone alerts | $0 [U] |
| GitHub Actions + Dependabot | 2,000 min/month on private repos [U] | The org's current plan | More than 2,000 min | $0 |
| .ae domain | n/a | Client's registrar | Annual renewal, paid by the client | Registrar price [U] |
| **Total** | | | | **Launch month ~$30–75 (AED 110–275); after that ~$20–60 (AED 75–220)** |

## 10. Task list (ideal days)

| # | Task | Days | Depends on | Phase |
|---|---|---|---|---|
| D1 | Create the client-owned Vercel Pro team; seats, Viewer invites, spend alert | 0.25 | Q1, Q2 | MVP |
| D2 | Link the repo; project settings (Node, region, protection, bypass secret); `vercel.json` | 0.25 | D1 | MVP |
| D3 | Neon via the Marketplace (Frankfurt); preview branching with cleanup; DB roles; migration tooling | 0.75 | D2, Q6 | MVP |
| D4 | Env var matrix and `vercel env pull` instructions | 0.25 | D3 | MVP |
| D5 | Branch protection, CODEOWNERS, Dependabot, gitleaks | 0.5 | D2 | MVP |
| D6 | `ci.yml`: lint, typecheck, Vitest, audit, contrast | 1 | App skeleton | MVP |
| D7 | `e2e.yml`: Playwright (ported from shoot.mjs), axe, booking load-time gate, INP | 2 | D6, booking UI | MVP |
| D8 | `lighthouse.yml` with the budgets | 0.5 | D7 | MVP |
| D9 | Sanity webhook, revalidate route, draft mode, Presentation tool, CORS | 1 | Sanity schema | MVP |
| D10 | Booking hardening: WAF rules, BotID, honeypot, idempotency | 1 | Booking API | MVP |
| D11 | Sentry, Web Analytics, Speed Insights, health routes, Better Stack | 0.75 | D2 | MVP |
| D12 | Security headers; CSP Report-Only, then enforced | 0.5 | D11 | MVP |
| D13 | Backups: encrypted pg_dump, Sanity export, restore drill, cron monitor | 0.75 | D3 | MVP |
| D14 | Domain and email cut-over (records, Resend, DMARC, SSL, redirect) | 0.5 + DNS wait | Q3, Q4, D1 | MVP |
| D15 | Launch checklist, real-device test, rollback rehearsal | 1 | D1–D14 | MVP |
| D16 | Launch-week monitoring and day-7 retro | 1.5 (spread over the week) | D15 | MVP |
| | **MVP total** | **12.5** | D14 can run in parallel once there's registrar access | |
| P2-1 | Custom `staging` environment for UAT and the gateway sandbox | 0.5 | Gateway choice | Phase 2 |
| P2-2 | Automated rollback: staged production deploys, smoke test, `vercel promote` | 1 | D7 | Phase 2 |
| P2-3 | Consent manager, plus GA4 and Meta Pixel in consent mode | 1.5 | Analytics accounts | Phase 2 |
| P2-4 | Arabic RTL: e2e, axe and Lighthouse runs for `/ar` | 1 | Arabic build | Phase 2 |
| P2-5 | Payment gateway ops: webhook route, secrets, rate limits; hosted checkout to stay out of PCI scope | 1.5 | Gateway choice | Phase 2 |
| P2-6 | Neon Launch, PII retention purge job, DMARC `p=reject`, HSTS preload | 0.75 | D13, D14 | Phase 2 |
| P3-1 | Deterministic WebGL visual regression (fixed seeds, pixel diff) | 2 | D7 | Phase 3 |
| P3-2 | Log drain and dashboards (Better Stack Logs) | 0.5 | D11 | Phase 3 |
| P3-3 | Terraform (`vercel/vercel` provider) for the project, env vars, domains and firewall | 1.5 | D1–D14 | Phase 3 |
| P3-4 | Re-evaluate a UAE region (`dxb1` or a UAE-hosted DB) and migrate if it's worth it | 1–2 | `dxb1` availability | Phase 3 |

## 11. Risks and open questions

| Risk | Impact | Mitigation |
|---|---|---|
| Vercel team or billing set up under the agency or a personal account | Lock-in and a painful handover | Create the team under the client from day one, with the agency as a Member. Vercel documents an ownership-transfer path [V] |
| Domain access arrives only "at production push" | Launch slips while DNS propagates and email gets verified | Get the registrar name and read access now; prepare the records in advance so cut-over takes 30 minutes |
| Unknown email already running on the domain | Booking emails or existing mail stop working without anyone noticing | Leave the nameservers alone and export the zone first (§3) |
| PII stored outside the UAE while the PDPL rules are unsettled | Legal exposure | Collect the minimum, get consent, store in the EU, and make counsel sign-off a launch gate |
| Unstable infrastructure in the Gulf (me-central-1) | `dxb1` unusable; possible regional network disruption | Nothing is hosted in the region; CDN points of presence serve cached pages; the UI keeps a WhatsApp fallback |
| Vercel pricing in flux (1M vs 10M CDN requests; Pro restructured for teams created from 9 Sep 2025) | A surprise bill | $50 spend alert; check Billing on day 1 |
| BotID false positives (privacy browsers, VPNs) | Lost leads | WhatsApp fallback on a 403; monitor BotID verdicts |
| Free-tier caps (Speed Insights pause, Resend 100/day, Neon 100 CU-hours, 1 Sentry user) | Blind spots under load | Sample rates, deep health check only hourly, upgrade triggers listed in §9 |
| A single developer | Nobody else can run the system if the developer is unavailable | Runbooks in `docs/ops/`; the client holds the Owner role and the backup key |

**Open questions:**
1. Who owns the Vercel team, and whose card pays? (Proposal: Luxuryrentals' legal entity, with Zubair as Owner.)
2. How many people will push code? One person means $20/month; two means $40/month.
3. Who is the registrar? Also: the registrant entity, expiry date, DNSSEC status and current DNS host. Can we get access now instead of at the production push?
4. Does luxuryrental.ae have mailboxes today? Which inbox receives booking notifications and DMARC reports?
5. Canonical host: www (recommended) or the apex?
6. Which database will the architect choose: Neon Frankfurt (the default) or a Mumbai option? This decides the function region.
7. Legal: is EU storage of booking PII acceptable? What retention period, and what approved consent wording?
8. Payment gateway shortlist (Network International, Checkout.com, Stripe): do any need regional hosting or IP allowlisting? Static IPs on Vercel cost $100/month per project [V].
9. Who receives alerts, on which channel (email, WhatsApp, Slack), and during which hours?
10. What launch traffic and ad spend are expected? They decide the CDN tier and the rate-limit thresholds.

Sources (checked 23 Oct 2026):
- Vercel: [Pro plan](https://vercel.com/docs/plans/pro-plan), [fair use and commercial use](https://vercel.com/docs/limits/fair-use-guidelines), [pricing](https://vercel.com/pricing), [Flat Rate CDN](https://vercel.com/docs/pricing/flat-rate-cdn), [bom1 pricing](https://vercel.com/docs/pricing/regional-pricing/bom1), [regions](https://vercel.com/docs/regions), [function regions](https://vercel.com/docs/functions/configuring-functions/region), [dxb1 launch](https://vercel.com/changelog/introducing-the-dubai-vercel-region-dxb1)
- dxb1 and me-central-1 outage reports: [Vercel community thread on dxb1](https://community.vercel.com/t/dxb1-dubai-region-unavailable-maintenance-eta-and-hobby-availability/48770), [AWS me-central-1 data loss (w.media)](https://w.media/aws-cant-recover-resources-and-data-stored-in-uae-region-hit-during-us-iran-conflict/)
- Vercel domains: [adding a domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [www vs apex](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)
- Vercel features: [BotID](https://vercel.com/docs/botid), [WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [deployment protection](https://vercel.com/docs/deployment-protection), [Instant Rollback](https://vercel.com/docs/instant-rollback), [Web Analytics privacy](https://vercel.com/docs/analytics/privacy-policy), [Web Analytics pricing](https://vercel.com/docs/analytics/limits-and-pricing), [Speed Insights pricing](https://vercel.com/docs/speed-insights/limits-and-pricing)
- Other services: [Neon regions](https://neon.com/docs/introduction/regions), [Neon pricing](https://neon.com/pricing), [Sanity pricing](https://www.sanity.io/pricing), [Resend pricing](https://resend.com/pricing), [Sentry pricing](https://sentry.io/pricing/)
- PDPL cross-border transfers: [Kayrouz & Associates](https://www.kayrouzandassociates.com/insights/cross-border-data-transfers-under-uae-law-in-2026)
