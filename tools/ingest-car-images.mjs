// Import AI car images (or photos) into the site.
//
//   node tools/ingest-car-images.mjs <folder> [--status ai-illustrative|ai-verified|photo] [--dry-run]
//
// The folder holds files named {slug}_{view}.{jpg|jpeg|png|webp}, e.g. ferrari-296-gts_hero.jpg
// (brief: docs/brief/car-image-brief.md). Views: hero, side, interior, rear, wheel.
// For each car the tool writes public/cars/{slug}/{view}.webp (max 2400 px wide) plus card.webp
// (a 4:3 crop of the hero), then regenerates src/content/car-media.ts from everything in
// public/cars/. Re-running is safe: new files replace old ones, other cars are kept.
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const src = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry-run");
const statusArg = args[args.indexOf("--status") + 1];
const STATUS = args.includes("--status") ? statusArg : "ai-illustrative";
if (!src || !existsSync(src) || !statSync(src).isDirectory()) {
  console.error("Usage: node tools/ingest-car-images.mjs <folder> [--status ai-illustrative|ai-verified|photo] [--dry-run]");
  process.exit(1);
}
if (!["ai-illustrative", "ai-verified", "photo"].includes(STATUS)) throw new Error(`Unknown status ${STATUS}`);

// Car slugs and names straight from the data module (no TS import needed).
const carsTs = readFileSync(join(ROOT, "src/content/cars.ts"), "utf8");
const cars = [...carsTs.matchAll(/slug: "([a-z0-9-]+)", brand: "[^"]+", model: "[^"]+", modelSlug: "[^"]+", name: "([^"]+)"/g)].map((m) => ({ slug: m[1], name: m[2] }));
const carBySlug = new Map(cars.map((c) => [c.slug, c]));

const VIEWS = {
  hero: { aspect: 16 / 9, label: "front three-quarter view" },
  side: { aspect: 16 / 9, label: "side view" },
  interior: { aspect: 3 / 2, label: "interior" },
  rear: { aspect: 16 / 9, label: "rear three-quarter view" },
  wheel: { aspect: 3 / 2, label: "wheel and brake detail" },
};
const ALIASES = { front: "hero", hero34f: "hero", profile: "side", cockpit: "interior", "int-cockpit": "interior", rear34: "rear", "det-wheel": "wheel" };
const MAX_W = 2400;

const problems = [];
const done = [];
for (const file of readdirSync(src).sort()) {
  const ext = extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
  const stem = basename(file, extname(file)).toLowerCase().replace(/\s+/g, "-");
  const cut = stem.lastIndexOf("_");
  if (cut < 0) { problems.push(`${file}: name must be {slug}_{view}`); continue; }
  const slug = stem.slice(0, cut);
  let view = stem.slice(cut + 1);
  view = ALIASES[view] ?? view;
  if (!carBySlug.has(slug)) { problems.push(`${file}: unknown car "${slug}"`); continue; }
  if (!VIEWS[view]) { problems.push(`${file}: unknown view "${view}" (use ${Object.keys(VIEWS).join(", ")})`); continue; }

  const input = sharp(join(src, file)).rotate();
  const meta = await input.metadata();
  const ratio = meta.width / meta.height;
  const notes = [];
  if (meta.width < 2400) notes.push(`only ${meta.width}px wide`);
  if (Math.abs(ratio - VIEWS[view].aspect) / VIEWS[view].aspect > 0.06) notes.push(`aspect ${ratio.toFixed(2)} (expected ${VIEWS[view].aspect.toFixed(2)})`);

  const outDir = join(ROOT, "public/cars", slug);
  if (!dry) {
    mkdirSync(outDir, { recursive: true });
    await input.clone().resize({ width: Math.min(MAX_W, meta.width), withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(outDir, `${view}.webp`));
    if (view === "hero") {
      // Card: 4:3 crop of the hero, full height, centred on the car.
      const h = meta.height, w = Math.min(meta.width, Math.round(h * (4 / 3)));
      const left = Math.max(0, Math.round((meta.width - w) / 2));
      await sharp(join(src, file)).rotate().extract({ left, top: 0, width: w, height: h }).resize({ width: Math.min(1200, w) }).webp({ quality: 80 }).toFile(join(outDir, "card.webp"));
    }
  }
  done.push(`${slug}/${view}${notes.length ? `  (check: ${notes.join(", ")})` : ""}`);
}

// Regenerate car-media.ts from whatever is in public/cars/.
const pub = join(ROOT, "public/cars");
const entries = [];
for (const car of cars) {
  const dir = join(pub, car.slug);
  if (!existsSync(dir)) continue;
  const has = (v) => existsSync(join(dir, `${v}.webp`));
  const path = (v) => `/cars/${car.slug}/${v}.webp`;
  const m = { status: STATUS };
  if (has("hero")) m.hero = path("hero");
  if (has("side")) m.side = path("side");
  if (has("card")) m.card = path("card");
  if (has("interior")) m.cockpit = path("interior");
  const gallery = ["hero", "side", "rear", "interior", "wheel"].filter(has).map((v) => ({ src: path(v), alt: `${car.name}, ${VIEWS[v].label}` }));
  if (gallery.length) m.gallery = gallery;
  entries.push(`  ${JSON.stringify(car.slug)}: ${JSON.stringify(m)},`);
}
const mediaTs = readFileSync(join(ROOT, "src/content/car-media.ts"), "utf8").replace(
  /export const carMedia: Record<string, CarMedia \| undefined> = \{[\s\S]*?\n?\};/,
  `export const carMedia: Record<string, CarMedia | undefined> = {${entries.length ? `\n${entries.join("\n")}\n` : ""}};`,
);
if (!dry) writeFileSync(join(ROOT, "src/content/car-media.ts"), mediaTs);

console.log(`${dry ? "[dry run] " : ""}Imported ${done.length} image(s):`);
done.forEach((d) => console.log(`  ${d}`));
if (problems.length) {
  console.log(`Skipped ${problems.length}:`);
  problems.forEach((p) => console.log(`  ${p}`));
}
const missing = cars.filter((c) => !existsSync(join(pub, c.slug, "hero.webp"))).map((c) => c.slug);
console.log(missing.length ? `Cars still without a hero image: ${missing.join(", ")}` : "Every car has a hero image.");
