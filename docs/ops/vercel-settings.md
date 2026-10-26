# Vercel settings

Settings that can't live in code, recorded here so the project can be rebuilt (plan workstream 02, §2). Settings in code: `vercel.json` (framework, function region `fra1`) and `package.json` `engines` (Node 24).

**Status (23 Oct 2026):** demo phase. Being connected; fill in the values marked _tbc_ once the project exists.

## Project

| Setting | Value |
|---|---|
| Team | _tbc_ (Owner: Zubair) |
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
| Production | `main` | _tbc_ (`*.vercel.app` until the domain is connected) | _tbc_ |
| Preview | every branch push and PR | `luxuryrental-ae-git-<branch>-<team>.vercel.app` | Standard Protection (Vercel Authentication). Viewers sign in, or use a shareable link |

## Environment variables

None in the demo phase. The demo needs no secrets: bookings, ops and payments are simulated in the browser. Backend variables (database, email, CMS, bot protection) are listed in plan workstream 02 and are added when that work starts.

## Domains

Not connected yet. `www.luxuryrentals.ae` will be canonical with the apex redirecting to it (plan workstream 02, §3). Needs DNS access.

## Connecting the project

1. Sign in at vercel.com with the team that will own the project.
2. **Add New → Project**, import `dev-aafiyahtech/luxuryrental-ae`. If the repo isn't listed, use "Adjust GitHub App permissions" and give the Vercel app access to it (an owner of the `dev-aafiyahtech` organisation may need to approve).
3. Keep every default and press **Deploy**.
4. Record the values marked _tbc_ above.
