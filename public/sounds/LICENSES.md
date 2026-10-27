# Homepage sounds: sources and licences

The three scroll sounds on the homepage are **synthesized for LuxuryRentals.ae**. No recordings, samples, loops or other third-party audio are used anywhere in them. So no third-party licence, attribution or usage restriction applies, and the files can be used commercially without conditions.

| File | Cue | Length | What you hear |
|------|-----|--------|---------------|
| `engine-start.*.mp3` | Chapter 1, the car forms on the helipad | 3.3 s | Starter motor cranking, the V12 catching with a flare to about 3,150 rpm, overrun crackle, then a short idle burble that fades out |
| `pull-away.*.mp3` | Chapter 2, the car first moves | 3.5 s | A throttle blip with overrun crackle, then the pull-away in first gear to about 7,400 rpm, one upshift with an ignition-cut pop, and a fade into the tunnel |
| `split.*.mp3` | Chapter 3, the exploded view | 2.3 s | A rising whoosh, an unlocking thump, a cascade of metal latch clicks, two servos spinning up, an air release and two lock clicks |

The `*` is the first 8 hex characters of the file's SHA-256, so a changed sound never comes back stale from a cache. The current names are listed in `src/components/home/heroSoundFiles.ts`.

## How they are made

`node tools/render-hero-sounds.mjs` renders all three deterministically (fixed random seeds), writes the files here, removes older versions and regenerates `heroSoundFiles.ts`. It needs ffmpeg with libmp3lame. `--layers` prints the loudness of each layer, and `--out <folder>` also saves 24-bit WAV masters.

- **Engine.** A model of a Lamborghini V12, not oscillators:
  - Twelve cylinders fire 60° of crank apart in the 1-7-4-10-2-8-6-12-3-9-5-11 order, so the two banks alternate.
  - Each firing is an exhaust blowdown pulse. The pulses vary slightly from cylinder to cylinder and from cycle to cycle.
  - The pulses pass through each bank's header and mid-pipe (damped waveguides), the muffler and a tailpipe filter that opens with load.
  - On top of that are intake howl, valvetrain ticking and a starter motor (rotation, pinion mesh, commutator whine and brush grind, loaded by each compression).
  - The rpm and throttle curves are drawn by hand.
- **Split.** Band-pass noise sweeps, a pitched low thump, modal "metal bar" clicks, harmonic servo whine with gear-mesh sidebands and tooth ticks, and high-passed air noise.
- **Space.** An 8-line feedback delay network reverb per scene: open air for the helipad, early reflections and a longer tail for the tunnel, a short dry room for the studio.
- **Mastering and encoding.**
  - Rendered at 48 kHz, then loudness-normalised (ITU-R BS.1770) to −20 LUFS (engine start), −19 LUFS (pull-away) and −21 LUFS (split).
  - A 3 ms look-ahead limiter holds peaks under −4 dBFS, and each file gets a 4 ms fade-in and a fade-out at the end.
  - Encoded to MP3 (160 kb/s, 48 kHz stereo, no metadata), which every current browser decodes, including Safari.

## Sources considered and not used

- **Freesound and Pixabay** (CC0 and the Pixabay Content License) could not be reached from the build environment because of bot protection. They were not used.
- **Mixkit** (Mixkit Sound Effects Free License): the car category has ordinary car starts and drive-bys but no V12 or supercar recordings. Not used.
- **OpenGameArt** (CC0): generic game engine loops. Not used.

To replace a sound with a licensed recording (for example the client's own Revuelto), put the new file here with a content-hashed name, update `heroSoundFiles.ts`, and record its source URL, licence and processing in this file.
