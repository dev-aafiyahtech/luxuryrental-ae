# LuxuryRental.ae — Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/luxuryrental-ae/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file. If not, follow the rules below.

---

**Project:** LuxuryRental.ae — the world's most beautiful, futuristic luxury car rental website
**Generated:** 2026-10-22 with UI/UX Pro Max (`--design-system`, Variance 7 · Motion 9 · Density 3), then adapted for a dark, futuristic direction
**Category:** Luxury/Premium Brand × Automotive
**Stack:** Next.js · React Three Fiber · GSAP + Lenis · Sanity · Vercel

---

## 1. Creative Direction

**Shortlisted themes (final 3):**

1. **Burj by Night** — cinematic flythrough of the Dubai skyline; each car on its own rooftop
2. **Velocity Tunnel** — warp-speed tunnel; cars burst out of it as you scroll
3. **Kinetic Sculpture** — cars break into floating components (exploded view) and reassemble

*Removed:* Silent Thunder (22 Oct 2026).

**Big idea:** the three themes are not separate pages. They are chapters of **one continuous scroll story** (skill pattern: *Scroll-Triggered Storytelling*).

**Style stack (from skill):** 3D & Hyperrealism + Parallax Storytelling, on Dark Mode (OLED).
Liquid Glass is used **only** for the floating booking panel and nav. The skill tags it as app-chrome styling, not a full-page style.

---

## 2. Homepage Chapter Map

| # | Chapter | Theme | What the visitor sees | Build | Mini CTA | Mobile / reduced-motion fallback |
|---|---------|-------|----------------------|-------|----------|-------------------------------|
| 0 | Intro hook | **Burj by Night** | Camera descends through the night skyline and lands on a hypercar on a rooftop helipad. The booking bar is visible from the first paint. | R3F scene with a GSAP camera rig (`scrub: 1`). **Pinned.** | Check availability | Pre-rendered video loop + poster image |
| 1 | Transition | **Velocity Tunnel** | Light streaks accelerate into a warp tunnel, and fleet categories (Supercar, SUV, Chauffeur) shoot out | Fragment shader / instanced streaks. **Not pinned.** | Browse the fleet | Gradient streak + crossfade |
| 2 | The cars | **Kinetic Sculpture** | Selected car separates into floating components with spec callouts (hp, 0–100, top speed) | Car glTF split into named meshes; GSAP timeline scrubbed. **Pinned.** | See this car | Static exploded-view image + spec list |
| 3 | Climax | **Kinetic Sculpture → Velocity Tunnel** | Parts snap back together, headlights ignite, the car launches into the tunnel, and the Reserve panel rises | Reverse of ch. 2 timeline + tunnel shader | **Reserve now** (primary) | Static hero + Reserve panel |

**Rules for the map**

- Max **2 pinned sections** per page (skill: excessive pinning fights native scroll, hurts mobile).
- Progress indicator + "Skip intro" link always visible.
- DOM reading order is complete without JS/3D (SEO + screen readers).
- **Chapter colour strategy (progressive reveal, building intensity)**, used for scene lighting only, never for text:
  - Ch 0: midnight black + amber city glow `#B45309`
  - Ch 1: ice-white / cold-blue streaks `#7DD3FC`
  - Ch 2: champagne-silver studio light `#D6D3D1`
  - Ch 3: full gold `#EAB308`

### Car detail page

- Car card → detail page uses a **GSAP Flip** shared-element transition (one element pair only).
- 360° free-look view with **OrbitControls** (allowed here because it's exploratory, not a scripted reveal).
- Kinetic Sculpture exploded view available as a toggle.

---

## 3. Colour Palette (dark, adapted from skill)

The skill's luxury palette is light-mode (`#FAFAF9` background). It is inverted here for the dark, futuristic direction. The skill had darkened the accent from `#CA8A04` to `#A16207` for a light background. On dark, the original `#CA8A04` passes contrast, so it is restored.

| Role | Hex | CSS Variable | Verified contrast |
|------|-----|--------------|-------------------|
| Background | `#0C0A09` | `--color-background` | — |
| Card / Surface | `#1C1917` | `--color-card` | — |
| Elevated surface | `#292524` | `--color-elevated` | — |
| Foreground (text) | `#FAFAF9` | `--color-foreground` | 18.9:1 on bg · 16.7:1 on card |
| Muted text | `#A8A29E` | `--color-muted-foreground` | 7.8:1 on bg · 6.0:1 on elevated |
| Accent / CTA (gold) | `#CA8A04` | `--color-accent` | 6.7:1 on bg (as text) |
| On Accent | `#0C0A09` | `--color-on-accent` | 6.7:1 on gold |
| Accent hover | `#EAB308` | `--color-accent-hover` | 10.3:1 with dark text |
| Focus ring | `#EAB308` | `--color-ring` | 9.1:1 on card (needs 3:1) |
| Border (decorative) | `#44403C` | `--color-border` | — |
| Input border | `#78716C` | `--color-input` | 3.7:1 on card (needs 3:1) |
| Destructive | `#F87171` | `--color-destructive` | 6.3:1 on card |
| Success | `#4ADE80` | `--color-success` | 10.0:1 on card |

> ⚠️ **Never put white text on gold.** `#FFFFFF` on `#CA8A04` = 2.9:1 (fails WCAG AA). Gold buttons always use dark text.

---

## 4. Typography

| Use | Font | Notes |
|-----|------|-------|
| Display / headlines (EN) | **Syncopate** 400/700 | Skill's "Kinetic Motion" pick (futuristic, automotive). Uppercase, `letter-spacing: 0.08em`. Headlines only, never body. |
| Body / UI (EN) | **Montserrat** (variable) 300–600 | `font-variant-numeric: tabular-nums` for prices and specs |
| Display (AR) | **Noto Kufi Arabic** (variable) | Geometric Kufi matches Syncopate's wide stance |
| Body (AR) | **Readex Pro** (variable) | Arabic + Latin, RTL-ready |
| Alternative (classic luxury) | Cormorant + Montserrat | Skill's default luxury pairing, if the brand leans classic over futuristic |

- Load everything through **`next/font`** (self-hosted, zero layout shift). No external `<link>` tags.
- Base 16px, line-height 1.5 for body. Inputs ≥ 16px to stop iOS zoom.
- Scale (desktop / mobile): Hero 72/40 · H1 56/34 · H2 40/28 · H3 28/22 · Body 16 · Label 12 (uppercase, tracked).

---

## 5. Spacing · Radius · Depth

*Density 3/10 — spacious*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps |
| `--space-sm` | 8px | Icon gaps, min spacing between touch targets |
| `--space-md` | 24px | Standard padding |
| `--space-lg` | 32px | Section padding |
| `--space-xl` | 48px | Large gaps |
| `--space-2xl` | 64px | Section margins |
| `--space-3xl` | 96px | Hero padding |

| Token | Value |
|-------|-------|
| `--radius-btn` | 999px (pill) |
| `--radius-card` | 16px |
| `--radius-panel` | 24px |

**Depth on dark:** shadows barely read on `#0C0A09`. Use hairline borders + light, not drop shadows:
- `--glow-gold: 0 0 0 1px #CA8A0466, 0 8px 32px #CA8A0426` (hover/featured)
- `--edge: inset 0 1px 0 #FAFAF914` (top highlight on panels)

---

## 6. Component Specs

```css
/* Primary button — gold, dark text */
.btn-primary {
  background: var(--color-accent);       /* #CA8A04 */
  color: var(--color-on-accent);         /* #0C0A09 */
  min-height: 48px;
  padding: 14px 28px;
  border-radius: var(--radius-btn);
  font: 600 14px/1 Montserrat; letter-spacing: 0.06em; text-transform: uppercase;
  transition: background-color 200ms ease, transform 200ms ease;
  cursor: pointer;
}
.btn-primary:hover { background: var(--color-accent-hover); transform: translateY(-1px); }
.btn-primary:focus-visible { outline: 2px solid var(--color-ring); outline-offset: 3px; }

/* Secondary button — ghost */
.btn-secondary {
  background: transparent;
  color: var(--color-foreground);
  border: 1px solid var(--color-input);  /* #78716C */
  min-height: 48px; padding: 14px 28px; border-radius: var(--radius-btn);
  transition: border-color 200ms ease; cursor: pointer;
}
.btn-secondary:hover { border-color: var(--color-accent); }

/* Car card */
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 24px;
  transition: border-color 250ms ease, transform 250ms ease, box-shadow 250ms ease;
  cursor: pointer;
}
.card:hover { border-color: var(--color-accent); transform: translateY(-2px); box-shadow: var(--glow-gold); }

/* Input — label always visible above */
.input {
  background: var(--color-card);
  color: var(--color-foreground);
  border: 1px solid var(--color-input);
  border-radius: 12px;
  padding: 14px 16px; font-size: 16px; min-height: 48px;
  transition: border-color 200ms ease;
}
.input:focus-visible { border-color: var(--color-ring); outline: 2px solid var(--color-ring); outline-offset: 2px; }
.input[aria-invalid="true"] { border-color: var(--color-destructive); }

/* Booking panel — the only Liquid Glass surface */
.booking-panel {
  background: rgba(28, 25, 23, 0.55);
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid rgba(250, 250, 249, 0.08);
  border-radius: var(--radius-panel);
  box-shadow: var(--edge);
}
@supports not (backdrop-filter: blur(1px)) { .booking-panel { background: var(--color-card); } }
@media (prefers-reduced-transparency: reduce) { .booking-panel { background: var(--color-card); backdrop-filter: none; } }
/* Mobile: sticky to bottom, safe-area aware */
@media (max-width: 767px) {
  .booking-panel { position: sticky; bottom: 0; padding-bottom: max(16px, env(safe-area-inset-bottom)); border-radius: 24px 24px 0 0; }
}
```

**Icons:** one SVG set only (Lucide). No emojis as icons. Icon-only buttons need `aria-label`.

---

## 7. Motion

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interactions (hover, press) | 150–300ms | `ease` / `power1.out` |
| Page transitions (Flip) | 500–800ms | `expo.inOut` |
| Scroll-driven scenes | tied to scroll | `scrub: 1` (none) |
| Enter vs exit | exit faster than enter | decelerate in, accelerate out; linear for constant rotation/progress |

**Scroll chapter (pinned) — skill preset**
```js
gsap.timeline({
  scrollTrigger: { trigger: section, start: 'top top', end: '+=150%', scrub: 1, pin: true }
})
  .from('.headline', { opacity: 0, y: 40 })
  .to('.bg-layer', { yPercent: -20 }, '<');
```

**Car card → detail (Flip) — skill preset**
```js
const state = Flip.getState('.hero-image');
navigate();
Flip.from(state, { duration: 0.6, ease: 'expo.inOut', absolute: true, zIndex: 100 });
```

**Motion rules**
- Animate **1–2 key elements per view**, max. Luxury = restraint.
- `prefers-reduced-motion: reduce` → no scrub, no parallax, no pin. Render every chapter in its final, readable state.
- Pause scenes when off-screen or tab hidden.
- Call `ScrollTrigger.refresh()` after fonts and images load (pinned sections need deterministic height).
- Parallax on background/decorative layers only, never on text or controls.

---

## 8. 3D / WebGL Rules (Three.js stack)

- **Pipeline:** Blender → GLB with Draco/Meshopt geometry + KTX2 textures. For Kinetic Sculpture, split each car into named component meshes (body, wheels, doors, engine, interior).
- **Loading:** `GLTFLoader` + `gltf.scene.traverse()` to set shadows/materials on every child mesh.
- **Camera:** GSAP scroll rig with `scrub: 1` for scripted reveals (Burj, Kinetic). **OrbitControls only** on the car detail 360° view.
- **Particles** (tunnel streaks, sculpture dust): start at **3,000**. Profile on a real mid-range phone before raising. Never 100k+ without mobile profiling.
- **Input:** mouse **and** touch. Raycast hotspots with `intersectObjects(targets, true)`.
- **Device tiers:**
  - High (desktop GPU): full real-time scenes
  - Mid (modern phones): reduced geometry, lower DPR (≤ 1.5), fewer particles
  - Low / reduced motion / save-data: video or static images
- 3D is **lazy-loaded after first paint**. The booking bar never waits for WebGL.

---

## 9. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router), EN + AR with full RTL |
| 3D | Three.js + React Three Fiber + drei |
| Motion | GSAP (ScrollTrigger, Flip) + Lenis smooth scroll |
| Images / fonts | `next/image` (AVIF/WebP) · `next/font` |
| CMS | Sanity (fleet, prices, offers, chapter copy) |
| Booking | Custom engine, or integrate HQ Rental / Rent Centric |
| Payments | Stripe / Checkout.com / Network International |
| Hosting | Vercel + CDN |

---

## 10. Booking & UX Rules

- Dates + car → **Reserve in ≤ 3 taps**.
- Visible labels (never placeholder-only); errors shown next to the field.
- Submit feedback: loading state → clear success or error.
- Locale-aware dates (UAE: DD/MM/YYYY); prices in **AED**, tabular numerals.
- Touch targets ≥ 44×44px with ≥ 8px spacing.
- Breakpoints: 375 · 768 · 1024 · 1440. No horizontal scroll.
- Nothing hidden behind the fixed nav or sticky booking panel.

**Performance targets:** booking section LCP ≤ 2.5s on mobile · CLS < 0.1 · test on mid-tier phones, not just desktop.

---

## 11. Anti-Patterns (Do NOT Use)

- ❌ Cheap visuals · ❌ Fast, twitchy animations *(skill)*
- ❌ White text on gold buttons
- ❌ More than 2 pinned sections per page
- ❌ OrbitControls during scripted reveals (users orbit away mid-story)
- ❌ Scroll-jacking without a reduced-motion path
- ❌ Parallax on body text
- ❌ Emojis as icons · mixed icon sets
- ❌ Hover-only interactions (must work on touch)
- ❌ Layout-shifting hovers (use `transform`, not width/height)
- ❌ Invisible focus states
- ❌ Booking UI blocked behind 3D loading

---

## 12. Pre-Delivery Checklist

- [ ] Text contrast ≥ 4.5:1 on dark surfaces; UI borders/focus ≥ 3:1
- [ ] Gold buttons use dark text
- [ ] Focus rings visible on every interactive element
- [ ] `prefers-reduced-motion` → all chapters readable in final state
- [ ] `prefers-reduced-transparency` → glass falls back to solid
- [ ] ≤ 2 pinned sections; 1–2 animated elements per view
- [ ] Mobile fallback for every 3D scene; tested on a real mid-range phone
- [ ] Booking bar usable before WebGL loads; LCP ≤ 2.5s
- [ ] EN + AR (RTL) layouts verified
- [ ] SVG icons only (Lucide); icon buttons have `aria-label`
- [ ] Touch targets ≥ 44px; no horizontal scroll at 375px
- [ ] Responsive at 375, 768, 1024, 1440

---

## Change Log

- **2026-10-23**: First homepage prototype published (private artifact "LuxuryRental.ae Prototype", https://claude.ai/artifact/A9w1rnorC61uzhPxaMGs6f). It covers all four chapters, the glass booking dock, the reservation card, a reduced-motion version and a mobile layout. The car is a procedural particle sculpture standing in for real 3D car models. Cars, prices and specs are samples.
- **2026-10-22** — Generated with UI/UX Pro Max (variance 7, motion 9, density 3). Adapted to dark mode (contrast verified). Shortlist finalised: Burj by Night, Velocity Tunnel, Kinetic Sculpture. Silent Thunder removed.
