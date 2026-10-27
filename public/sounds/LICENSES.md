# Homepage sounds: sources and licences

The three scroll sounds on the homepage are edited from real recordings and stock sound effects. Every source allows commercial use. Two of the three files need a credit:

| File | Cue | Length | What you hear | Licence of the file |
|------|-----|--------|---------------|---------------------|
| `engine-start.*.mp3` | Chapter 1, the car forms on the helipad | 3.7 s | A starter cranks, a Lexus LFA V10 catches with a blip, revs hard once and settles into a burbling idle | **CC BY-SA 3.0** (adapted from the LFA recording) |
| `pull-away.*.mp3` | Chapter 2, the car first moves | 3.7 s | A Lamborghini Gallardo V10 launches off the line, screams through first, upshifts and pulls away | **CC BY-SA 3.0** (adapted from the Gallardo recording) |
| `split.*.mp3` | Chapter 3, the exploded view | 2.8 s | A metal sweep, fast interlocking clicks, servos whirring and gears ratcheting, then a rising whoosh into a heavy double-clunk lock (an original layered design, not taken from any film or game) | Contains **CC BY 3.0** material (the servos) |

The `*` is the first 8 hex characters of the file's SHA-256, so a changed sound never comes back stale from a cache. The current names are in `src/components/home/heroSoundFiles.ts`.

**Credit line** (it covers the CC BY-SA and CC BY requirements wherever the site credits third-party media):

> Engine sounds: "Lexus LFA revving 1LR-GUE (2009)" by Altair78 and "Lamborghini Gallardo LP570-4 Superleggera" by Edvvc, Wikimedia Commons, CC BY-SA 3.0, edited. Servo sounds: "Large Servo Motor" and "Small Servo Motor" by Smoothie, SoundBible, CC BY 3.0, edited. Other effects from Mixkit (Mixkit Sound Effects Free License).

`engine-start.*.mp3` and `pull-away.*.mp3` are adaptations, so they are themselves licensed under CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). This applies to the audio files only, not to the website.

## Sources

### Engine start (`engine-start.*.mp3`)

1. **"Car ignition"** (Mixkit #1535)
   - Source: https://mixkit.co/free-sound-effects/car/ (file: https://assets.mixkit.co/active_storage/sfx/1535/1535.wav). Author: Mixkit.
   - Licence: Mixkit Sound Effects Free License, https://mixkit.co/license/#sfxFree. It allows commercial use without attribution. It forbids redistributing the item on its own as stock.
   - Edits: kept only the starter cranking (0.12–0.96 s, before the original car catches). Sped up and raised in pitch by 6%, high-passed at 80 Hz, +2 dB at 1.3 kHz.
2. **"Lexus LFA revving 1LR-GUE (2009).ogg"**: an LFA revving at an auto show
   - Source: https://commons.wikimedia.org/wiki/File:Lexus_LFA_revving_1LR-GUE_(2009).ogg. Author: Altair78 (own work).
   - Licence: dual-licensed GFDL and CC BY-SA (all versions); used here under CC BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/.
   - Edits:
     - Cut 0.46–2.46 s (a short blip, then a hard rev) and 3.50–4.62 s (idle), joined to the crank and to each other with 50 ms and 220 ms crossfades.
     - EQ: high-pass at 38 Hz, −3 dB at 110 Hz, +2 dB at 2.6 kHz, −2 dB at 5.2 kHz.
     - Low-pass at 9.5 kHz, because the original recording clips on its revs.

### Pull-away (`pull-away.*.mp3`)

3. **"Lamborghini Gallardo LP570-4 Superleggera.ogg"**: pulling away from the start of the Goodwood Festival of Speed hillclimb, 3 July 2010
   - Source: https://commons.wikimedia.org/wiki/File:Lamborghini_Gallardo_LP570-4_Superleggera.ogg. Author: Edvvc (own work).
   - Licence: CC BY-SA 3.0, https://creativecommons.org/licenses/by-sa/3.0/ (also offered under GFDL).
   - Edits: cut 0.82–4.45 s. EQ: high-pass at 38 Hz, −3 dB at 110 Hz, +2 dB at 2.6 kHz. A gentle compressor (2.2:1) evens out the swell as the car nears the microphone.

### Exploded view (`split.*.mp3`)

An original layered design: 11 separate effects cut, re-timed, re-pitched, panned and placed so the parts click apart, motor out and lock together at 1.62 s.

4. **Mixkit** effects, all under the Mixkit Sound Effects Free License (https://mixkit.co/license/#sfxFree), author Mixkit. Each file is at `https://assets.mixkit.co/active_storage/sfx/<id>/<id>.wav`:
   - #2639 "Quick metal transition sweep"
   - #1132 "Sci fi robot metal click" (sped up 20%)
   - #2856 "Gear lock sound"
   - #3152 "Shuffling gear mech item"
   - #2530 "Futuristic robotic mechanism" (2.0–2.6 s, sped up 25%)
   - #1492 "Cinematic whoosh fast transition"
   - #2757 "Metal tank gear shift" (slowed 15% for weight, high-passed at 45 Hz)
   - #2609 "Whoosh resonating metallic hit"
   - #2858 "Gear metallic lock sound" (slowed 20%)
5. **"Large Servo Motor"** (SoundBible #1440) and **"Small Servo Motor"** (SoundBible #1425)
   - Sources: https://soundbible.com/1440-Large-Servo-Motor.html and https://soundbible.com/1425-Small-Servo-Motor-.html. Author: Smoothie.
   - Licence: CC BY 3.0, https://creativecommons.org/licenses/by/3.0/.
   - Edits: the large servo is sped up 12% and high-passed at 220 Hz; the small servo is slowed 8% and high-passed at 300 Hz. Both are layered under the clicks.

### Mastering (all three)

- The whole sound is high-passed at 28 Hz, then loudness-normalised (ITU-R BS.1770) to −20 LUFS (engine start), −19 LUFS (pull-away) and −21 LUFS (split).
- A look-ahead limiter holds sample peaks under −5 dBFS, so each MP3's true peak stays under −4 dBTP.
- Each file gets a 6 ms fade-in and a 0.55–0.7 s fade-out, and is encoded to MP3 at 160 kb/s, 48 kHz stereo, with no metadata.

## Rebuilding

```bash
node tools/build-hero-sounds.mjs <source-folder> [--review <folder>]
```

The source folder must hold the downloads at:

- `mixkit/<id>.wav`, from the Mixkit URLs above;
- `commons/<File_name>.ogg`, the original file from each Commons page;
- `soundbible/<id>.wav`, from `https://soundbible.com/grab.php?id=<id>&type=wav`.

The raw recordings are not committed. The script writes the files here, removes older versions and regenerates `heroSoundFiles.ts`. `--review` also writes each main sound and its alternative under plain names, for listening.

**Alternatives** built by the same script (not on the site):

- `pull-away-alt` is "Lamborghini Aventador LP700-4 (2011).ogg" by Edvvc, a V12 on the Goodwood hillclimb, 3 July 2011. Source: https://commons.wikimedia.org/wiki/File:Lamborghini_Aventador_LP700-4_(2011).ogg. Licence: CC BY-SA 3.0. Edits: cut 1.55–5.10 s, same EQ and compressor.
- `engine-start-alt` uses the same two sources, with two hard revs.
- `split-alt` uses Mixkit effects only (#3117 "Mechanical technology movements", #2850 "Robotic metallic lock process", #3180 "Machine activation short", plus #1132, #1492, #2757, #2609 and #2858), so it needs no credit.

## Sources checked and not used

- **Freesound, Pixabay and Zapsplat** could not be reached from the build environment because of bot protection. **BBC Sound Effects** is non-commercial only.
- **Archive.org "~ Lamborghini Huracan" and "~ Audi R 8 V 8 2012"** (2015) are anonymous collections of clips of many different 2013–2015 supercars, marked "Public Domain Mark". There is no recordist or provenance, so they were rejected.
- **Archive.org "Red Library", "GOLD TAPE", "SSE Library" and "Designer's Choice"** are re-uploads of commercial libraries marked CC0 by third parties. The provenance is unclear, so they were rejected.
- **Wikimedia Commons "… - engine and exhaust sound (YouTube …)"** files are CC BY 3.0 audio tracks of YouTube videos. Many come from aggregator channels that may not own the footage, so they were not used.
- **SoundBible's Ferrari, race car and burnout clips** are "Personal Use Only", so they were excluded.
- **Considered but not needed:**
  - "2008 BMW M3 E92 S65 V8 Exhaust Sound Recordings" by Nate Lee (archive.org, CC BY 4.0; idle only, no revs);
  - "Ferrari 458 Italia.ogg" by Edvvc (Commons, CC BY-SA 3.0);
  - the Daniel Simion recordings on SoundBible (CC BY 3.0).
