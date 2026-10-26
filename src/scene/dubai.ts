import * as THREE from "three";
import { mulberry } from "./math";

// Procedural Dubai for the homepage stage: the Burj Khalifa and a few recognisable silhouettes
// around it. Everything is built from code (no models, textures or fonts) into two merged
// geometries for the facade shader (shaders.ts `facade`): one for the Burj, one for the rest.
//
// Scale: about 0.44 scene units per metre, so the 828 m Burj Khalifa stands 364 units tall
// over a city whose towers reach ~150. Geography is compressed but plausible. The camera opens
// from the north-east, over Trade Centre, looking south-west: Sheikh Zayed Road runs on the
// Burj's north-west side (+x) from Emirates Towers and the Museum of the Future (near) to the
// Marina and Cayan Tower (far), the coast and the Burj Al Arab lie beyond it, and the Address
// Downtown and the lake sit on the Burj's south-east side (−x).

export const BURJ_H = 364;
/** Where the red aviation light sits. */
export const BURJ_TIP = new THREE.Vector3(0, BURJ_H + 0.6, 0);

/** Sheikh Zayed Road's centre line (x) and half-width; the corridor towers stand either side. */
export const SZR = { x: 125, half: 11, rows: 17 } as const;
/** The lake at the Burj's foot: centre and radii. */
export const LAKE = { x: -30, z: 24, rx: 24, rz: 12 } as const;
/** Coastline: x = x0 + k * z (the sea is beyond, at larger x); it swings out toward the Marina. */
export const COAST = { x0: 212, k: -0.05 } as const;
export const coastX = (z: number) => COAST.x0 + COAST.k * z;

/** Ground plots kept clear of generic towers: [x, z, radius]. */
export const PLOTS: readonly (readonly [number, number, number])[] = [
  [0, 0, 40], // Burj Khalifa
  [-62, 46, 16], // Address Downtown
  [103, 132, 20], // Emirates Towers
  [94, 182, 16], // Museum of the Future
];

type XZ = readonly [number, number];
const BIG = 1000;

interface Style {
  kind: number;
  seed: number;
}

/** Accumulates facade triangles with the attributes the facade shader reads. */
class Facade {
  private pos: number[] = [];
  private nrm: number[] = [];
  private face: number[] = [];
  private span: number[] = [];
  private readonly a = new THREE.Vector3();
  private readonly b = new THREE.Vector3();
  private readonly n = new THREE.Vector3();

  private vert(p: THREE.Vector3, n: THREE.Vector3, u: number, dl: number, dr: number, top: number, bottom: number, s: Style) {
    this.pos.push(p.x, p.y, p.z);
    this.nrm.push(n.x, n.y, n.z);
    this.face.push(u, dl, dr, top);
    this.span.push(bottom, s.kind, s.seed);
  }

  /**
   * A wall quad (bottom-left, bottom-right, top-right, top-left), wound to face `out`.
   * `sharpL`/`sharpR` mark vertical edges that get an edge light line.
   */
  quad(
    bl: THREE.Vector3,
    br: THREE.Vector3,
    tr: THREE.Vector3,
    tl: THREE.Vector3,
    o: Style & { u: number; uTop?: number; sharpL: boolean; sharpR: boolean; bottom: number; topL: number; topR: number; out: THREE.Vector3; normal?: THREE.Vector3 },
  ) {
    const wB = Math.hypot(br.x - bl.x, br.z - bl.z), wT = Math.hypot(tr.x - tl.x, tr.z - tl.z);
    const uT = o.uTop ?? o.u;
    const L0 = o.sharpL ? 0 : BIG, R0 = o.sharpR ? 0 : BIG;
    const n = this.n;
    if (o.normal) n.copy(o.normal);
    else {
      this.a.subVectors(br, bl);
      this.b.subVectors(tl, bl);
      n.crossVectors(this.a, this.b);
      if (n.lengthSq() < 1e-10) {
        this.a.subVectors(tr, bl);
        n.crossVectors(this.a, this.b);
      }
      n.normalize();
      if (n.dot(o.out) < 0) n.negate();
    }
    // Winding: front faces are counter-clockwise seen from outside.
    this.a.subVectors(br, bl);
    this.b.subVectors(tr, bl);
    const flip = this.a.cross(this.b).dot(n) < 0;
    const V: [THREE.Vector3, number, number, number, number][] = [
      [bl, o.u, L0, R0 + wB, o.topL],
      [br, o.u + wB, L0 + wB, R0, o.topR],
      [tr, uT + wT, L0 + wT, R0, o.topR],
      [tl, uT, L0, R0 + wT, o.topL],
    ];
    const order = flip ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
    for (const i of order) {
      const [p, u, dl, dr, top] = V[i];
      this.vert(p, n, u, dl, dr, top, o.bottom, o);
    }
  }

  /** A flat or sloped cap over a convex outline (fan), facing up. */
  cap(pts: THREE.Vector3[], s: Style & { bottom: number }) {
    const n = this.n;
    this.a.subVectors(pts[1], pts[0]);
    this.b.subVectors(pts[2], pts[0]);
    n.crossVectors(this.a, this.b).normalize();
    const flip = n.y < 0;
    if (flip) n.negate();
    for (let i = 1; i < pts.length - 1; i++) {
      const tri = flip ? [pts[0], pts[i + 1], pts[i]] : [pts[0], pts[i], pts[i + 1]];
      for (const p of tri) this.vert(p, n, 0, BIG, BIG, p.y, s.bottom, s);
    }
  }

  /**
   * Vertical prism over a convex outline. `tops` may give a height per vertex (sloped roofs).
   * `skip[i]` drops the wall from vertex i to i+1 (hidden inside another piece).
   */
  prism(poly: XZ[], y0: number, tops: number | number[], o: Style & { sharp?: boolean[]; skip?: boolean[]; cap?: boolean }) {
    const n = poly.length;
    const top = (i: number) => (typeof tops === "number" ? tops : tops[i % n]);
    let cx = 0, cz = 0;
    for (const [x, z] of poly) {
      cx += x / n;
      cz += z / n;
    }
    const out = new THREE.Vector3();
    let u = 0;
    for (let i = 0; i < n; i++) {
      const [ax, az] = poly[i], [bx, bz] = poly[(i + 1) % n];
      const w = Math.hypot(bx - ax, bz - az);
      if (!o.skip?.[i]) {
        out.set((ax + bx) / 2 - cx, 0, (az + bz) / 2 - cz);
        this.quad(new THREE.Vector3(ax, y0, az), new THREE.Vector3(bx, y0, bz), new THREE.Vector3(bx, top(i + 1), bz), new THREE.Vector3(ax, top(i), az), {
          ...o,
          u,
          sharpL: !!o.sharp?.[i],
          sharpR: !!o.sharp?.[(i + 1) % n],
          bottom: y0,
          topL: top(i),
          topR: top(i + 1),
          out,
        });
      }
      u += w;
    }
    if (o.cap !== false) this.cap(poly.map(([x, z], i) => new THREE.Vector3(x, top(i), z)), { ...o, bottom: y0 });
  }

  /** Lofted walls through outline levels with the same vertex count (tapers and twists). */
  loft(levels: { y: number; pts: XZ[]; c?: XZ }[], o: Style & { sharp?: boolean[]; cap?: boolean; kinds?: number[] }) {
    const n = levels[0].pts.length;
    const y0 = levels[0].y, yTop = levels[levels.length - 1].y;
    const out = new THREE.Vector3();
    const cum = levels.map((l) => {
      const c: number[] = [0];
      for (let i = 0; i < n; i++) {
        const [ax, az] = l.pts[i], [bx, bz] = l.pts[(i + 1) % n];
        c.push(c[i] + Math.hypot(bx - ax, bz - az));
      }
      return c;
    });
    const centre = (l: { pts: XZ[]; c?: XZ }): XZ => {
      if (l.c) return l.c;
      let cx = 0, cz = 0;
      for (const [x, z] of l.pts) {
        cx += x / n;
        cz += z / n;
      }
      return [cx, cz];
    };
    for (let j = 0; j < levels.length - 1; j++) {
      const A = levels[j], B = levels[j + 1];
      const [ca, cza] = centre(A), [cb, czb] = centre(B);
      for (let i = 0; i < n; i++) {
        const k = (i + 1) % n;
        const bl = new THREE.Vector3(A.pts[i][0], A.y, A.pts[i][1]);
        const br = new THREE.Vector3(A.pts[k][0], A.y, A.pts[k][1]);
        const tr = new THREE.Vector3(B.pts[k][0], B.y, B.pts[k][1]);
        const tl = new THREE.Vector3(B.pts[i][0], B.y, B.pts[i][1]);
        out.set((bl.x + br.x + tr.x + tl.x) / 4 - (ca + cb) / 2, 0, (bl.z + br.z + tr.z + tl.z) / 4 - (cza + czb) / 2);
        this.quad(bl, br, tr, tl, {
          ...o,
          kind: o.kinds?.[i] ?? o.kind,
          u: cum[j][i],
          uTop: cum[j + 1][i],
          sharpL: !!o.sharp?.[i],
          sharpR: !!o.sharp?.[k],
          bottom: y0,
          topL: yTop,
          topR: yTop,
          out,
        });
      }
    }
    if (o.cap !== false) {
      const L = levels[levels.length - 1];
      this.cap(L.pts.map(([x, z]) => new THREE.Vector3(x, L.y, z)), { ...o, bottom: y0 });
    }
  }

  /** A torus standing upright (axis horizontal), with analytic normals. */
  ring(cx: number, cy: number, cz: number, rot: number, R: number, r: number, stretch: number, segs: number, sides: number, s: Style) {
    const e1 = new THREE.Vector3(Math.cos(rot), 0, Math.sin(rot)); // across the ring
    const e3 = new THREE.Vector3(-Math.sin(rot), 0, Math.cos(rot)); // the ring's axis
    const P = (i: number, j: number, n: THREE.Vector3) => {
      const phi = (i / segs) * Math.PI * 2, psi = (j / sides) * Math.PI * 2;
      const rr = R + r * Math.cos(psi);
      n.copy(e1).multiplyScalar(Math.cos(phi) * Math.cos(psi)).addScaledVector(e3, Math.sin(psi));
      n.y = Math.sin(phi) * Math.cos(psi);
      n.normalize();
      return new THREE.Vector3(cx + e1.x * Math.cos(phi) * rr + e3.x * r * Math.sin(psi), cy + Math.sin(phi) * rr * stretch, cz + e1.z * Math.cos(phi) * rr + e3.z * r * Math.sin(psi));
    };
    const n0 = new THREE.Vector3(), n1 = new THREE.Vector3();
    const tube = 2 * Math.PI * r;
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < sides; j++) {
        const bl = P(i, j, n0), tl = P(i + 1, j, n1);
        const br = P(i, j + 1, n0), tr = P(i + 1, j + 1, n1);
        const mid = P(i + 0.5, j + 0.5, n0);
        const normal = n0.clone();
        const out = mid.clone().sub(new THREE.Vector3(cx, cy, cz)).normalize();
        this.quad(bl, br, tr, tl, { ...s, u: (j / sides) * tube + i * 0.37, sharpL: false, sharpR: false, bottom: cy - R, topL: cy + R * stretch + r, topR: cy + R * stretch + r, out, normal });
      }
    }
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nrm, 3));
    g.setAttribute("aFace", new THREE.Float32BufferAttribute(this.face, 4));
    g.setAttribute("aSpan", new THREE.Float32BufferAttribute(this.span, 3));
    g.computeBoundingSphere();
    return g;
  }
}

const rot2 = (pts: XZ[], a: number, cx = 0, cz = 0): XZ[] => {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c] as const);
};

const circle = (n: number, r: number, a0 = 0, cx = 0, cz = 0): XZ[] =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos(a0 + (i / n) * Math.PI * 2) * r, cz + Math.sin(a0 + (i / n) * Math.PI * 2) * r] as const);

/** One wing of the Y plan: a bar from the core with a rounded nose, pointing along angle a. */
function wing(len: number, hw: number, a: number) {
  const ARC = 6;
  const L = Math.max(len, hw + 0.6);
  const local: XZ[] = [[0, -hw], [L - hw, -hw]];
  for (let k = 1; k < ARC; k++) {
    const t = -Math.PI / 2 + (k * Math.PI) / ARC;
    local.push([L - hw + Math.cos(t) * hw, Math.sin(t) * hw]);
  }
  local.push([L - hw, hw], [0, hw]);
  const sharp = local.map((_, i) => i === 1 + ARC / 2); // the nose
  const skip = local.map((_, i) => i === local.length - 1); // the inner end, inside the core
  return { pts: rot2(local, a), sharp, skip };
}

/**
 * The Burj Khalifa: three wings around a hexagonal core (the Y plan), stepping back in a
 * spiral one wing at a time, then the tapering top section and the long spire.
 */
export function buildBurj(): THREE.BufferGeometry {
  const f = new Facade();
  const A0 = -0.42; // plan rotation: one wing toward the opening camera's left
  const angles = [A0, A0 + (2 * Math.PI) / 3, A0 + (4 * Math.PI) / 3];
  const Ys = 236, Rb = 30, Re = 6.4, steps = 24, yFirst = 30, yLast = 226;
  const dy = (yLast - yFirst) / (steps - 1);
  const reach = (y: number) => Re + (Rb - Re) * Math.pow(Math.max(0, 1 - y / Ys), 1.3);
  const halfWidth = (y: number) => 7.2 - 2.4 * Math.min(1, y / Ys);
  let seed = 0.13;

  // Wings: each steps back on every third setback, so the setbacks spiral up the tower.
  angles.forEach((a, w) => {
    let y0 = 0, len = Rb;
    for (let k = w; k < steps; k += 3) {
      const yk = yFirst + k * dy;
      const p = wing(len, halfWidth(y0), a);
      f.prism(p.pts, y0, yk, { kind: 0, seed: (seed += 0.071), sharp: p.sharp, skip: p.skip });
      y0 = yk;
      len = reach(yk + 2 * dy);
      if (len < 7.6) return;
    }
    const p = wing(len, halfWidth(y0), a);
    f.prism(p.pts, y0, Ys, { kind: 0, seed: (seed += 0.071), sharp: p.sharp, skip: p.skip });
  });

  // Hexagonal core, filling the concave corners between the wings (lit edges there).
  const hex = (r: number) => circle(6, r, A0 + Math.PI / 3);
  const hexSharp = [true, false, true, false, true, false];
  f.loft([{ y: 0, pts: hex(9.8) }, { y: Ys, pts: hex(6.6) }], { kind: 0, seed: 0.91, sharp: hexSharp });

  // Top section: the core with short fins, telescoping into the spire.
  const tiers: [number, number, number, number, number][] = [
    [Ys, 247, 6.0, 8.6, 2.6],
    [247, 256, 4.9, 6.8, 2.0],
    [256, 263, 3.9, 5.2, 1.5],
  ];
  for (const [y0, y1, r, fl, fw] of tiers) {
    f.prism(hex(r), y0, y1, { kind: 0, seed: (seed += 0.071), sharp: hexSharp });
    for (const a of angles) {
      const p = wing(fl, fw, a);
      f.prism(p.pts, y0, y1, { kind: 0, seed: (seed += 0.071), sharp: p.sharp, skip: p.skip });
    }
  }
  const spire: [number, number][] = [[263, 3.0], [292, 2.0], [326, 0.95], [BURJ_H, 0.1]];
  f.loft(spire.map(([y, r]) => ({ y, pts: circle(8, r, A0) })), { kind: 1, seed: 0.5 });
  return f.build();
}

/** The twin Emirates Towers: triangular plans with roofs sloping up to a point. */
function emiratesTower(f: Facade, cx: number, cz: number, side: number, h: number, rot: number, seed: number) {
  const rr = side / Math.sqrt(3);
  const pts = circle(3, rr, rot, cx, cz);
  const drop = side * 0.75;
  f.prism(pts, 0, [h, h - drop, h - drop], { kind: 0, seed, sharp: [true, true, true] });
}

/** Cayan Tower: a squarish plan turning 90° from base to roof. */
function cayan(f: Facade, cx: number, cz: number, side: number, h: number, seed: number) {
  const n = 18;
  const c = side / 2, k = side * 0.16;
  const sq: XZ[] = [[c, -c + k], [c, c - k], [c - k, c], [-c + k, c], [-c, c - k], [-c, -c + k], [-c + k, -c], [c - k, -c]];
  const levels = Array.from({ length: n + 1 }, (_, i) => ({ y: (i / n) * h, pts: rot2(sq, (i / n) * (Math.PI / 2), cx, cz), c: [cx, cz] as XZ }));
  f.loft(levels, { kind: 0, seed, sharp: sq.map(() => true) });
}

/** The Address Downtown: a tapering tower whose back curves in, with a slim crown. Returns its tip. */
function address(f: Facade, cx: number, cz: number, rot: number, seed: number): number[] {
  const base: XZ[] = [[9, 0], [6, 7], [-3, 9], [-9, 5], [-9, -5], [-3, -9], [6, -7]];
  const n = 8, H = 118;
  const levels = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const s = 1 - 0.52 * Math.pow(t, 1.5);
    const shift = -5.5 * Math.pow(t, 2); // the back leans in toward the top
    return { y: t * H, pts: rot2(base.map(([x, z]) => [x * s + shift, z * s] as const), rot, cx, cz), c: rot2([[shift, 0]], rot, cx, cz)[0] };
  });
  f.loft(levels, { kind: 0, seed, sharp: [true, false, false, true, true, false, false] });
  const top = levels[n];
  const [tx, tz] = top.c;
  f.loft([{ y: H, pts: circle(5, 3.2, rot, tx, tz) }, { y: H + 20, pts: circle(5, 0.25, rot, tx, tz) }], { kind: 3, seed: seed + 0.2 });
  return [tx, H + 20.6, tz];
}

/** The Burj Al Arab: a sail with a luminous fabric front and a mast, on its island. Returns the mast tip. */
function burjAlArab(f: Facade, cx: number, cz: number, facing: number, seed: number): number[] {
  const n = 9, H = 118;
  const levels = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const depth = 30 * Math.pow(Math.cos((t * Math.PI) / 2), 0.75) + 1.2; // the bow of the sail
    const wid = 12 * (1 - Math.pow(t, 1.8)) + 1.0;
    // spine at the back (0,0); fabric front bulging forward between the two wings
    const pts: XZ[] = [[0, 0], [depth * 0.62, -wid], [depth * 0.94, -wid * 0.5], [depth, 0], [depth * 0.94, wid * 0.5], [depth * 0.62, wid]];
    return { y: 4 + t * H, pts: rot2(pts, facing, cx, cz), c: rot2([[depth * 0.4, 0]], facing, cx, cz)[0] };
  });
  // walls: 0 spine→wing (side), 1–4 fabric front, 5 wing→spine (side)
  f.loft(levels, { kind: 0, seed, kinds: [0, 2, 2, 2, 2, 0], sharp: [true, true, false, false, false, true] });
  const [sx, sz] = rot2([[0.5, 0]], facing, cx, cz)[0];
  f.loft([{ y: 4 + H, pts: circle(4, 1.4, 0, sx, sz) }, { y: 4 + H + 22, pts: circle(4, 0.12, 0, sx, sz) }], { kind: 1, seed });
  f.prism(circle(10, 16, facing, cx + Math.cos(facing) * 10, cz + Math.sin(facing) * 10), 0, 4, { kind: 5, seed });
  return [sx, 4 + H + 22.6, sz];
}

/** The Museum of the Future: an upright ring of lit calligraphy on a green mound. */
function museum(f: Facade, cx: number, cz: number, rot: number) {
  const mound: [number, number][] = [[0, 15], [3, 13.5], [6, 10], [8, 6]];
  f.loft(mound.map(([y, r]) => ({ y, pts: circle(10, r, rot, cx, cz) })), { kind: 5, seed: 0.3 });
  f.ring(cx, 7 + 12.5, cz, rot, 10.5, 4.6, 1.18, 18, 8, { kind: 4, seed: 0.77 });
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
 * Everything around the Burj: the Sheikh Zayed Road corridor (boxes for the instanced city
 * plus crowns), Emirates Towers, the Museum of the Future, the Address Downtown, the Marina
 * with Cayan Tower, and the Burj Al Arab off the coast. `extent` shortens the corridor on the
 * low tier.
 */
export function buildSkyline(pad: { x: number; z: number; h: number }, extent: number): Skyline {
  const f = new Facade();
  const r = mulberry(31);
  const towers: Skyline["towers"] = [];
  const beacons: number[] = [];
  const clear = (x: number, z: number, m: number) => PLOTS.some(([px, pz, pr]) => Math.hypot(x - px, z - pz) < pr + m);

  // Sheikh Zayed Road: a near-continuous wall of towers on both sides
  for (const s of [-1, 1]) {
    const x0 = SZR.x + s * SZR.rows;
    let z = 214;
    while (z > -560 * extent) {
      const len = 9 + r() * 5, wid = 8 + r() * 4;
      const zc = z - len / 2, xc = x0 + (r() - 0.5) * 3;
      let h = zc > -80 ? 82 + r() * 66 : zc > -420 ? 40 + Math.pow(r(), 1.4) * 80 : 55 + r() * 55;
      if (r() < 0.12) h *= 0.55;
      if (Math.hypot(xc - pad.x, zc - pad.z) < 54) h = Math.min(h, pad.h - 12);
      const type = r();
      z -= len + 3 + r() * 7;
      if (clear(xc, zc, wid / 2)) continue;
      towers.push([xc, zc, wid, len, h]);
      if (h > 92 && type < 0.55) crown(f, xc, zc, wid, len, h, type < 0.08 ? 0 : type < 0.24 ? 1 : 2, r());
    }
  }

  // The Marina at the far end of the road, with Cayan Tower's twist
  const marina: [number, number, number, number][] = [
    [150, -900, 182, 1],
    [176, -930, 168, 0],
    [205, -885, 150, 2],
    [128, -952, 160, 1],
    [226, -948, 140, 0],
  ];
  for (const [x, z, h, t] of marina) {
    towers.push([x, z, 11, 11, h]);
    crown(f, x, z, 11, 11, h, t, 0.4);
    beacons.push(x, h + (t === 1 ? 20.6 : t === 0 ? 9.4 : 5.6), z);
  }
  cayan(f, 186, -985, 15, 134, 0.63);
  beacons.push(186, 134.6, -985);

  // Emirates Towers (office and hotel) and the Museum of the Future beside them
  emiratesTower(f, 98, 124, 19, 152, 0.2, 0.21);
  emiratesTower(f, 110, 146, 16.5, 132, 0.2, 0.37);
  beacons.push(...corner(98, 124, 19, 0.2, 152.6), ...corner(110, 146, 16.5, 0.2, 132.6));
  museum(f, 92, 184, 0.35);

  // The Address Downtown, by the lake
  beacons.push(...address(f, -62, 46, -0.6, 0.52));

  // The Burj Al Arab, off the coast to the south-west, its fabric front turned inland
  const bz = -640;
  beacons.push(...burjAlArab(f, coastX(bz) + 56, bz, Math.PI * 0.62, 0.44));

  return { geometry: f.build(), towers, beacons };
}

/** Position of an Emirates Tower's highest corner (its spike), for the beacon. */
function corner(cx: number, cz: number, side: number, rot: number, y: number): number[] {
  const rr = side / Math.sqrt(3);
  return [cx + Math.cos(rot) * rr, y, cz + Math.sin(rot) * rr];
}
