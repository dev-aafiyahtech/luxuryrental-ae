# Production Stack

Recommended 22 Oct 2026, then revised the same day with the UI/UX Pro Max skill (see [tools/ui-ux-pro-max.md](../../tools/ui-ux-pro-max.md)).

**Approach:** a custom-coded site with real-time 3D, not a template or no-code builder.

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js** (App Router) | Fast, SEO-friendly, handles English and Arabic (RTL) cleanly |
| 3D | **Three.js + React Three Fiber** (+ drei) | Real-time cars in the browser |
| Motion | **GSAP ScrollTrigger + Flip, Lenis** | Smooth scroll-driven animation; card → detail page transitions |
| 3D assets | **Blender → compressed glTF** (Draco/Meshopt, KTX2) | Light models that still look photoreal |
| CMS | **Sanity** | Team updates fleet, prices and offers without a developer |
| Booking | Custom engine, or HQ Rental / Rent Centric | |
| Payments | Stripe, Checkout.com or Network International | All work in the UAE |
| Hosting | **Vercel + CDN** | Fast worldwide |

## How each theme maps to the stack
- **Burj by Night**: skyline as a 3D scene with a scroll-driven camera path; pre-rendered video on phones.
- **Velocity Tunnel**: shader-based warp tunnel in WebGL; light and smooth.
- **Kinetic Sculpture**: car models split into parts in Blender, exploded and reassembled on scroll.
- *(Silent Thunder, removed: real engine recordings driving lighting.)*

## Rules from the UI/UX Pro Max skill
- `next/font` and `next/image` for zero layout shift.
- Scripted reveals use a GSAP camera rig with `scrub: 1`; OrbitControls only on the 360° car detail view.
- At most 1–2 pinned sections per page.
- Particle systems start around 3,000 particles; profile on a real mid-range phone before raising.
- Mouse **and** touch input for every 3D scene.
- Booking form: visible labels, inline errors, loading then success/error feedback, locale-aware dates.
- `prefers-reduced-motion` renders every chapter in its final readable state.
- Animate only 1–2 key elements per view.

## Non-negotiables
- A lighter mobile version of every 3D scene (most luxury rental traffic in Dubai is assumed to be mobile; working estimate, not measured).
- Booking section loads in under 2.5 s, even if cinematic parts load later.
- Dates + car → "Reserve" in three taps or fewer.

## Open item (from client answers, 23 Oct 2026)
The client has **no 3D models and no 3D budget**, and the fleet changes often. The 3D-car parts of this stack need an image-based alternative. See [requirements-answers.md](../brief/requirements-answers.md).
