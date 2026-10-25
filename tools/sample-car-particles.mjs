// Sample each car's gold-dust particle sculpture from its own side image (plan 03 §3.1, D-13).
//
//   node tools/sample-car-particles.mjs [slug ...] [--src <folder>] [--count 10000] [--debug <dir>]
//
// With no slugs it does every car that has a side image in src/content/car-media.ts. The source
// is the published side view (public/cars/{slug}/side.<hash>.webp); --src <folder> reads the
// originals instead ({slug}_side.jpg|png|webp, nose pointing right, studio cove background).
// For each car it writes public/cars/{slug}/particles.<hash>.bin (old ones are removed) and then
// regenerates src/scene/car/particleSets.ts from every particle file in public/cars/.
// --debug <dir> also writes PNGs of the mask, wheels, parts and the sampled points.
//
// Pipeline: fit the studio background (a smooth membrane through the teal cells, refitted with
// the car masked out) → score each pixel by chroma and luminance difference (darkness counts
// only where the pixel doesn't still read as teal, so black paint and tyres are car but contact
// shadows aren't) → threshold, small closing (grilles open to the backdrop), largest component,
// holes filled → find the floor line (the tyres are the car's lowest rows) and the two wheels
// (circles standing on it: dark tyre band, textured rim, brighter floor outside) → drop the
// floor reflection below the tyre line and the contact shadow under the sills (cut at a sill
// line found where lit floor shows under the car) → label parts (wheels, cabin above the belt
// line, head and tail lamps, body) → sample points weighted to edges, the outline and
// highlights, with the image colour, and give them depth from a car-like cross-section (rounded
// plan view, tumblehome above the belt, rounded roof and nose edges, wheels inset). The far
// side reuses the near side's outline (the sculpture is symmetric; no image is shown mirrored).
//
// File format (little-endian): "LRPS" | u32 version | u32 count | u32 metaBytes | meta JSON
// (space-padded to 4 bytes) | i16 position[count*3] in millimetres (x tail→nose, y up from the
// floor, z towards the camera, origin at the car's centre on the floor) | u8 colour[count*3]
// (sRGB from the image) | u8 part[count] (0 body, 1 cabin, 2 wheels, 4 head lamp, 5 tail lamp)
// | u8 brightness[count]. Points are shuffled, so any prefix is an even subsample (phones read
// fewer). The powertrain schematic is not in the file: the stage draws it from the car's data.
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const SRC = opt("--src");
const DEBUG = opt("--debug");
const COUNT = Number(opt("--count") ?? 10000);
const flagValues = new Set([SRC, DEBUG, opt("--count")].filter(Boolean));
const only = args.filter((a) => !a.startsWith("--") && !flagValues.has(a));
const VERSION = 1;

// ---------------------------------------------------------------------------------------------
// Car data (read from the data modules as text, so no TypeScript import is needed)

const carsTs = readFileSync(join(ROOT, "src/content/cars.ts"), "utf8");
const bodyBySlug = new Map([...carsTs.matchAll(/slug: "([a-z0-9-]+)",[^]*?body: "([a-z]+)", paint/g)].map((m) => [m[1], m[2]]));
const mediaTs = readFileSync(join(ROOT, "src/content/car-media.ts"), "utf8");
const sideBySlug = new Map([...mediaTs.matchAll(/"([a-z0-9-]+)": \{[^\n]*?"side":"([^"]+)"/g)].map((m) => [m[1], m[2]]));

// Approximate published length and width in metres. Used only to scale the sculpture (the
// height comes from the image); never shown. Unknown cars fall back to their body style.
const DIMS = {
  "lamborghini-revuelto": [4.95, 2.03],
  "rolls-royce-cullinan": [5.36, 2.0],
  "bugatti-chiron-super-sport": [4.79, 2.04],
  "ferrari-296-gts": [4.57, 1.96],
  "mclaren-750s-spider": [4.57, 1.93],
  "ferrari-purosangue": [4.97, 2.03],
  "lamborghini-urus-se": [5.12, 2.02],
  "mclaren-artura": [4.54, 1.98],
  "aston-martin-dbx707": [5.04, 2.0],
  "aston-martin-db12-volante": [4.73, 1.98],
  "bentley-bentayga-ewb": [5.32, 2.0],
  "bentley-continental-gtc-speed": [4.9, 1.97],
  "rolls-royce-phantom": [5.98, 2.02],
  "maserati-mcpura-cielo": [4.67, 1.97],
  "maserati-granturismo-trofeo": [4.97, 1.96],
  "bugatti-chiron-sport": [4.54, 2.04],
};
const BODY_DEFAULTS = {
  supercar: { dims: [4.7, 2.0], belt: 0.68 },
  hypercar: { dims: [4.7, 2.04], belt: 0.7 },
  spider: { dims: [4.6, 1.95], belt: 0.7 },
  gt: { dims: [4.8, 1.97], belt: 0.72 },
  cabriolet: { dims: [4.8, 1.97], belt: 0.74 },
  suv: { dims: [5.1, 2.0], belt: 0.66 },
  limousine: { dims: [5.6, 2.0], belt: 0.68 },
};

// ---------------------------------------------------------------------------------------------
// Small helpers

function mulberry(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
function percentile(values, p) {
  const s = Float32Array.from(values).sort();
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0;
}

// ---------------------------------------------------------------------------------------------
// Image analysis. Everything works on a W×H RGB buffer (image rows top → bottom).

const WK = 1600; // working width: the AI masters are ~1670 px natively

/** Smooth studio background: medians of teal-looking cells, holes filled by a membrane. */
function fitBackground(rgb, W, H, exclude) {
  const GX = 64, GY = 36, cw = W / GX, ch = H / GY;
  const grid = new Float32Array(GX * GY * 3), known = new Uint8Array(GX * GY);
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      const vals = [[], [], []];
      let tot = 0;
      for (let y = Math.floor(gy * ch); y < Math.floor((gy + 1) * ch); y++) {
        for (let x = Math.floor(gx * cw); x < Math.floor((gx + 1) * cw); x++) {
          tot++;
          const p = y * W + x;
          if (exclude && exclude[p]) continue;
          const r = rgb[p * 3], g = rgb[p * 3 + 1], b = rgb[p * 3 + 2];
          // The cove is sea-moss teal: red well below green and blue, green ≈ blue.
          if (g - r > 14 && b - r > 14 && Math.abs(g - b) < 0.22 * (g + b) * 0.5 + 5) {
            vals[0].push(r);
            vals[1].push(g);
            vals[2].push(b);
          }
        }
      }
      if (vals[0].length > tot * 0.6) {
        known[gy * GX + gx] = 1;
        for (let c = 0; c < 3; c++) grid[(gy * GX + gx) * 3 + c] = percentile(vals[c], 0.5);
      }
    }
  }
  let n = 0;
  const mean = [0, 0, 0];
  for (let k = 0; k < GX * GY; k++) if (known[k]) { n++; for (let c = 0; c < 3; c++) mean[c] += grid[k * 3 + c]; }
  if (n < GX * 4) throw new Error("background: too few studio cells (is this a side view on the studio cove?)");
  for (let k = 0; k < GX * GY; k++) if (!known[k]) for (let c = 0; c < 3; c++) grid[k * 3 + c] = mean[c] / n;
  // Membrane (Laplace) fill of the unknown cells from their neighbours
  for (let it = 0; it < 2500; it++) {
    for (let gy = 0; gy < GY; gy++) {
      for (let gx = 0; gx < GX; gx++) {
        const k = gy * GX + gx;
        if (known[k]) continue;
        for (let c = 0; c < 3; c++) {
          let s = 0, m = 0;
          if (gx > 0) { s += grid[(k - 1) * 3 + c]; m++; }
          if (gx < GX - 1) { s += grid[(k + 1) * 3 + c]; m++; }
          if (gy > 0) { s += grid[(k - GX) * 3 + c]; m++; }
          if (gy < GY - 1) { s += grid[(k + GX) * 3 + c]; m++; }
          grid[k * 3 + c] = s / m;
        }
      }
    }
  }
  const bg = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    const fy = clamp(y / ch - 0.5, 0, GY - 1.001), y0 = Math.floor(fy), ty = fy - y0;
    for (let x = 0; x < W; x++) {
      const fx = clamp(x / cw - 0.5, 0, GX - 1.001), x0 = Math.floor(fx), tx = fx - x0;
      for (let c = 0; c < 3; c++) {
        const a = grid[(y0 * GX + x0) * 3 + c], b = grid[(y0 * GX + x0 + 1) * 3 + c];
        const d = grid[((y0 + 1) * GX + x0) * 3 + c], e = grid[((y0 + 1) * GX + x0 + 1) * 3 + c];
        bg[(y * W + x) * 3 + c] = (a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + e * tx) * ty;
      }
    }
  }
  return bg;
}

/**
 * How unlike the studio each pixel is (≈0 background, >0.5 car). Chroma difference counts
 * where there is enough light to trust it; darkness counts unless the pixel still reads as
 * teal (a shadow on the cove), so black paint and tyres score high but contact shadows don't.
 */
function carScore(rgb, bg, W, H) {
  const score = new Float32Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const r = rgb[p * 3], g = rgb[p * 3 + 1], b = rgb[p * 3 + 2];
    const R = bg[p * 3], G = bg[p * 3 + 1], B = bg[p * 3 + 2];
    const sp = r + g + b + 1, sb = R + G + B + 1;
    const conf = clamp((sp - 12) / 50, 0, 1);
    const cd = Math.hypot(r / sp - R / sb, g / sp - G / sb, b / sp - B / sb);
    const teal = conf * Math.max(0, 1 - cd / 0.12);
    const rho = sp / sb;
    score[p] = Math.max(cd * conf * 4, Math.max(0, 1 - rho) * (1 - teal), Math.max(0, rho - 1) * 0.8);
  }
  return score;
}

function largestComponent(mask, W, H) {
  const lab = new Int32Array(W * H).fill(-1);
  const stack = new Int32Array(W * H);
  let best = -1, bestN = 0, id = 0;
  for (let p0 = 0; p0 < W * H; p0++) {
    if (!mask[p0] || lab[p0] >= 0) continue;
    let sp = 0, n = 0;
    stack[sp++] = p0;
    lab[p0] = id;
    while (sp) {
      const q = stack[--sp];
      n++;
      const x = q % W, y = (q / W) | 0;
      if (x > 0 && mask[q - 1] && lab[q - 1] < 0) { lab[q - 1] = id; stack[sp++] = q - 1; }
      if (x < W - 1 && mask[q + 1] && lab[q + 1] < 0) { lab[q + 1] = id; stack[sp++] = q + 1; }
      if (y > 0 && mask[q - W] && lab[q - W] < 0) { lab[q - W] = id; stack[sp++] = q - W; }
      if (y < H - 1 && mask[q + W] && lab[q + W] < 0) { lab[q + W] = id; stack[sp++] = q + W; }
    }
    if (n > bestN) { bestN = n; best = id; }
    id++;
  }
  const out = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) out[p] = lab[p] === best ? 1 : 0;
  return out;
}

/** Fill holes: everything not reachable from the border through background is car. */
function fillHoles(mask, W, H) {
  const outside = new Uint8Array(W * H);
  const stack = new Int32Array(W * H * 2);
  let sp = 0;
  for (let x = 0; x < W; x++) { stack[sp++] = x; stack[sp++] = (H - 1) * W + x; }
  for (let y = 0; y < H; y++) { stack[sp++] = y * W; stack[sp++] = y * W + W - 1; }
  while (sp) {
    const p = stack[--sp];
    if (outside[p] || mask[p]) continue;
    outside[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack[sp++] = p - 1;
    if (x < W - 1) stack[sp++] = p + 1;
    if (y > 0) stack[sp++] = p - W;
    if (y < H - 1) stack[sp++] = p + W;
  }
  const out = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) out[p] = outside[p] ? 0 : 1;
  return out;
}

/** Binary erosion / dilation with a square of radius r. */
function morph(mask, W, H, r, dilate) {
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = dilate ? 0 : 1;
      for (let d = -r; d <= r; d++) {
        const xx = x + d;
        const m = xx < 0 || xx >= W ? 0 : mask[y * W + xx];
        if (dilate ? m : !m) { v = dilate ? 1 : 0; break; }
      }
      tmp[y * W + x] = v;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let v = dilate ? 0 : 1;
      for (let d = -r; d <= r; d++) {
        const yy = y + d;
        const m = yy < 0 || yy >= H ? 0 : tmp[yy * W + x];
        if (dilate ? m : !m) { v = dilate ? 1 : 0; break; }
      }
      out[y * W + x] = v;
    }
  }
  return out;
}

/** Chamfer distance (px) from each car pixel to the nearest background pixel. */
function distanceInside(mask, W, H) {
  const INF = 1e9, d = new Float32Array(W * H);
  for (let p = 0; p < W * H; p++) d[p] = mask[p] ? INF : 0;
  const a = 1, b = Math.SQRT2;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (!d[p]) continue;
      let v = d[p];
      if (x > 0) v = Math.min(v, d[p - 1] + a);
      if (y > 0) {
        v = Math.min(v, d[p - W] + a);
        if (x > 0) v = Math.min(v, d[p - W - 1] + b);
        if (x < W - 1) v = Math.min(v, d[p - W + 1] + b);
      }
      if (x === 0 || y === 0 || x === W - 1) v = Math.min(v, 1);
      d[p] = v;
    }
  }
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const p = y * W + x;
      if (!d[p]) continue;
      let v = d[p];
      if (x < W - 1) v = Math.min(v, d[p + 1] + a);
      if (y < H - 1) {
        v = Math.min(v, d[p + W] + a);
        if (x < W - 1) v = Math.min(v, d[p + W + 1] + b);
        if (x > 0) v = Math.min(v, d[p + W - 1] + b);
      }
      d[p] = v;
    }
  }
  return d;
}

function boxBlur(src, W, H, r) {
  const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    let s = 0, n = 0;
    for (let x = -r; x < W + r; x++) {
      if (x + r < W && x + r >= 0) { s += src[y * W + x + r]; n++; }
      if (x - r - 1 >= 0 && x - r - 1 < W) { s -= src[y * W + x - r - 1]; n--; }
      if (x >= 0 && x < W) tmp[y * W + x] = s / n;
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0, n = 0;
    for (let y = -r; y < H + r; y++) {
      if (y + r < H && y + r >= 0) { s += tmp[(y + r) * W + x]; n++; }
      if (y - r - 1 >= 0 && y - r - 1 < H) { s -= tmp[(y - r - 1) * W + x]; n--; }
      if (y >= 0 && y < H) out[y * W + x] = s / n;
    }
  }
  return out;
}

function sobel(L, W, H) {
  const gx = new Float32Array(W * H), gy = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      gx[p] = (L[p - W + 1] + 2 * L[p + 1] + L[p + W + 1] - L[p - W - 1] - 2 * L[p - 1] - L[p + W - 1]) / 8;
      gy[p] = (L[p + W - 1] + 2 * L[p + W] + L[p + W + 1] - L[p - W - 1] - 2 * L[p - W] - L[p - W + 1]) / 8;
    }
  }
  return { gx, gy };
}

const bilinear = (A, W, H, x, y) => {
  const xi = clamp(Math.floor(x), 0, W - 2), yi = clamp(Math.floor(y), 0, H - 2);
  const tx = clamp(x - xi, 0, 1), ty = clamp(y - yi, 0, 1), p = yi * W + xi;
  return (A[p] * (1 - tx) + A[p + 1] * tx) * (1 - ty) + (A[p + W] * (1 - tx) + A[p + W + 1] * tx) * ty;
};

/**
 * A wheel: a dark tyre band around a textured rim (spokes, brakes), with the image getting
 * brighter going out across the tyre's lower flanks (the floor; the arch above is dark too).
 * The bottom of the circle must sit near the lowest rows of the car.
 */
function findWheel(img, cxRange, rRange, bottomRange) {
  const { gx, gy, lum, edgeSum, W, H, e97 } = img;
  const ang = (deg) => (deg * Math.PI) / 180;
  const flank = [];
  for (let d = 20; d <= 75; d += 5) flank.push(ang(d), ang(180 - d));
  const ring = [];
  for (let d = 0; d < 360; d += 10) ring.push(ang(d));
  const boxMean = (x0, y0, x1, y1) => {
    x0 = clamp(Math.round(x0), 0, W - 1); x1 = clamp(Math.round(x1), 0, W - 1);
    y0 = clamp(Math.round(y0), 0, H - 1); y1 = clamp(Math.round(y1), 0, H - 1);
    const A = (x, y) => edgeSum[y * (W + 1) + x];
    const n = Math.max(1, (x1 - x0) * (y1 - y0));
    return (A(x1, y1) - A(x0, y1) - A(x1, y0) + A(x0, y0)) / n;
  };
  const evalC = (cx, cy, r) => {
    let g = 0, out = 0;
    for (const t of flank) {
      const c = Math.cos(t), s = Math.sin(t), x = cx + r * c, y = cy + r * s;
      g += clamp((bilinear(gx, W, H, x, y) * c + bilinear(gy, W, H, x, y) * s) / e97, -1, 1);
      out += bilinear(lum, W, H, cx + 1.12 * r * c, cy + 1.12 * r * s);
    }
    g /= flank.length;
    out /= flank.length;
    let band = 0;
    for (const t of ring) band += bilinear(lum, W, H, cx + 0.9 * r * Math.cos(t), cy + 0.9 * r * Math.sin(t));
    band /= ring.length;
    const tex = boxMean(cx - 0.5 * r, cy - 0.5 * r, cx + 0.5 * r, cy + 0.5 * r) / e97;
    return g + 0.6 * Math.min(1, tex) + 1.2 * clamp(out - band, -0.3, 0.3) - 0.8 * band;
  };
  let best = { s: -Infinity, cx: 0, cy: 0, r: 0 };
  for (let r = rRange[0]; r <= rRange[1]; r += 2) {
    for (let cx = cxRange[0]; cx <= cxRange[1]; cx += 2) {
      for (let b = bottomRange[0]; b <= bottomRange[1]; b += 2) {
        const s = evalC(cx, b - r, r);
        if (s > best.s) best = { s, cx, cy: b - r, r };
      }
    }
  }
  const c = { ...best };
  for (let r = c.r - 2; r <= c.r + 2; r++) {
    for (let cx = c.cx - 2; cx <= c.cx + 2; cx++) {
      for (let cy = c.cy - 2; cy <= c.cy + 2; cy++) {
        const s = evalC(cx, cy, r);
        if (s > best.s) best = { s, cx, cy, r };
      }
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------
// One car

async function processCar(slug, file) {
  const body = bodyBySlug.get(slug) ?? "supercar";
  const defaults = BODY_DEFAULTS[body] ?? BODY_DEFAULTS.supercar;
  const [lengthM, widthM] = DIMS[slug] ?? defaults.dims;
  const meta0 = await sharp(file).metadata();
  const W = Math.min(WK, meta0.width ?? WK);
  const { data: rgb, info } = await sharp(file).resize(W).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const H = info.height;
  const N = W * H;

  // 1. Background and segmentation (fit, mask, refit without the car, mask again)
  let bg = fitBackground(rgb, W, H, null);
  let score = carScore(rgb, bg, W, H);
  let mask = new Uint8Array(N);
  for (let p = 0; p < N; p++) mask[p] = score[p] > 0.5 ? 1 : 0;
  mask = fillHoles(largestComponent(mask, W, H), W, H);
  bg = fitBackground(rgb, W, H, morph(mask, W, H, Math.round(W / 140), true));
  score = carScore(rgb, bg, W, H);
  mask = new Uint8Array(N);
  for (let p = 0; p < N; p++) mask[p] = score[p] > 0.5 ? 1 : 0;
  mask = morph(morph(mask, W, H, 1, false), W, H, 1, true); // drop specks
  const rc = Math.max(2, Math.round(W / 320));
  mask = morph(morph(mask, W, H, rc, true), W, H, rc, false); // seal grilles and vents open to the backdrop
  const open = largestComponent(mask, W, H); // before filling: the floor seen under the car is still open
  mask = fillHoles(open, W, H);

  let X0 = W, X1 = 0, Y0 = H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { if (x < X0) X0 = x; if (x > X1) X1 = x; if (y < Y0) Y0 = y; }
  const Lpx = X1 - X0;
  if (Lpx < W * 0.4) throw new Error(`segmentation failed (car only ${Lpx}px wide)`);

  // 2. Wheels and the floor line
  const lum = new Float32Array(N);
  for (let p = 0; p < N; p++) lum[p] = (0.2126 * rgb[p * 3] + 0.7152 * rgb[p * 3 + 1] + 0.0722 * rgb[p * 3 + 2]) / 255;
  const lumB = boxBlur(lum, W, H, 2);
  const { gx: gxs, gy: gys } = sobel(lumB, W, H);
  // Floor line: the tyres are the lowest part of the car (the soft shadow under the sills sits
  // above their contact line in a side view), so take the lowest rows the outline reaches over
  // a tyre's worth of columns.
  const bottoms = [];
  for (let x = Math.round(X0 + 0.1 * Lpx); x < X1 - 0.1 * Lpx; x++) {
    for (let y = H - 1; y >= 0; y--) if (mask[y * W + x]) { bottoms.push(y); break; }
  }
  const floorLine = Math.round(percentile(bottoms, 0.92));
  const rR = [Math.round(0.055 * Lpx), Math.round(0.1 * Lpx)];
  const mag = new Float32Array(N);
  for (let p = 0; p < N; p++) mag[p] = Math.hypot(gxs[p], gys[p]);
  const edgeSum = new Float64Array((W + 1) * (H + 1)); // summed-area table of gradient magnitude
  for (let y = 0; y < H; y++) {
    let row = 0;
    for (let x = 0; x < W; x++) {
      row += mag[y * W + x];
      edgeSum[(y + 1) * (W + 1) + x + 1] = edgeSum[y * (W + 1) + x + 1] + row;
    }
  }
  const wimg = { gx: gxs, gy: gys, lum: lumB, edgeSum, W, H, e97: percentile(mag.filter((v, p) => mask[p]), 0.97) || 0.05 };
  // Tyres stand on the floor line (a rim circle, a little smaller and centred the same, doesn't).
  const tol = Math.max(3, Math.round(0.012 * (floorLine - Y0)));
  const bRange = [floorLine - tol, floorLine + tol];
  const rearX = [X0 + 0.08 * Lpx, X0 + 0.34 * Lpx], frontX = [X1 - 0.34 * Lpx, X1 - 0.08 * Lpx];
  let rear = findWheel(wimg, rearX, rR, bRange);
  let front = findWheel(wimg, frontX, rR, bRange);
  // A miss is a rim (too small): search again near the bigger tyre's size (rears may be larger).
  if (front.r < rear.r * 0.9) front = findWheel(wimg, frontX, [Math.round(rear.r * 0.88), Math.round(rear.r * 1.04)], bRange);
  else if (rear.r < front.r * 0.96) rear = findWheel(wimg, rearX, [Math.round(front.r * 0.96), Math.round(front.r * 1.12)], bRange);
  const ground = Math.round((rear.cy + rear.r + front.cy + front.r) / 2);
  if (DEBUG) console.log(`  ${slug}: floor line ${floorLine}, rear ${JSON.stringify(rear)}, front ${JSON.stringify(front)}`);
  const inWheel = (x, y, k = 1) => Math.hypot(x - rear.cx, y - rear.cy) < rear.r * k || Math.hypot(x - front.cx, y - front.cy) < front.r * k;

  // 3. Clean the bottom: nothing below the tyre line (floor reflection); in a band above it,
  // keep only pixels hanging down continuously from the body (sills, splitters), so the soft
  // contact shadow on the floor under the car is not part of it. Tyres are always car.
  const band = Math.round(0.5 * (rear.r + front.r) * 0.5);
  mask = open;
  // Per column, where the run hanging down from the body ends (ground + 1 if it reaches the
  // floor); then a low percentile over a short window, so a mostly visible strip of lit floor
  // under the sill defines a clean sill line instead of a comb.
  const cut = new Int32Array(W).fill(ground + 1);
  for (let x = X0; x <= X1; x++) {
    if (!mask[(ground - band - 1) * W + x]) { cut[x] = ground - band; continue; }
    for (let y = ground - band; y <= ground; y++) if (!mask[y * W + x] && !inWheel(x, y)) { cut[x] = y; break; }
  }
  const win = Math.max(4, Math.round(0.03 * Lpx));
  const cutS = new Int32Array(W);
  for (let x = 0; x < W; x++) {
    const vals = [];
    for (let k = Math.max(X0, x - win); k <= Math.min(X1, x + win); k++) vals.push(cut[k]);
    cutS[x] = vals.length ? Math.round(percentile(vals, 0.3)) : ground + 1;
  }
  for (let x = 0; x < W; x++) {
    for (let y = ground - band; y < H; y++) {
      const p = y * W + x;
      if (inWheel(x, y)) mask[p] = y <= ground + 1 ? 1 : 0;
      else if (y > ground || y >= cutS[x]) mask[p] = 0;
    }
  }
  mask = fillHoles(largestComponent(mask, W, H), W, H);
  X0 = W; X1 = 0; Y0 = H;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { if (x < X0) X0 = x; if (x > X1) X1 = x; if (y < Y0) Y0 = y; }

  // Scale: px → metres from the car's length; model x from the bbox centre, y up from the floor.
  const s = lengthM / (X1 - X0);
  const xc = (X0 + X1) / 2;
  const mx = (px) => (px - xc) * s;
  const my = (py) => (ground - py) * s;
  const heightM = (ground - Y0) * s;

  // Silhouette contours
  const top = new Int32Array(W).fill(-1), bot = new Int32Array(W).fill(-1);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (mask[y * W + x]) { if (top[x] < 0) top[x] = y; bot[x] = y; }
  const rowF = new Int32Array(H).fill(-1), rowR = new Int32Array(H).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { if (rowR[y] < 0) rowR[y] = x; rowF[y] = x; }

  // 4. Parts
  // Belt line: the strongest horizontal edge across the roof span, near the body style's ratio.
  const roofY = Y0, roofSpan = [];
  for (let x = X0; x <= X1; x++) if (top[x] >= 0 && top[x] - roofY < 0.06 * (ground - roofY)) roofSpan.push(x);
  const rx0 = roofSpan[0] ?? X0 + 0.35 * Lpx, rx1 = roofSpan[roofSpan.length - 1] ?? X0 + 0.7 * Lpx;
  const Hc = ground - roofY;
  const beltGuess = ground - defaults.belt * Hc;
  let beltY = beltGuess, beltBest = -1;
  for (let y = Math.round(beltGuess - 0.12 * Hc); y <= Math.round(beltGuess + 0.12 * Hc); y++) {
    let e = 0;
    for (let x = Math.round(rx0); x <= rx1; x++) if (mask[y * W + x]) e += Math.abs(gys[y * W + x]);
    e *= 1 - 0.6 * Math.abs(y - beltGuess) / (0.12 * Hc); // prefer the expected height
    if (e > beltBest) { beltBest = e; beltY = y; }
  }
  // Glasshouse: the columns whose roofline stands well above the belt.
  const tall = (x) => top[x] >= 0 && beltY - top[x] > 0.3 * (beltY - roofY);
  let gx0 = Math.round((rx0 + rx1) / 2), gx1 = gx0;
  while (gx0 > X0 && tall(gx0 - 1)) gx0--;
  while (gx1 < X1 && tall(gx1 + 1)) gx1++;

  const PART = { body: 0, cabin: 1, wheels: 2, head: 4, tail: 5 };
  // Lamps: just under the bonnet / deck line at each end (where side views show them).
  const headZone = (x, y) => x > X1 - 0.08 * Lpx && x < X1 - 0.01 * Lpx && y > top[x] + 0.02 * Hc && y < top[x] + 0.1 * Hc;
  const tailZone = (x, y) => x < X0 + 0.05 * Lpx && x > X0 + 0.004 * Lpx && y > top[x] + 0.02 * Hc && y < top[x] + 0.11 * Hc;
  const partAt = (x, y) => {
    const xi = Math.round(x), yi = Math.round(y);
    if (inWheel(x, y)) return PART.wheels;
    if (xi > gx0 && xi < gx1 && y < beltY) return PART.cabin;
    if (headZone(xi, yi)) return PART.head;
    if (tailZone(xi, yi)) return PART.tail;
    return PART.body;
  };

  // 5. Features for sampling: edges (luminance and colour), highlights, the silhouette.
  const dist = distanceInside(mask, W, H);
  const { gx: cgx, gy: cgy } = sobel(boxBlur(lum, W, H, 1), W, H);
  const sat = new Float32Array(N);
  for (let p = 0; p < N; p++) {
    const r = rgb[p * 3], g = rgb[p * 3 + 1], b = rgb[p * 3 + 2];
    sat[p] = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
  }
  const { gx: sgx, gy: sgy } = sobel(boxBlur(sat, W, H, 1), W, H);
  const edge = new Float32Array(N);
  const carEdges = [], carLum = [];
  for (let p = 0; p < N; p++) {
    if (!mask[p]) continue;
    edge[p] = Math.hypot(cgx[p], cgy[p]) + 0.5 * Math.hypot(sgx[p], sgy[p]);
    carEdges.push(edge[p]);
    carLum.push(lum[p]);
  }
  const e97 = percentile(carEdges, 0.97) || 1;
  const lumSorted = Float32Array.from(carLum).sort();
  const lumRank = (v) => {
    let lo = 0, hi = lumSorted.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (lumSorted[m] < v) lo = m + 1; else hi = m; }
    return lo / lumSorted.length;
  };
  const edgeN = (p) => clamp(edge[p] / e97, 0, 1);

  // 6. Depth: a car-like cross-section around the image's outline.
  const hw0 = widthM / 2;
  const beltM = my(beltY);
  const rcF = 0.42 * hw0, rcR = 0.32 * hw0, rTop = 0.11, rBot = 0.07;
  const roundIn = (z, d, R) => (d >= R ? z : z - R + Math.sqrt(Math.max(0, R * R - (R - d) * (R - d))));
  const section = (yM) => {
    // Full width below the belt with a slight bulge; tumblehome above it.
    if (yM <= beltM) return hw0 * (0.94 + 0.06 * Math.sin(Math.PI * clamp(yM / Math.max(0.1, beltM), 0, 1)));
    return hw0 * (1 - 0.3 * Math.pow(clamp((yM - beltM) / Math.max(0.05, heightM - beltM), 0, 1), 1.15));
  };
  /** Half-width (z) of the car's side surface at image point (x, y). */
  const zSide = (x, y) => {
    const yi = clamp(Math.round(y), 0, H - 1), xi = clamp(Math.round(x), 0, W - 1);
    let z = section(my(y));
    if (rowF[yi] >= 0) {
      z = roundIn(z, (rowF[yi] - x) * s, rcF);
      z = roundIn(z, (x - rowR[yi]) * s, rcR);
    }
    if (top[xi] >= 0) {
      z = roundIn(z, (y - top[xi]) * s, rTop);
      z = roundIn(z, (bot[xi] - y) * s, rBot);
    }
    return Math.max(0.05, z);
  };
  const wheelZ = hw0 - 0.1;

  // 7. Sample
  const rnd = mulberry(0x5eed ^ slug.length * 7919);
  const pts = []; // [x, y, z, r, g, b, part, bright]
  const colourAt = (x, y) => {
    const p = clamp(Math.round(y), 0, H - 1) * W + clamp(Math.round(x), 0, W - 1);
    return [rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2]];
  };
  const push = (x, y, z, col, part, bright) => pts.push([mx(x), my(y), z, col[0], col[1], col[2], part, clamp(bright, 0, 1)]);

  // Importance map over the car: edges, highlights and the outline.
  const weights = new Float32Array(N);
  for (let p = 0; p < N; p++) {
    if (!mask[p]) continue;
    // Line-work first (the light sculpture is drawn by edges and the outline), panels as dust.
    const e = smooth(0.12, 0.7, edgeN(p)), hl = smooth(0.82, 1, lumRank(lum[p])), rim = dist[p] < 2.2 ? 1 : 0;
    const w = 0.08 + 1.4 * e + 0.3 * hl + 2 * rim;
    weights[p] = w;
  }
  const cdf = new Float64Array(N);
  let acc = 0;
  for (let p = 0; p < N; p++) { acc += weights[p]; cdf[p] = acc; }
  const draw = () => {
    const t = rnd() * acc;
    let lo = 0, hi = N - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < t) lo = m + 1; else hi = m; }
    return lo;
  };
  const brightAt = (p) => {
    const e = smooth(0.1, 0.75, edgeN(p)), l = lumRank(lum[p]);
    return 0.1 + 0.85 * e + 0.3 * l * l + (dist[p] < 2.2 ? 0.4 : 0);
  };
  const surfaceZ = (x, y) => (inWheel(x, y) ? wheelZ - 0.05 * (1 - Math.hypot(x - (x < xc ? rear.cx : front.cx), y - (x < xc ? rear.cy : front.cy)) / (x < xc ? rear.r : front.r)) : zSide(x, y));

  const nFar = Math.round(COUNT * 0.08), nShell = Math.round(COUNT * 0.15), nTread = Math.round(COUNT * 0.05);
  const nHead = Math.round(COUNT * 0.025), nTail = Math.round(COUNT * 0.015);
  const nNear = COUNT - nFar - nShell - nTread - nHead - nTail;

  // Near side (towards the camera): the image itself.
  for (let i = 0; i < nNear; i++) {
    const p = draw(), x = (p % W) + rnd() - 0.5, y = ((p / W) | 0) + rnd() - 0.5;
    push(x, y, surfaceZ(x, y), colourAt(x, y), partAt(x, y), brightAt(p));
  }
  // Far side: the same outline at −z, dimmer.
  for (let i = 0; i < nFar; i++) {
    const p = draw(), x = (p % W) + rnd() - 0.5, y = ((p / W) | 0) + rnd() - 0.5;
    push(x, y, -surfaceZ(x, y), colourAt(x, y), partAt(x, y), brightAt(p) * 0.42);
  }
  // Shell: the roof, bonnet and deck (outline pixels facing up) and the nose and tail faces,
  // spread across the width so the sculpture has volume when the camera moves.
  // Outline pixels facing up (top surfaces) or along x (nose and tail faces); the underside
  // is never seen.
  const shellPx = [];
  for (let p = 0; p < N; p++) {
    if (!mask[p] || dist[p] >= 2.2) continue;
    const x0 = p % W, y0 = (p / W) | 0;
    if (inWheel(x0, y0, 1.02) || y0 > ground - band) continue;
    // Outward normal of the outline from the mask around it
    let nx = 0, ny = 0;
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const xx = x0 + dx, yy = y0 + dy;
        const m = xx < 0 || yy < 0 || xx >= W || yy >= H ? 0 : mask[yy * W + xx];
        nx -= m * dx;
        ny -= m * dy;
      }
    }
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    if (ny < -0.35 || Math.abs(nx) > 0.55) shellPx.push([p, nx, ny]);
  }
  for (let i = 0; i < nShell && shellPx.length; i++) {
    const [p, nx, ny] = shellPx[Math.floor(rnd() * shellPx.length)];
    const x0 = p % W, y0 = (p / W) | 0;
    const u = rnd() < 0.45 ? (rnd() < 0.5 ? -1 : 1) * (0.82 + 0.18 * rnd()) : rnd() * 2 - 1;
    const col = colourAt(x0 - nx * 3, y0 - ny * 3);
    const part = partAt(x0 - nx * 3, y0 - ny * 3);
    const b = 0.22 + 0.33 * Math.abs(u) + 0.25 * edgeN(p);
    if (ny < -0.35) {
      // Top surface: across the width, crowned slightly.
      const zt = zSide(x0, y0 + 3);
      const crown = part === PART.cabin ? 0.05 : 0.03;
      pts.push([mx(x0), my(y0) - crown * u * u, u * zt, col[0], col[1], col[2], part, clamp(b, 0, 1)]);
    } else {
      // Nose or tail face with rounded corners in plan view.
      const yM = my(y0), half = section(yM), R = nx > 0 ? rcF : rcR, z = u * half;
      const over = Math.abs(z) - (half - R);
      const back = over > 0 ? R - Math.sqrt(Math.max(0, R * R - over * over)) : 0;
      pts.push([mx(x0) - Math.sign(nx) * back, yM, z, col[0], col[1], col[2], part, clamp(b, 0, 1)]);
    }
  }
  // Tyre treads: rings across the tyre width on both sides.
  for (let i = 0; i < nTread; i++) {
    const w = rnd() < 0.5 ? rear : front, a = rnd() * Math.PI * 2, side = rnd() < 0.5 ? 1 : -1;
    const x = w.cx + Math.cos(a) * w.r, y = w.cy + Math.sin(a) * w.r;
    if (y > ground) { i--; continue; }
    const z = side * (wheelZ - rnd() * 0.27);
    push(x, y, z, colourAt(w.cx + Math.cos(a) * w.r * 0.94, w.cy + Math.sin(a) * w.r * 0.94), PART.wheels, 0.22 + 0.25 * rnd());
  }
  // Lamps: the image's lamp zones, wrapped round the corners on both sides.
  const lampPx = (zone) => {
    const list = [];
    for (let y = Y0; y <= ground; y++) for (let x = X0; x <= X1; x++) { const p = y * W + x; if (mask[p] && zone(x, y)) list.push(p); }
    return list;
  };
  const lampHead = lampPx(headZone), lampTail = lampPx(tailZone);
  const lampDraw = (list) => {
    // Weighted towards the lamp graphic (edges and bright pixels)
    for (let k = 0; k < 6; k++) {
      const p = list[Math.floor(rnd() * list.length)];
      if (rnd() < 0.25 + edgeN(p) + smooth(0.6, 1, lumRank(lum[p]))) return p;
    }
    return list[Math.floor(rnd() * list.length)];
  };
  const lampCentre = (list) => {
    let sx = 0, sy = 0;
    for (const p of list) { sx += p % W; sy += (p / W) | 0; }
    return [sx / Math.max(1, list.length), sy / Math.max(1, list.length)];
  };
  for (const [list, n, part] of [[lampHead, nHead, PART.head], [lampTail, nTail, PART.tail]]) {
    if (!list.length) continue;
    for (let i = 0; i < n; i++) {
      const p = lampDraw(list), x = (p % W) + rnd() - 0.5, y = ((p / W) | 0) + rnd() - 0.5, side = i % 2 ? -1 : 1;
      push(x, y, side * zSide(x, y) * (0.86 + 0.14 * rnd()), colourAt(x, y), part, 0.6 + 0.4 * edgeN(p));
    }
  }

  // Shuffle so any prefix is an even subsample
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  // 8. Metadata for the stage (metres, model space)
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const headC = lampCentre(lampHead), tailC = lampCentre(lampTail);
  const roofline = [];
  for (let k = 0; k <= 32; k++) {
    const x = Math.round(X0 + (k / 32) * (X1 - X0));
    roofline.push([r3(mx(x)), r3(top[x] >= 0 ? my(top[x]) : 0)]);
  }
  const sill = [];
  for (let x = Math.round(rear.cx + rear.r); x < front.cx - front.r; x++) if (bot[x] >= 0) sill.push(my(bot[x]));
  const meta = {
    v: VERSION,
    slug,
    source: basename(file),
    count: pts.length,
    length: r3(lengthM),
    width: r3(widthM),
    height: r3(heightM),
    wheels: [rear, front].map((w) => [r3(mx(w.cx)), r3(my(w.cy)), r3(w.r * s)]),
    wheelZ: r3(wheelZ),
    belt: r3(beltM),
    glass: [r3(mx(gx0)), r3(mx(gx1))],
    sill: r3(sill.length ? percentile(sill, 0.5) : 0.15),
    nose: r3(mx(X1)),
    tail: r3(mx(X0)),
    head: lampHead.length ? [r3(mx(headC[0])), r3(my(headC[1])), r3(zSide(headC[0], headC[1]) * 0.85)] : null,
    rear: lampTail.length ? [r3(mx(tailC[0])), r3(my(tailC[1])), r3(zSide(tailC[0], tailC[1]) * 0.85)] : null,
    roofline,
  };

  // 9. Encode
  let json = JSON.stringify(meta);
  while ((16 + Buffer.byteLength(json)) % 4) json += " ";
  const metaBytes = Buffer.byteLength(json);
  const n = pts.length;
  const buf = Buffer.alloc(16 + metaBytes + n * 6 + n * 3 + n + n);
  buf.write("LRPS", 0, "ascii");
  buf.writeUInt32LE(VERSION, 4);
  buf.writeUInt32LE(n, 8);
  buf.writeUInt32LE(metaBytes, 12);
  buf.write(json, 16, "utf8");
  let o = 16 + metaBytes;
  for (const q of pts) for (let k = 0; k < 3; k++) { buf.writeInt16LE(clamp(Math.round(q[k] * 1000), -32767, 32767), o); o += 2; }
  for (const q of pts) for (let k = 3; k < 6; k++) buf[o++] = q[k];
  for (const q of pts) buf[o++] = q[6];
  for (const q of pts) buf[o++] = Math.round(q[7] * 255);

  if (DEBUG) await writeDebug(slug, { rgb, W, H, mask, rear, front, ground, beltY, gx0, gx1, partAt, pts, s, xc, band });
  return { buf, meta };
}

// ---------------------------------------------------------------------------------------------
// Debug images: parts over the image, and the points seen from the side and from 35° above-front

async function writeDebug(slug, d) {
  mkdirSync(DEBUG, { recursive: true });
  const { rgb, W, H, mask, rear, front, ground, beltY, gx0, gx1, partAt } = d;
  const out = Buffer.alloc(W * H * 3);
  const tint = { 0: [255, 215, 140], 1: [120, 220, 230], 2: [200, 200, 200], 4: [255, 255, 255], 5: [255, 60, 50] };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      if (mask[p]) {
        const t = tint[partAt(x, y)];
        for (let c = 0; c < 3; c++) out[p * 3 + c] = rgb[p * 3 + c] * 0.55 + t[c] * 0.45;
      } else for (let c = 0; c < 3; c++) out[p * 3 + c] = rgb[p * 3 + c] * 0.3;
    }
  }
  const dot = (x, y, col) => {
    const xi = Math.round(x), yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
    for (let c = 0; c < 3; c++) out[(yi * W + xi) * 3 + c] = col[c];
  };
  for (const w of [rear, front]) for (let a = 0; a < 720; a++) dot(w.cx + Math.cos(a / 114.6) * w.r, w.cy + Math.sin(a / 114.6) * w.r, [255, 0, 255]);
  for (let x = 0; x < W; x++) { dot(x, ground, [0, 255, 0]); dot(x, ground - d.band, [0, 120, 0]); if (x > gx0 && x < gx1) dot(x, beltY, [0, 200, 255]); }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).resize(1200).png().toFile(join(DEBUG, `${slug}-parts.png`));

  // Point renders
  const RW = 1200, RH = 560;
  const render = async (name, yaw, pitch) => {
    const img = new Float32Array(RW * RH * 3);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const scale = RW / 7;
    for (const q of d.pts) {
      // rotate about y (yaw), then x (pitch); camera looks down −z
      const x1 = q[0] * cy + q[2] * sy, z1 = -q[0] * sy + q[2] * cy;
      const y1 = (q[1] - 0.7) * cp - z1 * sp;
      const px = RW / 2 + x1 * scale, py = RH * 0.62 - y1 * scale;
      const xi = Math.round(px), yi = Math.round(py);
      if (xi < 0 || yi < 0 || xi >= RW || yi >= RH) continue;
      const k = 0.35 + 0.65 * q[7];
      for (let c = 0; c < 3; c++) img[(yi * RW + xi) * 3 + c] += q[3 + c] * k * 0.9 + 60 * k;
    }
    const b = Buffer.alloc(RW * RH * 3);
    for (let i = 0; i < b.length; i++) b[i] = Math.min(255, img[i] + (i % 3 === 0 ? 14 : 30));
    await sharp(b, { raw: { width: RW, height: RH, channels: 3 } }).png().toFile(join(DEBUG, `${slug}-${name}.png`));
  };
  await render("side", 0, 0.05);
  await render("q34", -0.6, 0.3);
}

// ---------------------------------------------------------------------------------------------
// Run

function sourceFor(slug) {
  if (SRC) {
    for (const ext of ["jpg", "jpeg", "png", "webp"]) {
      const f = join(SRC, `${slug}_side.${ext}`);
      if (existsSync(f)) return f;
    }
    return null;
  }
  const rel = sideBySlug.get(slug);
  return rel ? join(ROOT, "public", rel) : null;
}

const slugs = only.length ? only : [...sideBySlug.keys()];
const problems = [];
for (const slug of slugs) {
  const file = sourceFor(slug);
  if (!file || !existsSync(file)) { problems.push(`${slug}: no side image found`); continue; }
  try {
    const t0 = Date.now();
    const { buf, meta } = await processCar(slug, file);
    const dir = join(ROOT, "public/cars", slug);
    mkdirSync(dir, { recursive: true });
    const hash = createHash("sha256").update(buf).digest("hex").slice(0, 8);
    for (const n of readdirSync(dir)) if (/^particles\..*\.bin$/.test(n)) rmSync(join(dir, n));
    writeFileSync(join(dir, `particles.${hash}.bin`), buf);
    console.log(`${slug}: ${meta.count} points, ${(buf.length / 1024).toFixed(1)} KB, ${meta.length}×${meta.height} m, wheels r ${meta.wheels.map((w) => w[2]).join("/")} m (${Date.now() - t0} ms)`);
  } catch (err) {
    problems.push(`${slug}: ${err.message}`);
  }
}

// Regenerate the module listing every particle set on disk
const entries = [];
for (const slug of readdirSync(join(ROOT, "public/cars")).sort()) {
  const dir = join(ROOT, "public/cars", slug);
  let names = [];
  try { names = readdirSync(dir); } catch { continue; }
  const f = names.find((n) => /^particles\.[0-9a-f]+\.bin$/.test(n));
  if (f) entries.push(`  ${JSON.stringify(slug)}: ${JSON.stringify(`/cars/${slug}/${f}`)},`);
}
writeFileSync(
  join(ROOT, "src/scene/car/particleSets.ts"),
  `// Particle sets sampled from each car's side image, per car slug. GENERATED by
// tools/sample-car-particles.mjs: don't edit by hand, re-run the tool.

export const particleSets: Record<string, string | undefined> = {
${entries.join("\n")}
};
`,
);
if (problems.length) {
  console.error("Problems:\n  " + problems.join("\n  "));
  process.exitCode = 1;
}
