# UI/UX Pro Max skill

The design system in `docs/design-system/` was generated with the open-source **UI/UX Pro Max** skill:

- Source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Commit used: `076a2b3a31394ad788afaa71f55d0bf789e7b3ec` (2026-10-22)

The skill is not vendored into this repo. To regenerate or extend the design system, clone it and run its search script.

## Commands used

```bash
S=ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/scripts/search.py

# Design system (dials: variance 7, motion 9, density 3)
python3 $S "luxury car rental premium dark cinematic" --design-system --persist \
  -p "LuxuryRental.ae" --output-dir . --variance 7 --motion 9 --density 3

# Supplementary searches
python3 $S "dark cinematic immersive 3D" --domain style -n 3
python3 $S "luxury dark gold premium" --domain color -n 3
python3 $S "futuristic luxury display" --domain typography -n 3
python3 $S "scroll storytelling hero booking" --domain landing -n 3
python3 $S "pin scrub scroll cinematic" --domain gsap -n 3
python3 $S "performance mobile gltf draco" --stack threejs -n 4
python3 $S "scroll camera react three fiber" --stack threejs -n 3
python3 $S "image font performance core web vitals" --stack nextjs -n 4
python3 $S "reduced motion" --domain ux -n 2
python3 $S "booking form date picker mobile" --domain ux -n 3
python3 $S "arabic sans display" --domain google-fonts -n 5
```

## What was changed from the skill's raw output
- The skill's luxury palette is light-mode; it was inverted to dark and every text pair contrast-checked (`qa/scripts/contrast.py`).
- The gold accent was restored to `#CA8A04` (the skill had darkened it to `#A16207` for light backgrounds only).
- "Liquid Glass" was limited to the booking panel and nav (the skill tags it as app-chrome styling).
- Typography switched to Syncopate + Montserrat (the skill's automotive pairing), with Noto Kufi Arabic + Readex Pro planned for Arabic.
