# LuxuryRental.ae

The world's most beautiful, futuristic luxury car rental website for **Luxuryrentals**, Dubai Silicon Oasis, Dubai.

**Status (23 Oct 2026):** project plan v1 ready for approval: [docs/plan/PROJECT-PLAN.md](docs/plan/PROJECT-PLAN.md). Target go-live **Thu 26 Nov 2026** on Vercel, with the cinematic homepage switched on **Thu 17 Dec 2026**.

## Direction

One continuous scroll story in four chapters, built from three themes:

| # | Chapter | Theme |
|---|---------|-------|
| 01 | Skyline | **Burj by Night**: the camera descends through Dubai at night onto a rooftop helipad where the car forms from gold dust |
| 02 | Fleet | **Velocity Tunnel**: a warp tunnel carries the visitor past the three fleet categories |
| 03 | Sculpture | **Kinetic Sculpture**: the featured car comes apart into floating components with spec callouts |
| 04 | Reserve | The car reassembles, its headlights ignite, it launches into the tunnel and the reservation card rises |

Black and gold, Syncopate + Montserrat, dark only. Full spec: [docs/design-system/luxuryrental-ae/MASTER.md](docs/design-system/luxuryrental-ae/MASTER.md).

## View the prototype

Open `prototype/index.html` in a browser. It needs an internet connection to load Three.js, GSAP, Lenis and Google Fonts from their CDNs.

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
  plan/PROJECT-PLAN.md                 Project plan: scope, decisions, timeline, budget, launch checklist
  plan/workstreams/                    The 7 specialist sections behind the plan (architecture, Vercel,
                                       car visuals, fleet and pricing, booking rules, UX, SEO)
prototype/
  index.html                           Standalone prototype; open in a browser
  artifact-source.html                 The same page as published to Claude (no html/head/body wrapper)
qa/
  README.md                            What was tested and what was fixed afterwards
  screenshots/                         Desktop, mobile and reduced-motion renders
  scripts/shoot.mjs                    Playwright render script
  scripts/contrast.py                  WCAG contrast check for the palette
tools/
  ui-ux-pro-max.md                     Skill used to generate the design system, with commands
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

## Open items

The decisions needed from Zubair are listed in order in [plan §9](docs/plan/PROJECT-PLAN.md#9-decisions-needed-from-zubair). The most urgent are the logo name, fleet confirmation (with 5 phone photos per car), Bugatti sourcing, prices, the WhatsApp number, account ownership and DNS access.

## Owner

Zubair, Adz Tech Solutions: approver and operations contact.
