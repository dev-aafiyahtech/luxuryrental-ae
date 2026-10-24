// Import AI car images (or photos) into the site.
//
//   node tools/ingest-car-images.mjs <folder> [--status ai-illustrative|ai-verified|photo] [--dry-run]
//
// The folder holds files named {slug}_{view}.{jpg|jpeg|png|webp}, e.g. ferrari-296-gts_hero.jpg
// (brief: docs/brief/car-image-brief.md). Views: hero, side, interior, rear, wheel.
// For each car the tool writes public/cars/{slug}/{view}.{hash}.webp (max 2000 px wide) plus a card
// (the content hash in the name means a replaced image never comes back stale from a cache)
// (a 4:3 crop of the hero), then regenerates src/content/car-media.ts from everything in
// public/cars/. Re-running is safe: new files replace old ones, other cars are kept.
import { readdirSync, readFileSync, mkdirSync, writeFileSync, existsSync, statSync, rmSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
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
const MAX_W = 2000; // the AI masters are upscaled from ~1672 px, so wider adds weight, not detail

// Card: 4:3 without cutting the car. The whole 16:9 hero sits in the middle; the extra height
// above and below continues the hero's own wall and floor (mirrored edge rows, so the seam is continuous).
async function makeCard(file, out, W = 1200) {
  const H = Math.round(W * 0.75), fh = Math.round(W * 9 / 16), top = Math.round((H - fh) / 2);
  const src = await sharp(file).rotate().resize(W, fh).toBuffer();
  // Only the outer 3% of rows (pure wall or floor, even for tall SUVs), mirrored and stretched.
  const edge = Math.round(fh * 0.03);
  const band = (y) => sharp(src).extract({ left: 0, top: y, width: W, height: edge }).flip().resize(W, top, { fit: "fill" }).blur(4).toBuffer();
  const [upper, lower] = await Promise.all([band(0), band(fh - edge)]);
  const mask = Buffer.from(`<svg width="${W}" height="${fh}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".05" stop-color="#fff"/><stop offset=".95" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const fg = await sharp(src).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const bg = await sharp({ create: { width: W, height: H, channels: 3, background: "#1d3c3c" } })
    .composite([{ input: upper, top: 0, left: 0 }, { input: lower, top: H - top, left: 0 }, { input: src, top, left: 0 }]).png().toBuffer();
  await sharp(bg).composite([{ input: fg, top, left: 0 }]).webp({ quality: 80 }).toFile(out);
}

// Writes one view as {view}.{hash8}.webp and removes that view's older files.
async function save(dir, view, write) {
  const tmp = join(dir, `.${view}.tmp.webp`);
  await write(tmp);
  const hash = createHash("sha256").update(readFileSync(tmp)).digest("hex").slice(0, 8);
  for (const n of readdirSync(dir)) if (n.startsWith(`${view}.`) && n.endsWith(".webp")) rmSync(join(dir, n));
  renameSync(tmp, join(dir, `${view}.${hash}.webp`));
}

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
    await save(outDir, view, (tmp) => input.clone().resize({ width: Math.min(MAX_W, meta.width), withoutEnlargement: true }).webp({ quality: 82 }).toFile(tmp));
    if (view === "hero") await save(outDir, "card", (tmp) => makeCard(join(src, file), tmp));
  }
  done.push(`${slug}/${view}${notes.length ? `  (check: ${notes.join(", ")})` : ""}`);
}

// Regenerate car-media.ts from whatever is in public/cars/.
const pub = join(ROOT, "public/cars");
const entries = [];
for (const car of cars) {
  const dir = join(pub, car.slug);
  if (!existsSync(dir)) continue;
  const names = readdirSync(dir);
  const found = (v) => names.find((n) => n.startsWith(`${v}.`) && n.endsWith(".webp"));
  const has = (v) => !!found(v);
  const path = (v) => `/cars/${car.slug}/${found(v)}`;
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
const missing = cars.filter((c) => !existsSync(join(pub, c.slug)) || !readdirSync(join(pub, c.slug)).some((n) => n.startsWith("hero."))).map((c) => c.slug);
console.log(missing.length ? `Cars still without a hero image: ${missing.join(", ")}` : "Every car has a hero image.");
