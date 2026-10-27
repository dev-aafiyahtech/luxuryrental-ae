// Build the homepage hero's three scroll sounds from recordings.
//
//   node tools/build-hero-sounds.mjs <source-folder> [--review <folder>]     (needs ffmpeg with libmp3lame)
//
// The source folder holds the downloads listed in SOURCES (origins and licences: public/sounds/LICENSES.md);
// the raw recordings are never committed. ffmpeg cuts, layers and equalises each sound, then masters it:
// loudness-normalised (ITU-R BS.1770) to its target, peaks held under −4 dBTP by a look-ahead limiter,
// short fades, MP3 160 kb/s 48 kHz. Writes public/sounds/{name}.{hash8}.mp3 (older versions removed) and
// regenerates src/components/home/heroSoundFiles.ts. --review also writes each main pick and its
// alternative to a folder under plain names, for listening.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const SRC = args[0] && !args[0].startsWith("--") ? resolve(args[0]) : null;
const REVIEW = args.includes("--review") ? resolve(args[args.indexOf("--review") + 1]) : null;
if (!SRC || !existsSync(SRC)) {
  console.error("Usage: node tools/build-hero-sounds.mjs <source-folder> [--review <folder>]");
  process.exit(1);
}

/** Downloads, by the path they are expected at inside the source folder. */
const SOURCES = {
  crank: "mixkit/1535.wav", // Mixkit "Car ignition"
  lfa: "commons/Lexus_LFA_revving_1LR-GUE_(2009).ogg", // Lexus LFA V10 revving, Altair78
  gallardo: "commons/Lamborghini_Gallardo_LP570-4_Superleggera.ogg", // Gallardo V10 launch, Edvvc
  aventador: "commons/Lamborghini_Aventador_LP700-4_(2011).ogg", // Aventador V12 fly-by, Edvvc
  sweep: "mixkit/2639.wav", // Mixkit "Quick metal transition sweep"
  clicks: "mixkit/1132.wav", // Mixkit "Sci fi robot metal click"
  locks: "mixkit/2856.wav", // Mixkit "Gear lock sound"
  lockTap: "mixkit/2858.wav", // Mixkit "Gear metallic lock sound"
  shuffle: "mixkit/3152.wav", // Mixkit "Shuffling gear mech item"
  mechanism: "mixkit/2530.wav", // Mixkit "Futuristic robotic mechanism"
  rise: "mixkit/1492.wav", // Mixkit "Cinematic whoosh fast transition"
  clunk: "mixkit/2757.wav", // Mixkit "Metal tank gear shift"
  hit: "mixkit/2609.wav", // Mixkit "Whoosh resonating metallic hit"
  tech: "mixkit/3117.wav", // Mixkit "Mechanical technology movements"
  lockRun: "mixkit/2850.wav", // Mixkit "Robotic metallic lock process"
  activation: "mixkit/3180.wav", // Mixkit "Machine activation short"
  servoBig: "soundbible/1440.wav", // SoundBible "Large Servo Motor", Smoothie
  servoSmall: "soundbible/1425.wav", // SoundBible "Small Servo Motor", Smoothie
};

// ---------- filter-graph helpers ----------

/**
 * One layer: a cut of an input, optionally sped up or slowed (pitch moves with it), filtered,
 * panned (−1 left … 1 right), set in level and placed at a time in the sound.
 */
function layer(input, label, { from, to, rate = 1, gain = 0, at = 0, pan = 0, chain = [] }) {
  const f = [`[${input}:a]atrim=start=${from}:end=${to}`, "asetpts=PTS-STARTPTS", "aresample=48000", "aformat=sample_fmts=fltp:channel_layouts=stereo"];
  if (rate !== 1) f.push(`asetrate=${Math.round(48000 * rate)}`, "aresample=48000");
  f.push(...chain);
  if (pan) f.push(`pan=stereo|c0=${Math.min(1, 1 - pan).toFixed(3)}*c0|c1=${Math.min(1, 1 + pan).toFixed(3)}*c1`);
  f.push(`volume=${gain}dB`);
  if (at > 0) f.push(`adelay=delays=${Math.round(at * 1000)}:all=1`);
  return `${f.join(",")}[${label}]`;
}

/** Layers mixed at their own levels (no automatic normalisation). */
function mix(layers, inputs) {
  const parts = layers.map(([key, opts], i) => {
    inputs.push(key);
    return layer(inputs.length - 1, `l${i}`, opts);
  });
  return `${parts.join(";")};${layers.map((_, i) => `[l${i}]`).join("")}amix=inputs=${layers.length}:duration=longest:normalize=0`;
}

/** Segments joined end to end with crossfades of the given lengths. */
function chainCuts(cuts, inputs) {
  const parts = cuts.map(([key, opts], i) => {
    inputs.push(key);
    return layer(inputs.length - 1, `c${i}`, opts);
  });
  let prev = "c0";
  cuts.slice(1).forEach(([, opts], i) => {
    const next = `x${i}`;
    parts.push(`[${prev}][c${i + 1}]acrossfade=d=${opts.xfade ?? 0.05}:c1=tri:c2=tri[${next}]`);
    prev = next;
  });
  return { graph: parts.join(";"), last: prev };
}

// Engine EQ: a tighter low end (less boom on small speakers) and a little more exhaust rasp.
const ENGINE_EQ = ["highpass=f=38:poles=2", "equalizer=f=110:t=q:w=1.1:g=-3", "equalizer=f=2600:t=q:w=1.3:g=2"];

// ---------- the sounds ----------

const RECIPES = [
  {
    key: "start",
    file: "engine-start",
    target: -20,
    fadeOut: 0.55,
    describe: "Starter cranks, the V10 catches with a blip, one hard rev to the top, then settles into a burbling idle.",
    build(inputs) {
      // Starter: Mixkit's crank, a touch faster and higher so it reads as a high-compression engine.
      // Then the Lexus LFA: the catch is its first short blip (0.55 s), the hard rev at 1.30 s, and
      // its idle after the revs (from 3.55 s) to settle on. The LFA was recorded hot and clips on the
      // revs, so its very top is rolled off where the clipping crunch lives.
      const lfaEq = [...ENGINE_EQ, "lowpass=f=9500:poles=2", "equalizer=f=5200:t=q:w=1:g=-2"];
      const { graph, last } = chainCuts(
        [
          ["crank", { from: 0.12, to: 0.96, rate: 1.06, gain: 11, chain: ["highpass=f=80:poles=2", "equalizer=f=1300:t=q:w=1:g=2"] }],
          ["lfa", { from: 0.46, to: 2.46, gain: 0, chain: lfaEq, xfade: 0.05 }],
          ["lfa", { from: 3.5, to: 4.62, gain: 0, chain: lfaEq, xfade: 0.22 }],
        ],
        inputs,
      );
      return `${graph};[${last}]anull`;
    },
  },
  {
    key: "start",
    alt: true,
    file: "engine-start",
    target: -20,
    fadeOut: 0.6,
    describe: "Alternative: the same crank and V10, with two hard revs (no settling blip) before the idle.",
    build(inputs) {
      const lfaEq = [...ENGINE_EQ, "lowpass=f=9500:poles=2", "equalizer=f=5200:t=q:w=1:g=-2"];
      const { graph, last } = chainCuts(
        [
          ["crank", { from: 0.12, to: 0.96, rate: 1.06, gain: 11, chain: ["highpass=f=80:poles=2", "equalizer=f=1300:t=q:w=1:g=2"] }],
          ["lfa", { from: 1.24, to: 3.52, gain: 0, chain: lfaEq, xfade: 0.06 }],
          ["lfa", { from: 3.52, to: 4.35, gain: 0, chain: lfaEq, xfade: 0.02 }],
        ],
        inputs,
      );
      return `${graph};[${last}]anull`;
    },
  },
  {
    key: "pullAway",
    file: "pull-away",
    target: -19,
    fadeOut: 0.7,
    compress: true,
    describe: "A Lamborghini Gallardo V10 launches hard off the line, screams through first, snaps an upshift and pulls away.",
    build(inputs) {
      inputs.push("gallardo");
      return layer(0, "a", { from: 0.82, to: 4.45, chain: ENGINE_EQ }).replace(/\[a\]$/, "");
    },
  },
  {
    key: "pullAway",
    alt: true,
    file: "pull-away",
    target: -19,
    fadeOut: 0.7,
    compress: true,
    describe: "Alternative: a Lamborghini Aventador V12 accelerating past close by, with the Doppler drop as it goes.",
    build(inputs) {
      inputs.push("aventador");
      return layer(0, "a", { from: 1.55, to: 5.1, chain: ENGINE_EQ }).replace(/\[a\]$/, "");
    },
  },
  {
    key: "split",
    file: "split",
    target: -21,
    fadeOut: 0.6,
    length: 2.8,
    describe: "A metal sweep and a run of fast interlocking clicks, servos whirring and gears ratcheting, then a rising whoosh into one heavy double-clunk lock.",
    build(inputs) {
      // An original layered design (no franchise audio): every layer is a separate stock effect,
      // re-timed, re-pitched and placed so the parts click apart, motor out and lock at 1.62 s.
      return mix(
        [
          ["sweep", { from: 0.25, to: 1.45, gain: -9, chain: ["highpass=f=180"] }],
          ["clicks", { from: 0.08, to: 1.12, rate: 1.2, gain: 1, at: 0.2, pan: -0.25 }],
          ["locks", { from: 0, to: 0.62, gain: -2, at: 0.38, pan: 0.35 }],
          ["servoBig", { from: 0, to: 1.3, rate: 1.12, gain: -9, at: 0.5, chain: ["highpass=f=220"] }],
          ["shuffle", { from: 0.05, to: 0.55, gain: -8, at: 0.58, pan: -0.3 }],
          ["mechanism", { from: 2.0, to: 2.6, rate: 1.25, gain: -10, at: 0.95, pan: 0.3 }],
          ["servoSmall", { from: 0, to: 0.73, rate: 0.92, gain: -14, at: 0.95, pan: -0.4, chain: ["highpass=f=300"] }],
          ["rise", { from: 0, to: 1.2, gain: -9, at: 0.55 }],
          ["clunk", { from: 0, to: 1.2, rate: 0.85, gain: 3, at: 1.5, chain: ["highpass=f=45:poles=2"] }],
          ["hit", { from: 0, to: 2.0, gain: -4, at: 1.37 }],
          ["lockTap", { from: 0, to: 0.4, rate: 0.8, gain: -2, at: 1.56 }],
        ],
        inputs,
      );
    },
  },
  {
    key: "split",
    alt: true,
    file: "split",
    target: -21,
    fadeOut: 0.6,
    length: 2.8,
    describe: "Alternative: denser and more electronic: a mechanical burst, a robotic lock sequence over a motor hum, then the same heavy lock.",
    build(inputs) {
      return mix(
        [
          ["tech", { from: 0.05, to: 0.9, gain: -4, at: 0.1 }],
          ["lockRun", { from: 0.08, to: 0.9, rate: 1.1, gain: -4, at: 0.42, pan: 0.3 }],
          ["clicks", { from: 0.4, to: 1.12, rate: 1.3, gain: -5, at: 0.62, pan: -0.3 }],
          ["activation", { from: 0.1, to: 1.3, rate: 1.25, gain: -12, at: 0.35, chain: ["highpass=f=150"] }],
          ["rise", { from: 0, to: 1.2, gain: -9, at: 0.55 }],
          ["clunk", { from: 0, to: 1.2, rate: 0.85, gain: -1, at: 1.5, chain: ["highpass=f=45:poles=2"] }],
          ["hit", { from: 0, to: 2.0, gain: -6, at: 1.37 }],
          ["lockTap", { from: 0, to: 0.4, rate: 0.8, gain: -4, at: 1.56 }],
        ],
        inputs,
      );
    },
  },
];

// ---------- mastering ----------

const ff = (a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a], { stdio: ["ignore", "ignore", "inherit"] });

/** Integrated loudness (LUFS) and true peak (dBTP). */
function measure(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-filter_complex", "ebur128=peak=true", "-f", "null", "-"], { encoding: "utf8" });
  const s = r.stderr.slice(r.stderr.lastIndexOf("Summary:"));
  return { I: parseFloat(/I:\s+(-?[\d.]+) LUFS/.exec(s)[1]), TP: parseFloat(/Peak:\s+(-?[\d.]+) dBFS/.exec(s)[1]) };
}

const dur = (file) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }));

function master(recipe, work) {
  const inputs = [];
  const graph = recipe.build(inputs);
  const pre = join(work, `${recipe.file}${recipe.alt ? "-alt" : ""}-pre.wav`);
  const cap = recipe.length ? `,atrim=end=${recipe.length}` : "";
  ff([...inputs.flatMap((k) => ["-i", join(SRC, SOURCES[k])]), "-filter_complex", `${graph}${cap}[out]`, "-map", "[out]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_f32le", pre]);
  const length = dur(pre);
  // Subsonics off; a gentle compressor evens out a recording that swells from far to near; the
  // limiter holds the sample peaks under −5 dBFS so the MP3's true peak stays under −4 dBTP.
  const chain = (gain) =>
    [
      "highpass=f=28:poles=2",
      `volume=${gain.toFixed(2)}dB`,
      recipe.compress && "acompressor=threshold=0.12:ratio=2.2:attack=15:release=220:knee=4",
      "alimiter=limit=0.56:attack=3:release=60:level=false:latency=true",
      "afade=t=in:d=0.006",
      `afade=t=out:st=${(length - recipe.fadeOut).toFixed(3)}:d=${recipe.fadeOut}`,
    ]
      .filter(Boolean)
      .join(",");
  let gain = recipe.target - measure(pre).I;
  const out = join(work, `${recipe.file}${recipe.alt ? "-alt" : ""}.wav`);
  for (let pass = 0; pass < 3; pass++) {
    ff(["-i", pre, "-af", chain(gain), "-c:a", "pcm_s24le", out]);
    const m = measure(out);
    if (Math.abs(m.I - recipe.target) < 0.25) break;
    gain += recipe.target - m.I;
  }
  const mp3 = out.replace(/\.wav$/, ".mp3");
  ff(["-i", out, "-c:a", "libmp3lame", "-b:a", "160k", "-ar", "48000", "-map_metadata", "-1", "-id3v2_version", "0", "-write_id3v1", "0", mp3]);
  return { mp3, wav: out, ...measure(mp3), length: dur(mp3) };
}

// ---------- output ----------

const missing = Object.values(SOURCES).filter((p) => !existsSync(join(SRC, p)));
if (missing.length) {
  console.error(`Missing in ${SRC}:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
const work = mkdtempSync(join(tmpdir(), "hero-sounds-"));
const pub = join(ROOT, "public/sounds");
mkdirSync(pub, { recursive: true });
if (REVIEW) mkdirSync(REVIEW, { recursive: true });
const manifest = {};
for (const recipe of RECIPES) {
  const r = master(recipe, work);
  const bytes = readFileSync(r.mp3);
  const name = `${recipe.file}${recipe.alt ? "-alt" : ""}`;
  console.log(`${name}: ${r.length.toFixed(2)} s, ${(bytes.length / 1024).toFixed(1)} KB, ${r.I.toFixed(1)} LUFS, true peak ${r.TP.toFixed(1)} dBTP. ${recipe.describe}`);
  if (REVIEW) copyFileSync(r.mp3, join(REVIEW, `${name}.mp3`));
  if (recipe.alt) continue;
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  for (const f of readdirSync(pub)) if (f.startsWith(`${recipe.file}.`) && f.endsWith(".mp3")) rmSync(join(pub, f));
  writeFileSync(join(pub, `${recipe.file}.${hash}.mp3`), bytes);
  manifest[recipe.key] = `/sounds/${recipe.file}.${hash}.mp3`;
}
rmSync(work, { recursive: true, force: true });

writeFileSync(
  join(ROOT, "src/components/home/heroSoundFiles.ts"),
  `// Generated by tools/build-hero-sounds.mjs; do not edit. Sources and licences: public/sounds/LICENSES.md.
export const heroSoundFiles = {
  start: "${manifest.start}",
  pullAway: "${manifest.pullAway}",
  split: "${manifest.split}",
} as const;
`,
);
