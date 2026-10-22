# QA

Checks run on the first prototype (23 Oct 2026).

## Screenshots (`screenshots/`)
Rendered in headless Chromium (SwiftShader WebGL) **before** the final round of fixes, so they show the issues that were then fixed:

| File | What it shows |
|------|---------------|
| `d1-hero.png` … `d7-reserve.png` | Desktop 1440×900, each chapter |
| `m1-hero.png` … `m4-dock-open.png` | Mobile 390×844 |
| `r1-sculpture.png` | Reduced-motion mode |
| `sheet_*.png` | Contact sheets of the above |
| `render-log.txt` | Layout info and console output (no errors) |

Fixed after these screenshots, but **not re-rendered**:
- Header "Reserve" button text was unreadable (nav link colour overrode the button).
- Chapter rail overlapped the rooftop note and reservation card.
- Car overlapped the fleet heading in the tunnel chapter.
- Date fields overflowed the mobile booking sheet.
- Opening skyline too dark (fog and camera target).
- Exploded car looked blurry (jitter reduced, explode distances tightened).
- Reduced-motion chapter detection was off after late font loading (ScrollTrigger now refreshes on layout changes).

## Scripts (`scripts/`)
- `shoot.mjs`: Playwright script that renders the prototype and captures the screenshots. Paths at the top point at the original workspace; adjust `LIB` to a folder with `three@0.128.0`, `gsap@3.12.5`, `lenis@1.1.13`, `@fontsource/syncopate`, `@fontsource-variable/montserrat` installed.
- `contrast.py`: WCAG contrast check for the dark palette (all pairs pass).
