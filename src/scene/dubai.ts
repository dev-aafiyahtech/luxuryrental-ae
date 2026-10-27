import * as THREE from "three";
import { mulberry } from "./math";
import { Facade, at, circle, norm, rightOf, rot2, turn, type XZ } from "./facade";
import { HELIPAD_R, HELIPAD_Y, buildBurjAlArab } from "./baa";

// Procedural Dubai for the homepage stage, laid out around the landing. The car lands on the
// Burj Al Arab's helipad, looking inland: the Burj Khalifa stands 1,800 units away (about
// 14 km, compressed), a little right of the car, with Downtown, Business Bay, Sheikh Zayed
// Road's tower corridor and Trade Centre around it, the low-rise districts lit between, the
// coast curving away to the left and the sea around the island. The opening camera stands
// out at sea behind the Burj Al Arab, looking at the Burj Khalifa over the whole city.
// Everything is code-built: no models, textures or fonts.
//
// Scale: about 0.44 units per metre (the Burj Khalifa's 828 m → 364 units); the Burj Al Arab
// is drawn at 0.55 (baa.ts).

/** stage.ts AZ1: the landing camera stands at this azimuth around the car and looks back across it. */
const AZ1 = Math.PI / 2 - 0.24;
/** The landing camera's view direction. */
export const LAND: XZ = norm(-Math.cos(AZ1), -Math.sin(AZ1));
/** From the helipad to the Burj Khalifa: 7° right of the landing view. */
export const TO_BURJ: XZ = turn(LAND, 7);
export const BURJ_DIST = 1800;
/** The Burj Al Arab's helipad (the car's pad): centre, deck height, radius. */
export const HELIPAD = { x: -TO_BURJ[0] * BURJ_DIST, z: -TO_BURJ[1] * BURJ_DIST, y: HELIPAD_Y, r: HELIPAD_R } as const;
/** The Burj Khalifa's front wing points back at the helipad (and the opening camera). */
export const BURJ_FACING = Math.atan2(HELIPAD.z, HELIPAD.x);

const PAD: XZ = [HELIPAD.x, HELIPAD.z];
/** The opening camera: out at sea behind the helipad (units back, to the right), and its height. */
export const OPENING = { back: 550, right: 40, y: 262 } as const;
/** The opening camera's ground position. */
export const OPEN_POS: XZ = at(PAD, [-OPENING.back, TO_BURJ], [OPENING.right, rightOf(TO_BURJ)]);
/** Where the Burj Al Arab's mast stands: ahead and to the left of the helipad, just outside the landing frame. */
export const BAA_SPINE: XZ = at(PAD, [4, LAND], [-14.3, rightOf(LAND)]);
/** The coast: a line through COAST.p running along COAST.dir; inland is +COAST.n. */
const BEACH: XZ = turn(TO_BURJ, 70);
const COAST_DIR: XZ = turn(TO_BURJ, -20);
const COAST_N: XZ = rightOf(COAST_DIR);
const COAST_P: XZ = at(PAD, [80, BEACH]);
export const COAST = { x: COAST_P[0], z: COAST_P[1], nx: COAST_N[0], nz: COAST_N[1], dx: COAST_DIR[0], dz: COAST_DIR[1] } as const;
/** Distance inland from the shoreline (negative: at sea). */
export const inland = (x: number, z: number) => (x - COAST_P[0]) * COAST_N[0] + (z - COAST_P[1]) * COAST_N[1];
/** Distance along the coast (positive toward the north-east). */
const along = (x: number, z: number) => (x - COAST_P[0]) * COAST_DIR[0] + (z - COAST_P[1]) * COAST_DIR[1];
const shoreFrom = (p: XZ): XZ => at(p, [-inland(p[0], p[1]), COAST_N]);

/** Sheikh Zayed Road runs parallel to the coast, just north-west of the Burj Khalifa. */
const SZR_D = inland(0, 0) - 55;
export const SZR = { d: SZR_D, half: 11, rows: 17 } as const;
const szrAt = (t: number, off: number): XZ => at(COAST_P, [SZR_D + off, COAST_N], [t + along(0, 0), COAST_DIR]);

/** Seen from the helipad: forward toward the Burj, and to the right. */
const FWD = TO_BURJ, RIGHT = rightOf(TO_BURJ);
const fromBurj = (f: number, r: number): XZ => at([0, 0], [f, FWD], [r, RIGHT]);

/** The lake at the Burj Khalifa's foot (centre, radii along x and z). */
const LAKE_C = fromBurj(-34, 52);
export const LAKE = { x: LAKE_C[0], z: LAKE_C[1], rx: 26, rz: 16 } as const;

const ADDRESS = fromBurj(46, 84);
const BUSINESS_BAY = at([0, 0], [215, COAST_N], [70, COAST_DIR]);
const EMIRATES = szrAt(520, 26);
const MUSEUM = szrAt(472, 50);

/** Ground plots kept clear of generic towers: [x, z, radius]. */
export const PLOTS: readonly (readonly [number, number, number])[] = [
  [0, 0, 40],
  [ADDRESS[0], ADDRESS[1], 16],
  [EMIRATES[0], EMIRATES[1], 22],
  [MUSEUM[0], MUSEUM[1], 18],
];

/**
 * Keeps the Burj Khalifa visible down to about 80 m from the helipad and from the opening
 * camera: a tower standing in that slot of the view (narrow near the camera, about the Burj's
 * width at its foot) is capped below the line of sight. In Dubai the Old Town and the lake on
 * that side of the Burj are low too.
 */
export function viewCap(x: number, z: number, h: number, w: number): number {
  let cap = h;
  for (const [back, right, y] of [[0, 0, HELIPAD_Y + 1.6], [OPENING.back, OPENING.right, OPENING.y]] as const) {
    const o = at(PAD, [-back, TO_BURJ], [right, RIGHT]);
    const D = Math.hypot(o[0], o[1]);
    const f = (x - o[0]) * TO_BURJ[0] + (z - o[1]) * TO_BURJ[1];
    if (f <= 0 || f >= D) continue;
    const lat = Math.abs((x - o[0]) * TO_BURJ[1] - (z - o[1]) * TO_BURJ[0]);
    if (lat > (48 * f) / D + w / 2) continue;
    cap = Math.min(cap, y + ((34 - y) * f) / D);
  }
  return Math.max(4, cap);
}

/** True where generic towers may stand: on land, off Sheikh Zayed Road and the plots. */
export function buildable(x: number, z: number, w: number): boolean {
  if (inland(x, z) < 14 + w / 2) return false;
  if (Math.abs(inland(x, z) - SZR_D) < SZR.rows + 9) return false;
  if (Math.hypot((x - LAKE.x) / (LAKE.rx + 5), (z - LAKE.z) / (LAKE.rz + 5)) < 1) return false;
  return !PLOTS.some(([px, pz, pr]) => Math.hypot(x - px, z - pz) < pr + w / 2);
}

/** The twin Emirates Towers: triangular plans with roofs sloping up to a point. */
function emiratesTower(f: Facade, c: XZ, side: number, h: number, rot: number, seed: number): number[] {
  const rr = side / Math.sqrt(3);
  f.prism(circle(3, rr, rot, c[0], c[1]), 0, [h, h - side * 0.75, h - side * 0.75], { kind: 0, seed, sharp: [true, true, true] });
  return [c[0] + Math.cos(rot) * rr, h + 0.6, c[1] + Math.sin(rot) * rr];
}

/** The Address Downtown: a tapering tower whose back curves in, with a slim crown. */
function address(f: Facade, c: XZ, rot: number, seed: number): number[] {
  const base: XZ[] = [[9, 0], [6, 7], [-3, 9], [-9, 5], [-9, -5], [-3, -9], [6, -7]];
  const n = 8, H = 118;
  const levels = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const s = 1 - 0.52 * Math.pow(t, 1.5);
    const shift = -5.5 * Math.pow(t, 2);
    return { y: t * H, pts: rot2(base.map(([x, z]) => [x * s + shift, z * s] as const), rot, c[0], c[1]), c: rot2([[shift, 0]], rot, c[0], c[1])[0] };
  });
  f.loft(levels, { kind: 0, seed, sharp: [true, false, false, true, true, false, false] });
  const [tx, tz] = levels[n].c;
  f.loft([{ y: H, pts: circle(5, 3.2, rot, tx, tz) }, { y: H + 20, pts: circle(5, 0.25, rot, tx, tz) }], { kind: 3, seed: seed + 0.2 });
  return [tx, H + 20.6, tz];
}

/** The Museum of the Future: an upright ring of lit calligraphy on a green mound. */
function museum(f: Facade, c: XZ, rot: number) {
  const mound: [number, number][] = [[0, 15], [3, 13.5], [6, 10], [8, 6]];
  f.loft(mound.map(([y, r]) => ({ y, pts: circle(10, r, rot, c[0], c[1]) })), { kind: 5, seed: 0.3 });
  f.ring(c[0], 7 + 12.5, c[1], rot, 10.5, 4.6, 1.18, 18, 8, { kind: 4, seed: 0.77 });
}

/** The Jumeirah Beach Hotel beside the Burj Al Arab: a long curved block rising like a wave. */
function waveHotel(f: Facade, c: XZ, along: XZ, inl: XZ) {
  const n = 14, span = 64, h0 = 10, h1 = 58, depth = 7;
  const pt = (t: number, off: number): XZ => at(c, [(t - 0.5) * span, along], [Math.sin(t * Math.PI) * 9 + off, inl]);
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const y0 = h0 + (h1 - h0) * Math.pow(t0, 1.6), y1 = h0 + (h1 - h0) * Math.pow(t1, 1.6);
    for (const [o, s] of [[-depth / 2, 1], [depth / 2, -1]] as const) {
      const a = pt(t0, o), b = pt(t1, o);
      const out = new THREE.Vector3(inl[0] * -s, 0, inl[1] * -s);
      f.quad(new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]), new THREE.Vector3(b[0], y1, b[1]), new THREE.Vector3(a[0], y0, a[1]), {
        kind: 0,
        seed: 0.83,
        u: i * 4.6,
        sharpL: i === 0,
        sharpR: i === n - 1,
        bottom: 0,
        topL: y0,
        topR: y1,
        out,
      });
    }
  }
}

/** Simple crowns on corridor towers so the skyline isn't all flat roofs. */
function crown(f: Facade, x: number, z: number, w: number, d: number, h: number, type: number, seed: number) {
  const rect = (sx: number, sz: number): XZ[] => [[x - sx, z - sz], [x + sx, z - sz], [x + sx, z + sz], [x - sx, z + sz]];
  if (type === 0) {
    f.loft([{ y: h, pts: rect(w / 2, d / 2) }, { y: h + Math.min(w, d) * 0.8, pts: rect(0.15, 0.15) }], { kind: 3, seed, sharp: [true, true, true, true] });
  } else if (type === 1) {
    f.loft([{ y: h, pts: circle(6, 1.3, 0, x, z) }, { y: h + 16 + seed * 10, pts: circle(6, 0.1, 0, x, z) }], { kind: 1, seed });
  } else {
    f.prism(rect(w * 0.36, d * 0.36), h, h + 5, { kind: 3, seed, sharp: [true, true, true, true] });
  }
}

export interface Skyline {
  geometry: THREE.BufferGeometry;
  /** Extra boxes for the instanced city: [x, z, width, depth, height]. */
  towers: [number, number, number, number, number][];
  /** Aviation lights on landmark tops. */
  beacons: number[];
}

/**
 * Everything but the Burj Khalifa: the Burj Al Arab (with the helipad), the Jumeirah Beach
 * Hotel, Sheikh Zayed Road's corridor, Trade Centre with Emirates Towers and the Museum of the
 * Future, Business Bay, the Address Downtown, and the low- and mid-rise districts that fill
 * the view from the coast to Downtown. `detail` thins the districts on the low tier.
 */
export function buildSkyline(detail: number): Skyline {
  const f = new Facade();
  const r = mulberry(31);
  const towers: Skyline["towers"] = [];
  const beacons: number[] = [];
  /** Adds a tower (kept out of the view slot); false if it had to be cut down. */
  const box = (p: XZ, w: number, d: number, h: number) => {
    const capped = viewCap(p[0], p[1], h, Math.max(w, d));
    towers.push([p[0], p[1], w, d, capped]);
    return capped >= h;
  };

  // Sheikh Zayed Road: a near-continuous wall of towers on both sides, tallest by Downtown and
  // Trade Centre, lower through Al Quoz and Al Barsha toward the camera's right.
  for (const s of [-1, 1]) {
    let t = 900;
    while (t > -1250) {
      const len = 9 + r() * 5, wid = 8 + r() * 4;
      const p = szrAt(t - len / 2, s * SZR.rows + (r() - 0.5) * 3);
      let h = t > 280 ? 95 + r() * 70 : t > -120 ? 85 + r() * 65 : t > -650 ? 38 + Math.pow(r(), 1.4) * 70 : 40 + r() * 70;
      if (r() < 0.12) h *= 0.55;
      const type = r();
      t -= len + 3 + r() * 8;
      if (!buildableRoad(p, wid)) continue;
      if (s < 0 && r() > 0.5 + 0.5 * detail) continue;
      if (box(p, wid, len, h) && h > 92 && type < 0.55) crown(f, p[0], p[1], wid, len, h, type < 0.08 ? 0 : type < 0.24 ? 1 : 2, r());
    }
  }

  // Business Bay: a dense cluster east of the Burj Khalifa; Trade Centre and DIFC along the road
  const cluster = (c: XZ, radius: number, count: number, hMin: number, hMax: number) => {
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * radius;
      const p = at(c, [Math.cos(a) * d, FWD], [Math.sin(a) * d, RIGHT]);
      const w = 8 + r() * 5, h = hMin + Math.pow(r(), 1.3) * (hMax - hMin), type = r();
      if (!buildable(p[0], p[1], w)) continue;
      if (box(p, w, 8 + r() * 5, h) && h > 95 && type < 0.4) crown(f, p[0], p[1], w, w, h, type < 0.1 ? 1 : 2, r());
    }
  };
  cluster(BUSINESS_BAY, 120, Math.round(46 * (0.6 + 0.4 * detail)), 55, 150);
  cluster(szrAt(560, 60), 90, Math.round(26 * (0.6 + 0.4 * detail)), 60, 140);

  // The districts between the coast and Downtown: Jumeirah villas and beach-road hotels on the
  // coast side of the road, Al Quoz and Al Barsha beyond it. Sparse boxes; the ground's carpet
  // of lights does the rest. Sampled in rings from the helipad, wider apart with distance.
  const rr = mulberry(57);
  for (let d = 130; d < 2700; ) {
    const step = Math.min(60, Math.max(18, d * 0.03));
    for (let a = -42; a <= 46; a += (step / d) * (180 / Math.PI)) {
      if (rr() > 0.27 * detail) continue;
      const dir = turn(LAND, a + (rr() - 0.5) * 2);
      const p = at(PAD, [d + (rr() - 0.5) * step, dir]);
      const w = 6 + rr() * 6;
      if (Math.hypot(p[0], p[1]) < 270 || Math.hypot(p[0] - BUSINESS_BAY[0], p[1] - BUSINESS_BAY[1]) < 130) continue;
      if (!buildable(p[0], p[1], w)) continue;
      const s = inland(p[0], p[1]);
      const roadSide = s < SZR_D;
      const beachRoad = s < 70 && rr() < 0.35;
      const h = beachRoad ? 14 + rr() * 30 : roadSide ? 3 + rr() * rr() * 14 : 6 + rr() * rr() * 34;
      box(p, w, 6 + rr() * 6, h);
    }
    d += step;
  }

  // Landmarks
  beacons.push(...emiratesTower(f, EMIRATES, 19, 152, 0.2, 0.21), ...emiratesTower(f, at(EMIRATES, [26, COAST_DIR]), 16.5, 132, 0.2, 0.37));
  museum(f, MUSEUM, 0.35);
  beacons.push(...address(f, ADDRESS, Math.atan2(FWD[1], FWD[0]) + 2.4, 0.52));
  beacons.push(...buildBurjAlArab(f, { pad: PAD, spine: BAA_SPINE, land: LAND, shoreFrom, inland: COAST_N }));
  waveHotel(f, at(shoreFrom(at(PAD, [-60, LAND])), [34, COAST_N], [-30, COAST_DIR]), COAST_DIR, COAST_N);

  return { geometry: f.build(), towers, beacons };
}

/** Corridor towers stand right by the road, so only the landmark plots and the sea rule them out. */
function buildableRoad(p: XZ, w: number): boolean {
  if (inland(p[0], p[1]) < 20) return false;
  return !PLOTS.some(([px, pz, pr]) => Math.hypot(p[0] - px, p[1] - pz) < pr + w / 2);
}
