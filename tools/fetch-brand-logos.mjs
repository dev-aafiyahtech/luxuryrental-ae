// Regenerate the car-maker marks from Simple Icons (pinned version): an SVG sprite in public/marques/
// and the metadata module src/content/brand-logos.ts.
//
//   node tools/fetch-brand-logos.mjs              fetch from the jsDelivr CDN
//   node tools/fetch-brand-logos.mjs --from <dir> read <id>.svg files from a local folder instead
//   node tools/fetch-brand-logos.mjs --dry-run    print the result, write nothing
//
// Simple Icons ships every mark as one path in a 24 x 24 box. For each brand the tool rewrites the
// path with coordinates rounded to PRECISION decimals (visually lossless at 64 px and above; rounding
// is done on absolute positions, so long relative paths don't drift), measures the rounded path's
// real bounding box (plain Node, no dependencies) and uses it as the symbol's viewBox, so wide
// wordmarks and tall crests both start from a tight frame.
//
// Output:
// - public/marques/brand-logos.<sha8>.svg: one <symbol id="<slug>"> per brand, paths without a fill so
//   `currentColor` inherits through <use>. Content-hashed, so it can be cached for good; older
//   versions are deleted.
// - src/content/brand-logos.ts: spriteUrl plus per-brand id, title, viewBox, scale and aspect.
//
// SCALE below is the optical size, tuned by eye: the share of the line height the mark fills, so a
// wordmark and a crest look the same size at one CSS height. Change it here, not in the generated
// file, then re-run.
//
// Licence: the Simple Icons SVG data is CC0 1.0. The marks themselves are trademarks of their
// owners; the site shows them as monochrome labels beside the cars (see src/content/brands.ts).
import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "16.36.0";
const CDN = `https://cdn.jsdelivr.net/npm/simple-icons@${VERSION}/icons`;
const PRECISION = 2;

/** Site brand slug -> Simple Icons id and optical scale (0-1 of the line height). */
const BRANDS = {
  lamborghini: { id: "lamborghini", scale: 0.96 },
  ferrari: { id: "ferrari", scale: 1 },
  "rolls-royce": { id: "rollsroyce", scale: 0.86 },
  bugatti: { id: "bugatti", scale: 0.68 },
  mclaren: { id: "mclaren", scale: 0.35 },
  bentley: { id: "bentley", scale: 0.58 },
  "aston-martin": { id: "astonmartin", scale: 0.47 },
  maserati: { id: "maserati", scale: 1 },
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_TS = join(ROOT, "src/content/brand-logos.ts");
const OUT_DIR = join(ROOT, "public/marques");
const SPRITE = /^brand-logos\.[0-9a-f]{8}\.svg$/;
const args = process.argv.slice(2);
const from = args.includes("--from") ? args[args.indexOf("--from") + 1] : undefined;
const dry = args.includes("--dry-run");
const precision = args.includes("--precision") ? Number(args[args.indexOf("--precision") + 1]) : PRECISION;

async function load(id) {
  if (from) return readFileSync(join(from, `${id}.svg`), "utf8");
  const res = await fetch(`${CDN}/${id}.svg`);
  if (!res.ok) throw new Error(`${CDN}/${id}.svg: HTTP ${res.status}`);
  return res.text();
}

function parseIcon(id, svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  const title = svg.match(/<title>([^<]+)<\/title>/)?.[1];
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  if (viewBox !== "0 0 24 24" || !title || paths.length !== 1) {
    throw new Error(`${id}: expected one path in a 0 0 24 24 viewBox with a <title> (got viewBox ${viewBox}, ${paths.length} paths)`);
  }
  return { title: decode(title), d: paths[0] };
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// ---------------------------------------------------------------------------------------------
// Path data: parse to absolute segments, measure, and write back compactly.

/** Parse path data into absolute segments: { c: "M"|"L"|"H"|"V"|"C"|"S"|"Q"|"T"|"A"|"Z", a: number[] }. */
function parsePath(d) {
  let i = 0;
  const sep = () => { while (i < d.length && /[\s,]/.test(d[i])) i++; };
  const num = () => {
    sep();
    const m = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(d.slice(i));
    if (!m) throw new Error(`Bad number at ${i}: ${d.slice(i, i + 12)}`);
    i += m[0].length;
    return Number(m[0]);
  };
  // Arc flags are single characters and may be written without separators ("a1 1 0 011 1").
  const flag = () => { sep(); const c = d[i++]; if (c !== "0" && c !== "1") throw new Error(`Bad arc flag at ${i - 1}`); return c === "1" ? 1 : 0; };

  const segs = [];
  let x = 0, y = 0, sx = 0, sy = 0, cmd = "";
  while (true) {
    sep();
    if (i >= d.length) break;
    if (/[a-zA-Z]/.test(d[i])) cmd = d[i++];
    else if (!cmd) throw new Error("Path must start with a command, and a new one must follow Z");
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    const pt = () => [ox + num(), oy + num()];
    switch (C) {
      case "M": [x, y] = pt(); sx = x; sy = y; segs.push({ c: "M", a: [x, y] }); cmd = rel ? "l" : "L"; break;
      case "L": [x, y] = pt(); segs.push({ c: "L", a: [x, y] }); break;
      case "H": x = ox + num(); segs.push({ c: "H", a: [x] }); break;
      case "V": y = oy + num(); segs.push({ c: "V", a: [y] }); break;
      case "C": { const p1 = pt(), p2 = pt(); [x, y] = pt(); segs.push({ c: "C", a: [...p1, ...p2, x, y] }); break; }
      case "S": { const p2 = pt(); [x, y] = pt(); segs.push({ c: "S", a: [...p2, x, y] }); break; }
      case "Q": { const p1 = pt(); [x, y] = pt(); segs.push({ c: "Q", a: [...p1, x, y] }); break; }
      case "T": [x, y] = pt(); segs.push({ c: "T", a: [x, y] }); break;
      case "A": { const r = [num(), num(), num(), flag(), flag()]; [x, y] = pt(); segs.push({ c: "A", a: [...r, x, y] }); break; }
      case "Z": x = sx; y = sy; segs.push({ c: "Z", a: [] }); cmd = ""; break;
      default: throw new Error(`Unsupported path command ${cmd}`);
    }
  }
  return segs;
}

/** Bounding box of absolute segments: every segment sampled finely, rounded outwards. */
function bbox(segs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (px, py) => { minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); };
  const N = 200;
  const cubic = (x0, y0, x1, y1, x2, y2, x3, y3) => {
    for (let k = 1; k <= N; k++) {
      const t = k / N, u = 1 - t;
      add(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
    }
  };
  const quad = (x0, y0, x1, y1, x2, y2) => {
    for (let k = 1; k <= N; k++) {
      const t = k / N, u = 1 - t;
      add(u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2);
    }
  };
  // SVG spec F.6.5: endpoint to centre parameterisation, then sample the sweep.
  const arc = (x1, y1, rx, ry, deg, large, sweep, x2, y2) => {
    if (x1 === x2 && y1 === y2) return; // the spec omits an arc whose ends coincide
    if (!rx || !ry) return add(x2, y2);
    const phi = (deg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = cos * dx + sin * dy, yp = -sin * dx + cos * dy;
    rx = Math.abs(rx); ry = Math.abs(ry);
    const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const num2 = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
    const den = rx * rx * yp * yp + ry * ry * xp * xp;
    const coef = (large !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, num2 / den));
    const cxp = (coef * rx * yp) / ry, cyp = (-coef * ry * xp) / rx;
    const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const ux = (xp - cxp) / rx, uy = (yp - cyp) / ry, vx = (-xp - cxp) / rx, vy = (-yp - cyp) / ry;
    const t1 = ang(1, 0, ux, uy);
    let dt = ang(ux, uy, vx, vy);
    if (!sweep && dt > 0) dt -= 2 * Math.PI;
    if (sweep && dt < 0) dt += 2 * Math.PI;
    for (let k = 1; k <= N; k++) {
      const t = t1 + (dt * k) / N;
      add(cx + rx * cos * Math.cos(t) - ry * sin * Math.sin(t), cy + rx * sin * Math.cos(t) + ry * cos * Math.sin(t));
    }
  };

  let x = 0, y = 0, sx = 0, sy = 0, px = 0, py = 0, prev = "";
  for (const { c, a } of segs) {
    switch (c) {
      case "M": [x, y] = a; sx = x; sy = y; add(x, y); break;
      case "L": [x, y] = a; add(x, y); break;
      case "H": [x] = a; add(x, y); break;
      case "V": [y] = a; add(x, y); break;
      case "C": cubic(x, y, ...a); [, , px, py, x, y] = a; break;
      case "S": { const r = prev === "C" || prev === "S"; cubic(x, y, r ? 2 * x - px : x, r ? 2 * y - py : y, ...a); [px, py, x, y] = a; break; }
      case "Q": quad(x, y, ...a); [px, py, x, y] = a; break;
      case "T": { const r = prev === "Q" || prev === "T"; const c1x = r ? 2 * x - px : x, c1y = r ? 2 * y - py : y; quad(x, y, c1x, c1y, ...a); px = c1x; py = c1y; [x, y] = a; break; }
      case "A": arc(x, y, ...a); [, , , , , x, y] = a; break;
      case "Z": x = sx; y = sy; break;
    }
    prev = c;
  }
  const lo = (v) => Math.floor(v * 1000) / 1000, hi = (v) => Math.ceil(v * 1000) / 1000;
  const x0 = lo(minX), y0 = lo(minY);
  return [x0, y0, +(hi(maxX) - x0).toFixed(3), +(hi(maxY) - y0).toFixed(3)];
}

/**
 * Write absolute segments back as relative path data with `p` decimals. Positions are rounded on
 * an integer grid first and every relative step is taken between rounded positions, so the error
 * never exceeds half a step anywhere along the path. Numbers are packed the way SVGO does it.
 */
function writePath(segs, p) {
  const k = 10 ** p;
  const q = (v) => Math.round(v * k);
  const fmt = (n) => {
    if (n === 0) return "0";
    const s = (Math.abs(n) / k).toFixed(p).replace(/\.?0+$/, "").replace(/^0\./, ".");
    return n < 0 ? `-${s}` : s;
  };
  let out = "", last = "", lastNum = "";
  const cmd = (c, always = false) => { if (always || c !== last) { out += c; last = c; lastNum = ""; } };
  const put = (s) => {
    const glue = lastNum && !s.startsWith("-") && !(s.startsWith(".") && lastNum.includes("."));
    out += (glue ? " " : "") + s;
    lastNum = s;
  };
  let X = 0, Y = 0, SX = 0, SY = 0;
  const rel = (pts) => { for (let i = 0; i < pts.length; i += 2) { put(fmt(q(pts[i]) - X)); put(fmt(q(pts[i + 1]) - Y)); } };
  for (const { c, a } of segs) {
    switch (c) {
      case "M": cmd("m", true); rel(a); [X, Y] = [q(a[0]), q(a[1])]; [SX, SY] = [X, Y]; break;
      case "L": case "C": case "S": case "Q": case "T":
        cmd(c.toLowerCase()); rel(a); [X, Y] = [q(a.at(-2)), q(a.at(-1))]; break;
      case "H": cmd("h"); put(fmt(q(a[0]) - X)); X = q(a[0]); break;
      case "V": cmd("v"); put(fmt(q(a[0]) - Y)); Y = q(a[0]); break;
      case "A": {
        cmd("a");
        const [rx, ry, rot, large, sweep, ax, ay] = a;
        put(fmt(q(rx))); put(fmt(q(ry))); put(String(+rot.toFixed(p))); put(String(large)); put(String(sweep));
        put(fmt(q(ax) - X)); put(fmt(q(ay) - Y));
        [X, Y] = [q(ax), q(ay)];
        break;
      }
      case "Z": cmd("z", true); [X, Y] = [SX, SY]; break;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------

const entries = [];
for (const [slug, { id, scale }] of Object.entries(BRANDS)) {
  const { title, d: source } = parseIcon(id, await load(id));
  const d = writePath(parsePath(source), precision);
  const viewBox = bbox(parsePath(d));
  const frame = viewBox[3] / scale;
  const aspect = +(viewBox[2] / frame).toFixed(3);
  entries.push({ slug, id, title, viewBox, scale, aspect, d });
  console.log(`${slug.padEnd(13)} ${id.padEnd(12)} viewBox ${viewBox.join(" ").padEnd(26)} scale ${String(scale).padEnd(5)} aspect ${aspect.toFixed(3)}  path ${source.length} -> ${d.length} chars`);
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">
<!-- Car-maker marks for <BrandLogo>. GENERATED by tools/fetch-brand-logos.mjs from Simple Icons ${VERSION}
     (https://simpleicons.org, CC0 1.0); the marks themselves are trademarks of their owners. -->
${entries.map((e) => `<symbol id="${e.slug}" viewBox="${e.viewBox.join(" ")}" overflow="visible"><path d="${e.d}"/></symbol>`).join("\n")}
</svg>
`;
const hash = createHash("sha256").update(sprite).digest("hex").slice(0, 8);
const spriteFile = `brand-logos.${hash}.svg`;
const spriteUrl = `/marques/${spriteFile}`;

const ts = `// Car-maker marks, keyed by brand slug (src/content/brands.ts). GENERATED by
// tools/fetch-brand-logos.mjs from Simple Icons ${VERSION}: don't edit by hand. To change a mark's
// optical size, edit SCALE in the tool and re-run it.
//
// The paths live in a content-hashed sprite (spriteUrl), fetched once and cached, so pages carry
// only a <use> per mark. SVG data: Simple Icons (https://simpleicons.org), CC0 1.0. The marks
// themselves are trademarks of their owners. Show them only as monochrome labels beside the cars
// (currentColor, never the makers' colours) and never with "official", "authorised" or partner
// wording. Render with <BrandLogo slug="..." /> (src/components/car/BrandLogo.tsx).

/** The sprite holding one <symbol id="<slug>"> per brand. */
export const spriteUrl = ${JSON.stringify(spriteUrl)};

export interface BrandLogoData {
  /** Simple Icons id the path came from. */
  id: string;
  /** The mark's name, e.g. for a role="img" label. */
  title: string;
  /** The symbol's viewBox, the mark's tight bounding box: [minX, minY, width, height] in 24-unit space. */
  viewBox: readonly [number, number, number, number];
  /** Optical size: the share of the line height the mark fills (wordmarks less, crests more). */
  scale: number;
  /** Width / height of the drawn frame: an h-6 mark is 24 * aspect px wide. */
  aspect: number;
}

export const brandLogos = {
${entries.map((e) => `  ${JSON.stringify(e.slug)}: { id: ${JSON.stringify(e.id)}, title: ${JSON.stringify(e.title)}, viewBox: [${e.viewBox.join(", ")}], scale: ${e.scale}, aspect: ${e.aspect} },`).join("\n")}
} as const satisfies Record<string, BrandLogoData>;

export type BrandLogoSlug = keyof typeof brandLogos;

export const hasBrandLogo = (slug: string): slug is BrandLogoSlug => Object.hasOwn(brandLogos, slug);

/**
 * The frame a mark is drawn in: its tight box, padded top and bottom so that at any CSS height the
 * mark fills \`scale\` of it, centred. The viewBox starts at 0 0 because <use> places the symbol
 * there; the symbol's own viewBox then fits and centres the mark. \`aspect\` is width / height.
 */
export function brandLogoFrame(slug: string): { viewBox: string; aspect: number } | undefined {
  if (!hasBrandLogo(slug)) return undefined;
  const { viewBox: [, , w, h], scale, aspect } = brandLogos[slug];
  return { viewBox: \`0 0 \${w} \${Math.round((h / scale) * 1000) / 1000}\`, aspect };
}
`;

console.log(`sprite ${spriteUrl}: ${Buffer.byteLength(sprite)} bytes`);
if (dry) {
  console.log(sprite.slice(0, 600));
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const f of readdirSync(OUT_DIR)) if (SPRITE.test(f) && f !== spriteFile) rmSync(join(OUT_DIR, f));
  writeFileSync(join(OUT_DIR, spriteFile), sprite);
  writeFileSync(OUT_TS, ts);
  console.log(`Wrote ${join(OUT_DIR, spriteFile)} and ${OUT_TS}`);
}
