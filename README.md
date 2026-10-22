# LuxuryRental.ae

The world's most beautiful, futuristic luxury car rental website for **Luxuryrentals**, Dubai Silicon Oasis, Dubai.

**Status (23 Oct 2026):** concept direction approved. First homepage prototype built. Client requirements captured; waiting for the next brief.

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

## Open items

- **No 3D models and no 3D budget.** The fleet changes often, so the car scenes need an image-based approach that works with AI-generated car images.
- SVG logo, fleet of 16 cars, top-5 hero picks, price estimates.
- Assumed booking rules, policies, cancellation terms and chauffeur pricing.
- Simulated payments; simulated About, FAQ and contact copy with placeholders.

## Owner

Zubair, Adz Tech Solutions: approver and operations contact.
