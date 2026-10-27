# 03 · Car visuals: image-based pipeline

> Part of the [project plan](../PROJECT-PLAN.md). Drafted on 23 Oct 2026 by the **Technical Artist** agent using the `image` skill. Where this section and the plan's [decisions](../PROJECT-PLAN.md#4-decisions) differ, the plan wins.
>
> **Overrides for this section:**
> - The top 5 hero cars come from [04 Fleet and pricing](04-fleet-pricing.md#4-top-5-hero-cars-homepage-cinematic).
> - Tool and model availability (including any retirement dates) must be re-checked at kickoff.

**Decision.** No car meshes. Each car is a small set of **AI studio images plus files derived from them automatically**: a cutout, a depth map, a sampling map and component layers. The approved light sculpture stays. Its particles are now **sampled from the car's own image**, so "gold dust forms the car" works for any car. The photoreal image then **dissolves in** under the dust. The procedural skyline, rooftop, tunnel and timeline from the prototype stay as they are. Adding a car means about 55 minutes of hands-on work and no code.

Three rules hold the whole section together:
1. **The images are only the source.** We never show a raw generated background. Every car is cut out and composited into our own scenes, so the 16 cars match even when the generations don't.
2. **The camera never moves further than one image can support.** That is ±10° of yaw around the angle the photo was taken from. Any bigger change of angle happens inside a particle cloud.
3. **The images must match the car the customer gets.** The owner's phone photos of the actual car go in as references and serve as the QA truth (3.4).

## 3.1 Technique per chapter

**Core technique: image-sampled particles.** For each view, the kit writes a lossless 512×256 **sampling map**. Its RGBA channels hold depth, edge strength, component ID and alpha. A Web Worker importance-samples N points from it, weighting each pixel by alpha × (0.25 + 0.75 × edge). It then unprojects them using the photo's assumed camera, with z taken from depth. It outputs the prototype's **exact attribute contract** (`position`, `aExplode`, `aScatter`, `aColor`, `aComp`, `aRnd`, `aBright`), so the existing car shader runs unchanged. Component IDs follow the prototype: 0 body, 1 cabin/glass, 2 wheels, 3 powertrain, 4 headlights, 5 taillights.

Colour comes from the **component ID, not the paint**. Edges render bright gold, panels champagne, glass ice-blue and lamps white or red. The sculpture looks the same for a red Ferrari and a black Cullinan, and the real paint colour appears only when the photo is revealed. Sampling takes about 10 ms for 10k points, so nothing needs pre-baking. Particle counts are in 3.6.

| # | Chapter | Pick | Why this and not the alternative |
|---|---------|------|----------------------------------|
| 0 | Burj by Night | Dust sampled from `hero34f` forms the car on the pad (`uForm`, as in the prototype). At c1 ≈ 0.92 the cutout plate **dissolves in**: a noise-threshold reveal with a 2 px gold edge, using the dissolve shader pattern. About 15% of the dust then stays as an edge shimmer. The plate is a depth-displaced mesh (192×108 segments) and gets our own contact shadow and a 25% pad reflection. | Ending on the photoreal car is what sells. Placing a flat cutout on the roof would look pasted on. A full AI-generated "car on rooftop" scene would break the 3D camera descent. |
| 1 | Velocity Tunnel | When the tunnel starts, the plate dissolves back into particles, and a vertex offset stretches them along the velocity: the car becomes light. The category cards stay in the DOM and use `side` cutouts at 640w with a CSS translate+blur entry. | Particles in motion read as speed. A moving photo with smear blur looks cheap at tunnel speed. |
| 2 | Kinetic Sculpture | **Layered cutouts from segmenting the one `side` image** (SAM 2 click prompts): body (arches and glass inpainted dark), cabin/glass, front wheel, rear wheel, lights. Each layer is depth-displaced and moves along scripted vectors: cabin up, wheels down and toward the camera at 1.08× scale, lamps outward. The body fades to a gold **edge-line x-ray** (Sobel edges from the sampling map) to reveal a **procedural powertrain schematic** built from CMS fields (layout, cylinders, hybrid/EV). Seam dust (component-tagged edge points) bridges the gaps. | One source image guarantees the parts line up and share the same lighting. Separate AI renders would not register. An AI-rendered "Chiron W16 engine" would be fiction presented as fact, and an honest schematic does not need images. |
| 3 | Reassembly, headlights, launch | The layers fly back and dissolve into dust. The dust then **morphs from side-sampled to hero34f-sampled positions** while the camera swings to the 3/4 pose. That morph is the only change of angle. The hero34f plate dissolves in and the headlights ignite: `hero34f_lights` mask × `uHead` as emissive, a bloom pass with threshold 0.9 so only the lamps bloom, and the prototype's beam meshes aimed along the view heading. For the launch, the plate moves along its heading at 1→1.15× scale with an 8-tap directional blur. Its tail dissolves into streaks as the tunnel shader ramps up. | A 2.5D image cannot orbit 50° (the prototype orbits az3→az4), but a particle morph can. Glow from bloom threshold masking costs one pass, where stacked additive sprites cost overdraw. |

**Kept from the prototype, with no per-car work:**
- Sky, stars and beacons.
- The tower shader and lit windows, the stepped supertall, fog and the ground.
- The rooftop floor shader (`uPad`/`uRoad`/`uStudio`/`uHead`).
- The tunnel streak shader.
- The descent curve.
- The c1–c4 chapter windows and smoothstep timing.
- The headlight beams.
- The DOM callout system.

**Replaced:** `buildCar()` becomes `buildCarFromImage(sampleMap, view, N)`.

**Camera rig changes the front end must accept:**
- The descent ends on a pose locked to the photo: azimuth 40°, height-matched. It does a dolly-zoom from FOV 40° to about 22° over the last 20% of c1, which also matches the long-lens look.
- Kinetic is shot side-on with ±10° of yaw and a slow dolly. The prototype's orbit goes.
- Every move that goes beyond ±10° runs while the car is particles.

**Car detail page:**
- The GSAP Flip shared element is the `hero34f` cutout, which an image does better than a mesh.
- The 360° OrbitControls view becomes a **Views strip**: drag snaps between hero34f, side and rear34 with a 250 ms dust crossfade, plus ±6° depth parallax on pointer move. It is not labelled "360°".
- The Kinetic toggle reuses the Ch 2 component.

**Fallbacks.** These use the same files, so no extra assets are made per car.

| Chapter | Mid tier (modern phones) | Low tier / reduced motion / save-data |
|---------|--------------------------|----------------------------------------|
| 0 | Real-time, 3k particles, plate mesh 96×54, no reflection | Shared skyline poster (rendered once from the procedural scene) + hero34f cutout `<img>` + contact-shadow PNG. Phase 2: auto-rendered loop per car. |
| 1 | Same shader, 600 streaks | Gradient streak still + crossfade (MASTER) |
| 2 | Atlas at 1024 px; body fades to 35% instead of the x-ray; dust from the car budget | Pre-composited `composite-exploded` AVIF + spec list |
| 3 | 4-tap blur; glow sprites instead of bloom | `composite-lit` AVIF (lights mask blurred and screen-blended) + Reserve panel |

**Rejected for MVP:**
- **Image-to-3D** (Hunyuan3D, TRELLIS, Tripo, Meshy): the surfaces wobble and badges are invented. Re-evaluated in Phase 3.
- **AI turntable video**: the frames are inconsistent, so it cannot be scrubbed honestly. Phase 3.
- **Mirroring images to get the other side**: badges and text reverse, and fuel caps, exhausts and the LHD cabin end up wrong. **Never mirror a car image**, and that includes RTL layouts.

## 3.2 Per-car asset spec

**Generated images.** Exteriors are 16:9 at the model's native 4K (≥ 3840 px wide). Interior and detail shots are 3:2, ≥ 3600 px wide. The camera azimuth is measured from the nose, with 90° = the car's left (driver) side.

| Code | View and camera | Framing | Used for | When |
|------|-----------------|---------|----------|------|
| `hero34f` | Front 3/4 of the left flank, azimuth 40°, nose to frame right, camera 0.9 m, 70 mm, f/8 | Car 78% of width, 8% floor below tyres | Ch 0/3 plate and particles, fleet card, detail hero, OG | MVP, all 16 |
| `side` | Pure left profile, nose to frame right, camera 0.6 m square-on, 135 mm | Car 88% of width | Ch 2 layers, category cards, Views, proportion check | MVP, all 16 |
| `int-cockpit` | From the open driver door at seat height, LHD, 24 mm, screens off | 3:2 | Detail gallery | MVP, all 16 |
| `rear34` | Rear 3/4 of the left flank, azimuth 140°, nose to frame left | As hero34f | Views, gallery | MVP top 5 · Phase 2 others |
| `det-wheel` | Wheel and caliper, low 3/4 close-up | 3:2 | Callout insert, gallery | MVP top 5 |
| `det-light` | Headlamp close-up, lamps off | 3:2 | Callout insert | MVP top 5 |
| `front` | Dead front, camera 0.8 m, 85 mm | 16:9 | Views | Phase 2 |
| `int-rear` / `det-engine` | Rear seats or boot (SUVs) / engine, only if visible on the real car | 3:2 | Gallery | Phase 2 |

**Not published:** owner reference photos `ref-01…05`. These are phone shots of the actual car: front 3/4, side, rear 3/4, interior, and a wheel/badge close-up. They take 10 minutes in the car park and stay in a private Sanity field.

**Derived by the kit.** None of these are generated by hand.

| File | Spec |
|------|------|
| `_master.png` | Fixed and graded, 8-bit sRGB PNG. The untouched generation is kept as `_gen.png`. |
| `_cutout.png` | RGBA, cropped to the alpha bounding box + 4%. Ground line and px-per-metre are stored in the CMS. |
| `_depth16.png` / `_depth.webp` | 16-bit master / 8-bit lossless 1024×512 runtime file. Glass is filled from the surrounding body and the map is smoothed with a bilateral filter. |
| `_sample.png` | 512×256 lossless RGBA: R depth, G edge, B component ID × 40, A alpha |
| `_lights.png` | 8-bit lamp mask for hero34f and side. Lamp centroids are written to `anchors`. |
| `_layer-{body,cabin,wheel-f,wheel-r,lights}.png` | Side view only, registered to the same frame. Recompositing them must diff to zero. |
| `_atlas.avif` + `_atlas.json` | All 5 layers packed: 2048×1024 (high) and 1024×512 (mid) |
| `_composite-exploded.avif`, `_composite-lit.avif` | Static fallbacks |
| `_og.jpg` | 1200×630 JPEG, built from the cutout on the brand background with Satori text |
| `@{640,828,1080,1600,2048}.avif/.webp` | DOM images, served through the Sanity CDN (`auto=format`). WebGL textures come from the kit's fixed sizes. |

**Naming.** The pattern is `{slug}_{view}_{kind}[@{width}].{ext}`. The slug is `{make}-{model}-{year}-{paint}` in lower-kebab ASCII, and the car's colour is part of its identity.
- Example: `ferrari-296-gtb-2025-rosso-corsa_hero34f_cutout@1600.avif`
- Folders: `cars/{slug}/refs/` (private), `masters/`, `web/`.
- The same model in a second colour is a second car record with its own image set.

**Colour and lighting rules** (these produce the black-and-gold night look):
1. **One studio for every car.** It is a seamless dark charcoal cove (about 25% grey, around `#404040`) with a matte floor. It is grey rather than black so that tyres, floor and black paint separate cleanly for matting. The night look comes from our compositing: `#0C0A09` space, the rooftop, our own contact shadow and our reflection.
2. **Neutral 5600K key** (an overhead strip plus two long side strips) so the paint reads true. The only coloured light is a narrow warm-amber rim on the roofline and rear haunch, at most about 10% of the visible body. Ice-blue `#7DD3FC` is added in-engine (glass sheen, headlight glow, tunnel) and never baked in.
3. **Lamps and DRLs off** in every image, because we ignite them. Wheels straight; doors, windows and roof closed; no plates, people, props, lens flare, smoke or motion blur.
4. **Shared grade.** The `lr-night.cube` LUT runs after the cutout: black point near `#0C0A09`, a gentle S-curve, warm highlights. A paint guard checks that body pixels shift no more than ΔE00 5 against the ungraded master. If they do, the LUT strength drops automatically.
5. **Normalisation.** The median luminance of the body region must be within ±8% of the golden car. Scale is set to px per metre from `wheelbaseMm`, so a Cullinan stands taller than a 296 on the same rooftop. The ground line sits at y = 0.

## 3.3 AI generation kit

| Job | Pick (Oct 2026; pin versions in `kit.json`) | Backup | Rule |
|-----|---------------------------------------------|--------|------|
| Generate | **Gemini 3 Pro Image ("Nano Banana Pro")** via API: strong knowledge of real cars, ≤ 14 reference images, native 4K, conversational fixes | **FLUX.2 [pro]/[flex]**: up to 10 references, best at holding the lighting | Don't build on `gpt-image-1` (reported to be retiring; verify); GPT Image 2.5 is a third opinion only. Midjourney v7 is for moodboards only: no API, weaker brand accuracy. |
| Fix details | Nano Banana Pro edit (badge, caliper, wheel) | FLUX Kontext / FLUX.2 edit, Photoshop Generative Fill | Fix locally. Never regenerate a whole approved image to fix one detail. |
| Upscale | Usually none (generate at 4K). Otherwise Topaz Gigapixel *Standard/High Fidelity* | Real-ESRGAN ×2 | No creative upscalers (Topaz Redefine, Magnific creative): they invent grilles and badges. |
| Cut out | **BiRefNet** (MIT) on fal/Replicate or locally | Photoroom API | BRIA RMBG 2.0 open weights are non-commercial. |
| Depth | **Depth Anything V2 Small** (Apache-2.0) at 1024 px + kit clean-up | A licensed larger model or commercial API | DA V2 Base/Large/Giant weights are CC BY-NC 4.0, so they are not usable here without a licence. |
| Segment / inpaint | **SAM 2** (Apache-2.0) with click prompts in the kit's layer tool; **LaMa** (Apache-2.0) for arches and glass | Photoshop Select Subject + Generative Fill | SAM 3 text prompts ("wheel") only once its licence is cleared |
| Encode | sharp (libvips): AVIF q55, WebP q75, JPEG q80; oxipng for PNG | Squoosh CLI | |

**Consistency across 16 cars.** Consistency comes from references, not from prompt words.
1. **Studio plate kit, built once.** `studio_plate_v1.png` is the empty cove with the lighting. The **golden car** is top-5 car #1 in hero34f and side, approved by Zubair. Every later generation gets these reference images in this order: [studio plate, golden view, 2–4 owner photos].
2. **Freeze everything.** Model ID and version, resolution, aspect and the template text go in `kit.json`. Every generation's prompt, seed and refs are logged to `provenance`.
3. **Batch by view.** Generate all 16 `hero34f` in one session, then all 16 `side`. Then review a **contact sheet** of the 16 cutouts on `#0C0A09` and re-roll the odd one out.

**Master template.** Variables are in `{}`. The prompt is plain language, because these models ignore "negative prompt" fields.
```text
Image 1 = studio, background and lighting. Image 2 = camera angle and framing. Images 3+ = this exact car.
Photoreal studio photograph of a {year} {make} {model} {variant} in {paint_name} ({paint_finish}),
{wheel_desc} wheels, {caliper_colour} brake calipers, exactly as the production car and as in images 3+:
factory-correct proportions, light graphics, intakes, badges and their positions.
View: {view_spec}.
Studio: seamless dark charcoal cove (about 25% grey), matte floor, soft contact shadow, nothing else in frame.
Lighting: as image 1. Neutral 5600K overhead strip softbox, two long side strips giving clean horizontal
highlights, narrow warm amber rim light from behind on the roofline. Headlights and DRLs off.
Wheels straight, doors, windows and roof closed, no number plate, no text, no people, no props, no watermark.
Avoid: extra or invented badges, garbled lettering, aftermarket parts, changed wheel design, stretched body,
lens flare, fog, motion blur, coloured backdrop, tilted horizon, wide-angle distortion.
{aspect}, 4K, sharp focus front to back.
```
**`{view_spec}` values:**
- **hero34f:** "front three-quarter of the car's left side, camera 40° off the nose, nose pointing to frame right, camera height 0.9 m, 70 mm lens, f/8, car fills 78% of the frame width".
- **side:** "pure side profile of the car's left side, nose pointing to frame right, camera square to the car at 0.6 m, 135 mm lens, minimal perspective, car fills 88% of the frame width".
- **rear34:** "rear three-quarter of the car's left side, camera 140° off the nose, nose pointing to frame left".

**Examples.** The variable values illustrate the format. In production they always come from the actual car and the owner's photos.
1. **Ferrari 296 GTB, `hero34f`:** "…a 2025 Ferrari 296 GTB in Rosso Corsa (solid gloss red), silver forged twin-spoke wheels, yellow brake calipers, exactly as the production car and as in images 3+… View: front three-quarter of the car's left side, camera 40° off the nose, nose pointing to frame right, camera height 0.9 m, 70 mm lens, f/8… 16:9, 4K."
2. **Rolls-Royce Cullinan Series II, `side`, black paint:** "…in Diamond Black (metallic), 23-inch polished wheels with self-righting centre caps, chrome Pantheon grille… View: pure side profile of the car's left side… 135 mm lens… The rim light and strip highlights must clearly separate the roofline, bonnet edge and tyre sidewalls from the background." Black cars always get this extra sentence.
3. **Lamborghini Revuelto, `int-cockpit`:** "Image 1 = lighting mood. Images 2+ = this car's interior. Photoreal interior photograph of a 2025 Lamborghini Revuelto cockpit, left-hand drive, seen from the open driver's door at seat height across the steering wheel to the dashboard, 24 mm, f/5.6. Trim exactly as images 2+: black Alcantara with yellow contrast stitching, carbon-fibre trim, the model's correct steering wheel and centre tunnel. Dark cabin, soft neutral light through the windscreen, warm amber rim on the seat bolsters. Screens off (black glass), no readable text or UI, no people. 3:2, 4K."

**QA checklist.** Studio blocks publishing until every box is ticked.
- [ ] Right **generation/facelift**: lamp graphics, bumpers and intakes match the owner photos and the model year.
- [ ] **Proportions**: the kit overlays the side cutout scaled by wheelbase. Length/height ratio must be within ±3% of `lengthMm/heightMm`, and the overhangs must look right.
- [ ] **Wheels**: design, spoke count, caliper colour and centre caps match the actual car, and all visible wheels match each other.
- [ ] **Badges and text**: right badge, right place, right count. No garbled lettering, nothing mirrored, no plate, no stray text anywhere. Check at 200% zoom.
- [ ] **Details**: mirrors, door count, wipers, exhaust count and position, fuel-cap side, aero/wing. No extra vents, melted grilles or duplicate parts.
- [ ] **Paint** matches the colour name and the owner photos; the paint guard passed. Interior colour, stitching and steering wheel match; LHD; screens off.
- [ ] **Cutout**: no halo on `#0C0A09` or `#FAFAF9`, clean tyre contact, glass opaque and dark. **Depth**: no holes, wheels convex, no tearing at ±10° yaw. **Layers** recomposite to zero diff.
- [ ] Reviewed **in-engine** on `/preview/car/{slug}` (rooftop, Kinetic, lit finale, detail page) and on the contact sheet. Never approve from an image viewer alone.
- [ ] Naming, alt text, `status`, provenance and labels are all set.

## 3.4 Honesty and legal

1. **What you see is what you get.** Images must show the car the customer receives: model, generation, body style, paint, wheels and interior colour. The owner's phone photos are the reference and the QA truth for every car. No "or similar" on a named car. If ops can't guarantee a colour, the image set is made for the colour actually in the fleet.
2. **Label until real photos replace the images.** `status` drives the label automatically:
   - `ai-illustrative`: "Illustrative AI image. The car you receive may differ in colour and trim."
   - `ai-verified`: "AI-generated image, checked against our actual car."
   - `photo`: no label.

   The label sits on the image (12 px, ≥ 4.5:1 contrast) on cards, detail pages and galleries. The homepage chapters show one footnote line, following the prototype's existing "Sample specs" fine print. Since bookings go through WhatsApp, ops sends a **live video of the actual car on request** (Phase 2 makes it a button).
3. **Specs are facts, never AI output.** Callout numbers (hp, 0–100, top speed) come from manufacturer data in the CMS. The Kinetic powertrain is labelled "Schematic" and is never presented as the real engine.
4. **Trademarks.** Brand and model names are used only to identify the cars we rent. No manufacturer logos as standalone graphics (nav, filters, ads, OG layouts); since 27 Oct 2026 (D-22) monochrome maker logos appear only as labels beside the cars (cards, car and brand pages, footer marques row). No "official", "authorised" or partner wording. Footer: "Ferrari, Lamborghini, … are trademarks of their owners. Luxuryrentals is not affiliated with or endorsed by them." Badges on a car are shown only because they are part of the car. A wrong badge is fixed with the edit model; never paste in a downloaded logo file. Some makers hold shape and trade-dress registrations, and Ferrari enforces actively.
5. **References and rights.**
   - Manufacturer press photos are licensed for editorial use. Use them **only privately for QA**: never publish them, never use them as generation inputs. The owner's photos are the inputs.
   - Use paid tiers that grant commercial rights.
   - Keep C2PA/SynthID credentials in the masters, keep the provenance log, and never try to strip watermarks.
   - AI output may not be protected by copyright, so competitors could copy it. Our composited scenes, and later real photos, reduce that risk.
6. **Ads and consumer law.** Meta and Google label or require disclosure of AI imagery, and their vehicle-ad policies ban misrepresentation. UAE consumer protection law (Federal Law No. 15 of 2020) prohibits misleading descriptions. **Have the UAE lawyer confirm the label wording, the disclaimer and the brand use before launch.**
7. **Swap plan.** Real photos use the **same spec**: same angles, the same 25% grey cove and lighting brief, the same kit. Swapping one in is a re-upload that sets `status: photo`, with no code change. Phase 2 starts with the top 5.

## 3.5 Production workflow and effort

**Roles:**
- **Ops (Zubair or an ops team member):** owner photos, car facts, final approval.
- **Asset producer:** a trained in-house person or the agency. Generates, runs QA and uploads.
- **Tech artist:** kit, studio plate, LUT, shaders, budgets, sign-off rules.
- **3D/front-end dev:** the scenes.

**Per car, MVP set** (`hero34f`, `side`, `int-cockpit` and all derived files):

| Step | Who | Min |
|------|-----|-----|
| 1. Shoot 5 owner photos; enter make, model, year, paint name and finish, wheel/caliper/interior description, wheelbase/length/height, powertrain layout | Ops | 10 |
| 2. Generate hero34f and side, 4–6 candidates each, using the template and refs | Producer | 12 |
| 3. Pick and fix (edit model for badges, wheels, calipers) | Producer | 8 |
| 4. Generate and check `int-cockpit` | Producer | 6 |
| 5. `lr-assets build {slug}`: crop and normalise → BiRefNet → depth → SAM 2 layers (4 clicks: 2 wheels, glass, lamps) → LaMa → masks → sampling maps → LUT → derivatives → OG → contact-sheet tile | Producer + script | 8 (about 2 of it automatic) |
| 6. `lr-assets upload {slug}` fills the Sanity fields | Script | 2 |
| 7. In-engine preview and QA checklist | Producer | 7 |
| 8. Approve | Ops | 3 |
| **Total hands-on** | | **≈ 56** |

The first 3 cars will take about 2 h each while the producer learns the kit. **Top-5 extras** (rear34, det-wheel, det-light, hand-polished depth and layers, callout copy) add about 75 min.

**CMS: the `car.visuals` object in Sanity.**
- `status` (enum)
- `referencePhotos[]` (private)
- `paint {name, finish, hex}`, `wheelDesc`, `interiorDesc`
- `views.{hero34f, side, rear34, front}`: each holds `{master, cutout, depth, sample, lights, crop, groundY, pxPerM}`
- `layers {body, cabin, wheelF, wheelR, lights, atlas, atlasMap, compositeExploded, compositeLit}`
- `anchors {wheelF, wheelR, cabin, nose, headlights[], taillights[]}`, normalised 0–1. The kit fills them and they stay editable.
- `powertrain {layout, cylinders, hybrid, ev}`
- `interior[]`, `details[]`, each with alt text and caption
- `og`
- `alt {en, ar}`
- `provenance {model, version, prompt, seed, refs, date, operator}`
- `qa {…checks, reviewer, date}`
- `specs.wheelbaseMm` / `lengthMm` / `heightMm`

A Studio document action blocks Publish until `qa` is complete, and it sets the label from `status`.

**Initial 16 cars:**
- **Day 1:** the tech artist builds the studio plate and the golden car, and Zubair signs off the look in-engine.
- **Days 2–5:** the producer works in brand pairs and batches by view, with a contact-sheet review after every 4 cars.
- **Volume:** about 18 h (16 × ≈ 56 min, plus about 1 h extra for each of the first 3) + top-5 extras ≈ 6 h + a 20% rework buffer ≈ **4.5 producer days**.
- **Generation spend:** roughly 16 cars × 35 images ≈ 560 images, at about US$0.13–0.25 each at current list prices, so **≈ US$75–140**. Check current pricing.

## 3.6 Performance budget

Imagery loads **after first paint**. The booking bar never waits for it, and the LCP target stays ≤ 2.5 s on mobile.

**Device tiers:**
- **High:** desktop GPU, DPR ≤ 1.75.
- **Mid:** modern phones, DPR ≤ 1.5.
- **Low:** save-data, `deviceMemory` < 4, no WebGL2, a failed perf probe, or reduced motion.

drei `PerformanceMonitor` drops a device one tier if frame time averages over 20 ms for 2 s.

| Budget | High | Mid | Low |
|--------|------|-----|-----|
| Car particles (the same points are reused for dust, seams and morph) | 10,000 (hard cap 12,000; the prototype ran about 11k) | **3,000** start, 4,000 only after profiling an iPhone 12 and a Galaxy A5x | 0 |
| Tunnel streaks | 1,400 | 600 | CSS gradient |
| Overdraw, converged car (measured) | ≤ 6 layers | ≤ 3 layers | – |
| GPU time, whole scene | ≤ 8 ms (M1 / Iris Xe class) | ≤ 12 ms | – |
| Plate texture (hero34f) | 2048×1024 | 1024×512 | `<img>` 828w |
| Kinetic layer atlas | 2048×1024 | 1024×512 | 1 composite AVIF |
| Depth (R8) / sampling map (CPU only) | 1024×512 / 512×256 | 512×256 / 512×256 | – |
| Car texture VRAM | ≤ 40 MB | ≤ 12 MB | – |
| Featured-car download | ≤ 600 KB | ≤ 280 KB | ≤ 120 KB |

**Textures.** They are uploaded as decoded RGBA8 from AVIF/WebP, so there's no transcoder latency. Fewer than 8 car textures per scene does not justify the KTX2/Basis payload. Revisit KTX2 (BC7 on PC, ASTC on mobile) if Phase 3 brings meshes or splats.

**Per-file ceilings** (AVIF q≈55 / WebP fallback):

| File | Ceiling |
|------|---------|
| Shared skyline poster | 1920w ≤ 140 KB · 828w ≤ 70 KB |
| hero34f cutout with alpha | 1600w ≤ 120 KB (WebP ≤ 200) · 828w ≤ 55 KB |
| Detail-page hero (LCP) | 1600w ≤ 140 KB / 828w ≤ 65 KB, `priority`, inline blur placeholder ≤ 1 KB |
| Fleet card | 640w ≤ 35 KB, lazy |
| Kinetic atlas | ≤ 220 KB / ≤ 100 KB |
| Interior / detail shots | 1280w ≤ 120 KB, lazy |
| OG | **JPEG** 1200×630 ≤ 150 KB (WhatsApp link previews are unreliable with large files or WebP/AVIF) |
| Masters | Never served |

## 3.7 Tasks, risks and open questions

| ID | Task | Days | Depends on | Phase |
|----|------|------|-----------|-------|
| V1 | Look-dev: studio plate, lighting brief, golden car (hero34f + side), `lr-night.cube`; Zubair signs off in-engine | 1.5 | Fleet list and top 5 | MVP |
| V2 | Prompt kit: template, view specs, `kit.json`, avoid list; test on 3 brands including one black car | 0.5 | V1 | MVP |
| V3 | `lr-assets` CLI: normalise, BiRefNet, depth + glass fill, lights mask, sampling map, LUT and paint guard, derivatives, OG, contact sheet, proportion overlay | 3 | V1 | MVP |
| V4 | Layer tool: SAM 2 clicks → 5 layers, LaMa inpaint, atlas, zero-diff check, composites | 2 | V3 | MVP |
| V5 | Sanity `car.visuals` schema, upload script, QA publish gate, label rendering | 1.5 | V3 | MVP |
| V6 | `buildCarFromImage` worker: importance sampling, prototype attribute contract, morph pairing by component and x | 2 | V3 | MVP |
| V7 | Plate renderer: depth mesh, dust↔photo dissolve, contact shadow and reflection, lamp emissive + bloom mask, launch blur | 3 | V6 | MVP |
| V8 | Chapter integration: locked end pose and dolly-zoom, side-on Kinetic with x-ray and procedural powertrain, side→3/4 morph, CMS anchors for callouts | 4 | V4, V7 | MVP |
| V9 | Tiering and fallbacks: PerformanceMonitor, shared skyline poster, CSS composites, reduced-motion states | 1.5 | V8 | MVP |
| V10 | Produce 16 MVP sets + top-5 extras, contact-sheet reviews | 4.5 | V2–V5 | MVP |
| V11 | Profiling on reference devices; tune particle caps, overdraw and texture sizes | 1 | V8–V10 | MVP |
| V12 | Labels, footer disclaimer, alt text EN; brief the UAE lawyer | 0.5 (+ lawyer) | none | MVP |
| P1 | Studio "Process visuals" button: webhook → fal/Replicate jobs → fields written back (target 40 min per car) | 3 | V3–V5 | Phase 2 |
| P2 | Auto-rendered Ch 0 loop per car (Playwright + ffmpeg, AV1/H.264, ≤ 1.2 MB) for the low tier | 1.5 | V9 | Phase 2 |
| P3 | Views strip on detail pages; rear34 for the other 11 cars; Kinetic toggle for all cars | 2.5 | V7, V10 | Phase 2 |
| P4 | Real night-studio shoot of the top 5 to the same brief, then swap (`status: photo`) | 1 (+ shoot day) | Client budget | Phase 2 |
| P5 | Live-car-video button on WhatsApp; AR alt text | 0.5 | Arabic plan | Phase 2 |
| P6 | Evaluate a true 360° for the top 5: Gaussian splats from a 60 s phone walkaround of the real car, against image-to-3D | 3 | Physical cars | Phase 3 |

**Totals:** MVP ≈ 25 ideal days, of which about 4.5 are asset production and the rest is one-time build. Phase 2 ≈ 8.5 days plus the shoot. Phase 3 ≈ 3 days.

**Risks:**
- **AI gets real models wrong** (generation, wheels, badges). Most likely on low-volume cars such as Bugatti. Mitigation: owner photos as references, the edit pass, the proportion overlay and the publish gate.
- **Black cars and tyres matte badly.** Mitigation: the grey cove, rim light, manual touch-up in step 5 and the white-background halo check.
- **2.5D tears if the camera moves too far.** Mitigation: hard yaw limits, angle changes only inside particles, and the front end accepting the rig change from the prototype.
- **Look drifts across cars or when a provider updates a model silently.** Mitigation: pinned versions, the golden car, batching by view, and the contact sheet.
- **Photo and procedural scene clash.** Mitigation: the shared grade, the dissolve, and sign-off on the golden car before any batch (V1).
- **Model licences** (DA V2 Large and RMBG 2.0 are non-commercial). Mitigation: the permissive picks above.
- **Overdraw spikes on mid phones as the dust converges.** Mitigation: the caps above and adaptive tier drop.
- **Brand or consumer complaint.** Mitigation: the labels, the representation rule, lawyer review and a quick swap path to real photos.

**Open questions for Zubair:**
1. Are all 16 cars physically in the fleet now? Owner photos and the representation rule depend on it. If some are sourced from partners, those images stay `ai-illustrative`.
2. What are the exact year, paint, wheels and interior of each car? Are there duplicate models in different colours?
3. After launch, who produces assets: an in-house person (0.5 d training) or the agency?
4. Is the homepage featured car fixed per campaign, or does it rotate across the top 5? Rotation means all 5 must be hero-ready at launch.
5. Arabic/RTL: keep nose-right (recommended), or generate a nose-left set later? Mirroring is not an option.
6. When is the budget for the Phase 2 real-photo shoot of the top 5?
