// Regenerate src/content/brand-logos.ts from Simple Icons (pinned version).
//
//   node tools/fetch-brand-logos.mjs              fetch from the jsDelivr CDN
//   node tools/fetch-brand-logos.mjs --from <dir> read <id>.svg files from a local folder instead
//   node tools/fetch-brand-logos.mjs --dry-run    print the result, don't write the file
//
// Simple Icons ships every mark as one path in a 24 x 24 box. For each brand the tool keeps
// the path as it is, measures the path's real bounding box (plain Node, no dependencies) and
// writes it as the viewBox, so wide wordmarks and tall crests both start from a tight frame.
// SCALE below is the optical size, tuned by eye: the share of the line height the mark fills,
// so a wordmark and a crest look the same size at one CSS height. Change it here, not in the
// generated file, then re-run.
//
// Licence: the Simple Icons SVG data is CC0 1.0. The marks themselves are trademarks of their
// owners; the site shows them as monochrome labels beside the cars (see src/content/brands.ts).
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VERSION = "16.36.0";
const CDN = `https://cdn.jsdelivr.net/npm/simple-icons@${VERSION}/icons`;

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
const OUT = join(ROOT, "src/content/brand-logos.ts");
const args = process.argv.slice(2);
const from = args.includes("--from") ? args[args.indexOf("--from") + 1] : undefined;
const dry = args.includes("--dry-run");

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
// Path bounding box: walk the path, sample every segment finely, keep min and max.

function bbox(d) {
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
  const flag = () => { sep(); const c = d[i++]; if (c !== "0" && c !== "1") throw new Error(`Bad arc flag at ${i - 1}`); return c === "1"; };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (x, y) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); };
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

  let x = 0, y = 0, sx = 0, sy = 0, cmd = "", px = 0, py = 0, prev = "";
  while (true) {
    sep();
    if (i >= d.length) break;
    if (/[a-zA-Z]/.test(d[i])) cmd = d[i++];
    else if (!cmd) throw new Error(`Path must start with a command`);
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (C) {
      case "M": x = ox + num(); y = oy + num(); sx = x; sy = y; add(x, y); cmd = rel ? "l" : "L"; break;
      case "L": x = ox + num(); y = oy + num(); add(x, y); break;
      case "H": x = ox + num(); add(x, y); break;
      case "V": y = oy + num(); add(x, y); break;
      case "C": { const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num(); cubic(x, y, x1, y1, x2, y2, x3, y3); px = x2; py = y2; x = x3; y = y3; break; }
      case "S": { const r = /[CS]/.test(prev); const x1 = r ? 2 * x - px : x, y1 = r ? 2 * y - py : y; const x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num(); cubic(x, y, x1, y1, x2, y2, x3, y3); px = x2; py = y2; x = x3; y = y3; break; }
      case "Q": { const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(); quad(x, y, x1, y1, x2, y2); px = x1; py = y1; x = x2; y = y2; break; }
      case "T": { const r = /[QT]/.test(prev); const x1 = r ? 2 * x - px : x, y1 = r ? 2 * y - py : y; const x2 = ox + num(), y2 = oy + num(); quad(x, y, x1, y1, x2, y2); px = x1; py = y1; x = x2; y = y2; break; }
      case "A": { const rx = num(), ry = num(), rot = num(), large = flag(), sweep = flag(); const x2 = ox + num(), y2 = oy + num(); arc(x, y, rx, ry, rot, large, sweep, x2, y2); x = x2; y = y2; break; }
      case "Z": x = sx; y = sy; break;
      default: throw new Error(`Unsupported path command ${cmd}`);
    }
    prev = C;
    // Any command but Z repeats while numbers follow; after Z a new command letter must come.
    if (C === "Z") cmd = "";
  }
  // Round outwards so antialiased edges are never clipped.
  const lo = (v) => Math.floor(v * 1000) / 1000, hi = (v) => Math.ceil(v * 1000) / 1000;
  const x0 = lo(minX), y0 = lo(minY);
  return [x0, y0, +(hi(maxX) - x0).toFixed(3), +(hi(maxY) - y0).toFixed(3)];
}

// ---------------------------------------------------------------------------------------------

const entries = [];
for (const [slug, { id, scale }] of Object.entries(BRANDS)) {
  const { title, d } = parseIcon(id, await load(id));
  const viewBox = bbox(d);
  entries.push({ slug, id, title, viewBox, scale, d });
  console.log(`${slug.padEnd(13)} ${id.padEnd(12)} viewBox ${viewBox.join(" ").padEnd(26)} aspect ${(viewBox[2] / viewBox[3]).toFixed(2).padStart(5)}  scale ${scale}`);
}

const body = `// Car-maker marks, keyed by brand slug (src/content/brands.ts). GENERATED by
// tools/fetch-brand-logos.mjs from Simple Icons ${VERSION}: don't edit by hand. To change a mark's
// optical size, edit SCALE in the tool and re-run it.
//
// SVG data: Simple Icons (https://simpleicons.org), CC0 1.0. The marks themselves are trademarks
// of their owners. Show them only as monochrome labels beside the cars (currentColor, never the
// makers' colours) and never with "official", "authorised" or partner wording.
// Render with <BrandLogo slug="..." /> (src/components/car/BrandLogo.tsx).

export interface BrandLogoData {
  /** Simple Icons id the path came from. */
  id: string;
  /** The mark's name, e.g. for a role="img" label. */
  title: string;
  /** Tight bounding box of the path: [minX, minY, width, height] in the source's 24-unit space. */
  viewBox: readonly [number, number, number, number];
  /** Optical size: the share of the line height the mark fills (wordmarks less, crests more). */
  scale: number;
  /** SVG path data. */
  path: string;
}

export const brandLogos = {
${entries.map((e) => `  ${JSON.stringify(e.slug)}: {
    id: ${JSON.stringify(e.id)},
    title: ${JSON.stringify(e.title)},
    viewBox: [${e.viewBox.join(", ")}],
    scale: ${e.scale},
    path: ${JSON.stringify(e.d)},
  },`).join("\n")}
} as const satisfies Record<string, BrandLogoData>;

export type BrandLogoSlug = keyof typeof brandLogos;

export const hasBrandLogo = (slug: string): slug is BrandLogoSlug => Object.hasOwn(brandLogos, slug);

/**
 * The frame a mark is drawn in: its tight box, padded top and bottom so that at any CSS height
 * the mark fills \`scale\` of it, centred. \`aspect\` is width / height of that frame, handy for
 * reserving space (an h-6 logo is 24 * aspect px wide).
 */
export function brandLogoFrame(slug: string): { viewBox: string; aspect: number } | undefined {
  if (!hasBrandLogo(slug)) return undefined;
  const { viewBox: [x, y, w, h], scale } = brandLogos[slug];
  const frame = h / scale;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return { viewBox: [x, round(y - (frame - h) / 2), w, round(frame)].join(" "), aspect: round(w / frame) };
}
`;

if (dry) console.log(body.slice(0, 1500));
else {
  writeFileSync(OUT, body);
  console.log(`Wrote ${OUT}`);
}
