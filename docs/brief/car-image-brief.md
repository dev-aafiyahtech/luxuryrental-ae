# Car image brief (AI images for the demo)

**24 Oct 2026.** Zubair is generating the AI car images. This is what the site needs. Colours and trim follow [assumptions.md §6](assumptions.md#6-the-cars); if you change a colour, tell us and we update the data to match.

## What to make

**All 16 cars: 3 images each (48 images)**

| View | File name | Shot | Shape |
|---|---|---|---|
| Hero | `{slug}_hero.jpg` | Front three-quarter of the car's **left** side, nose pointing to the **right** of the frame, camera at headlight height, car fills about 75% of the width | 16:9 |
| Side | `{slug}_side.jpg` | Pure side profile of the **left** side, nose to the **right**, camera square to the car, car fills about 85% of the width | 16:9 |
| Interior | `{slug}_interior.jpg` | Cockpit seen from the open driver's door at seat height, left-hand drive, screens off | 3:2 |

**Top 5 only (Revuelto, Cullinan, Chiron Super Sport, 296 GTS, 750S Spider): 2 extra (10 images)**

| View | File name | Shot | Shape |
|---|---|---|---|
| Rear | `{slug}_rear.jpg` | Rear three-quarter of the left side, nose pointing to the left of the frame | 16:9 |
| Wheel | `{slug}_wheel.jpg` | Close-up of the front wheel and brake caliper, low angle | 3:2 |

**58 images in total.** The card image is cropped from the hero, so it isn't needed separately.

## Rules for every image

- **Size:** at least 2400 px wide (3840 px if the tool allows). JPG or PNG.
- **Background:** the same for every car: a seamless dark **sea-moss green** studio (deep green-teal, close to `#1D3C3C`), matte floor, soft shadow under the car. Nothing else in the frame.
- **Light:** neutral white light from above and the sides so the paint looks true, and a thin warm gold rim light on the roofline.
- **The car:** the exact model, generation and colour in the table below. Headlights **off**, wheels straight, doors, windows and roof **closed** (convertibles with the roof up for the side view; the hero can be roof down).
- **No** number plates, text, people, props, watermarks, lens flare or motion blur. Check the badges and lettering are correct and not garbled.

## The 16 cars

| # | Slug (file name prefix) | Car | Year | Exterior | Interior | Wheels |
|---|---|---|---|---|---|---|
| 1 | `lamborghini-revuelto` | Lamborghini Revuelto | 2025 | Arancio Apodis (orange) | Black leather and Alcantara, orange stitching | 21/22-inch forged, gloss black |
| 2 | `rolls-royce-cullinan` | Rolls-Royce Cullinan Series II | 2025 | Diamond Black | Arctic White leather, black piping | 23-inch forged, polished |
| 3 | `bugatti-chiron-super-sport` | Bugatti Chiron Super Sport | 2023 | Nocturne Blue Carbon (dark blue, exposed carbon) | Black leather, blue stitching | 20/21-inch forged, dark |
| 4 | `ferrari-296-gts` | Ferrari 296 GTS | 2025 | Giallo Modena (yellow) | Black leather, yellow stitching | 20-inch forged, diamond finish |
| 5 | `mclaren-750s-spider` | McLaren 750S Spider | 2025 | Papaya Spark (papaya orange) | Black leather and Alcantara | 10-spoke forged, gloss black |
| 6 | `ferrari-purosangue` | Ferrari Purosangue | 2026 | Rosso Corsa (red) | Tan leather | 22/23-inch forged |
| 7 | `lamborghini-urus-se` | Lamborghini Urus SE | 2025 | Nero Noctis (black) | Black leather, red stitching | 23-inch forged, gloss black |
| 8 | `mclaren-artura` | McLaren Artura | 2025 | Silica White | Black Alcantara | 10-spoke forged, gloss black |
| 9 | `aston-martin-dbx707` | Aston Martin DBX707 | 2025 | Satin Xenon Grey | Black leather, red stitching | 23-inch forged, satin black |
| 10 | `aston-martin-db12-volante` | Aston Martin DB12 Volante | 2025 | Iridescent Emerald (green) | Ivory leather, dark walnut | 21-inch forged, satin black |
| 11 | `bentley-bentayga-ewb` | Bentley Bentayga EWB Azure | 2025 | Onyx (black) | Linen and black leather, walnut | 22-inch, 10-spoke, painted |
| 12 | `bentley-continental-gtc-speed` | Bentley Continental GTC Speed | 2025 | Glacier White | Black leather with red accents | 22-inch forged, black and polished |
| 13 | `rolls-royce-phantom` | Rolls-Royce Phantom Series II Extended | 2025 | Arctic White | Seashell (cream) leather, navy piping | 22-inch polished |
| 14 | `maserati-mcpura-cielo` | Maserati MCPura Cielo | 2025 | Blu Infinito (blue) | White leather, blue stitching | 20-inch forged, gloss black |
| 15 | `maserati-granturismo-trofeo` | Maserati GranTurismo Trofeo | 2025 | Grigio Lava (dark grey) | Black leather, red stitching | 20-inch forged, dark |
| 16 | `bugatti-chiron-sport` | Bugatti Chiron Sport | 2022 | Italian Red and Black (two-tone) | Red and black leather | 20/21-inch forged, black |

## Prompt you can reuse

Change the parts in `{ }` for each car and view:

```text
Photoreal studio photograph of a {year} {car} in {exterior}, {wheels} wheels,
exactly as the production car: correct proportions, lights, intakes and badges.
View: {front three-quarter of the car's left side, nose pointing to frame right, camera at headlight height}.
Studio: seamless dark sea-moss green cove (deep green-teal), matte floor, soft contact shadow, nothing else in frame.
Lighting: neutral white overhead and side softboxes, thin warm gold rim light on the roofline.
Headlights off, wheels straight, doors and windows closed, no number plate, no text, no people, no watermark.
16:9, 4K, sharp focus.
```

For black cars add: "Keep the roofline, bonnet edge and tyres clearly separated from the dark background with the rim and strip highlights."

## How to send them

Attach them in the chat (a zip is fine), named as above, e.g. `ferrari-296-gts_hero.jpg`. Partial batches are fine: each car switches from the line-art illustration to its images as soon as they arrive. The site labels them "Illustrative AI image" until real photos replace them.
