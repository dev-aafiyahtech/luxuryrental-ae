# Vercel settings

Settings that can't live in code, recorded here so the project can be rebuilt (plan workstream 02, §2). Settings in code: `vercel.json` (framework, function region `fra1`) and `package.json` `engines` (Node 24).

**Status (26 Oct 2026):** demo phase. Connected by Zubair; live at https://luxuryrental-ae.vercel.app. Every push to `main` deploys to production, every other branch gets a preview.

## Project

| Setting | Value |
|---|---|
| Team | `devaafiyahtech-5951` (Owner: Zubair) |
| Project | `luxuryrental-ae` |
| Git repository | `dev-aafiyahtech/luxuryrental-ae` (Vercel GitHub app) |
| Framework preset | Next.js (auto-detected) |
| Root directory | `./` |
| Build / install commands | defaults (`next build`, `npm install`) |
| Node.js | 24.x, from `engines` |
| Function region | `fra1` Frankfurt, from `vercel.json` |
| Production branch | `main` |

## Environments

| Environment | Source | URL | Protection |
|---|---|---|---|
| Production | `main` | https://luxuryrental-ae.vercel.app (until the domain is connected) | Public. Crawlers are kept out by `robots.txt` and `noindex` while `site.demo` is true |
| Preview | every branch push and PR | `luxuryrental-ae-git-<branch>-devaafiyahtech-5951.vercel.app` | Standard Protection (Vercel Authentication), checked 26 Oct 2026. Viewers sign in to Vercel, or use a shareable link from Settings → Deployment Protection |

## Environment variables

None in the demo phase. The demo needs no secrets: bookings, ops and payments are simulated in the browser. The canonical address comes from Vercel's system variable `VERCEL_PROJECT_PRODUCTION_URL` (`siteUrl()` in `src/content/site.ts`): the `vercel.app` address until luxuryrentals.ae is on the project, then `https://www.luxuryrentals.ae`. Backend variables (database, email, CMS, bot protection) are listed in plan workstream 02 and are added when that work starts.

## Domains

Not connected yet. `www.luxuryrentals.ae` will be canonical, with the apex `luxuryrentals.ae` redirecting to it (plan workstream 02, §3).

**Connecting luxuryrentals.ae** (needs access to the domain's DNS at its .ae registrar):

1. Vercel → project `luxuryrental-ae` → **Settings → Domains → Add Domain**. Enter `www.luxuryrentals.ae`. When Vercel offers it, choose to also add `luxuryrentals.ae` and **redirect it to www**.
2. Vercel then lists the DNS records each domain needs. Copy the exact values it shows; they look like:
   - `luxuryrentals.ae` (apex, host `@`): an **A** record to the IP Vercel shows (for example `76.76.21.21`).
   - `www`: a **CNAME** to the target Vercel shows (for example `cname.vercel-dns.com`).
3. At the registrar's DNS panel: delete any existing A, AAAA or CNAME records for `@` and `www` (parking pages, an old site), then add the two records above. Leave MX, TXT and other email records alone. If there are CAA records, add one allowing `letsencrypt.org`.
4. Wait for Vercel to show both domains as **Valid Configuration**. It issues the SSL certificate itself; usually minutes, up to 48 hours while DNS spreads.
5. Redeploy `main` (Deployments → latest → Redeploy) so links, the sitemap and share images switch to `https://www.luxuryrentals.ae`.

Alternative: point the domain's nameservers to Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). Only do this after recreating every email record (MX, SPF, DKIM) in Vercel's DNS, or email for the domain stops.

The demo stays out of search engines after the domain is connected; that changes only at launch, when `site.demo` turns off.

## Connecting the project

1. Sign in at vercel.com with the team that will own the project.
2. **Add New → Project**, import `dev-aafiyahtech/luxuryrental-ae`. If the repo isn't listed, use "Adjust GitHub App permissions" and give the Vercel app access to it (an owner of the `dev-aafiyahtech` organisation may need to approve).
3. Keep every default and press **Deploy**.
4. Record the values marked _tbc_ above.
