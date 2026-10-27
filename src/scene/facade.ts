import * as THREE from "three";

// Geometry builder for the stage's landmarks: walls, caps, prisms, lofts and rings merged into
// one BufferGeometry per material, with the attributes the facade shader reads (shaders.ts):
// aFace (distance along the outline, distances to the nearest sharp vertical edges, the
// piece's top) and aSpan (the piece's base, its kind and a seed). Built once, never per frame.

export type XZ = readonly [number, number];
const BIG = 1000;

export interface Style {
  kind: number;
  seed: number;
}

/** Accumulates facade triangles with the attributes the facade shader reads. */
export class Facade {
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

  /** A straight bar between two points (a strut, a beam): a box of the given width and depth. */
  beam(a: THREE.Vector3, b: THREE.Vector3, width: number, depth: number, s: Style) {
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const up = Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(dir, up).normalize().multiplyScalar(width / 2);
    const lift = new THREE.Vector3().crossVectors(side, dir).normalize().multiplyScalar(depth / 2);
    const corner = (p: THREE.Vector3, sx: number, sy: number) => p.clone().addScaledVector(side, sx * 2).addScaledVector(lift, sy * 2);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const faces: [number, number, number, number][] = [
      [-0.5, -0.5, 0.5, -0.5],
      [0.5, -0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5, 0.5],
      [-0.5, 0.5, -0.5, -0.5],
    ];
    for (const [x0, y0, x1, y1] of faces) {
      const bl = corner(a, x0, y0), br = corner(a, x1, y1), tr = corner(b, x1, y1), tl = corner(b, x0, y0);
      const out = bl.clone().add(br).add(tr).add(tl).multiplyScalar(0.25).sub(mid);
      this.quad(bl, br, tr, tl, { ...s, u: 0, sharpL: true, sharpR: true, bottom: Math.min(a.y, b.y), topL: Math.max(a.y, b.y), topR: Math.max(a.y, b.y), out });
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

export const rot2 = (pts: XZ[], a: number, cx = 0, cz = 0): XZ[] => {
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, z]) => [cx + x * c - z * s, cz + x * s + z * c] as const);
};

export const circle = (n: number, r: number, a0 = 0, cx = 0, cz = 0): XZ[] =>
  Array.from({ length: n }, (_, i) => [cx + Math.cos(a0 + (i / n) * Math.PI * 2) * r, cz + Math.sin(a0 + (i / n) * Math.PI * 2) * r] as const);

/** 2D helpers on the ground plane (x, z). */
export const norm = (x: number, z: number): XZ => {
  const l = Math.hypot(x, z) || 1;
  return [x / l, z / l];
};
/** 90° to the right of v, for someone looking along v (three.js: x right, z toward the viewer). */
export const rightOf = (v: XZ): XZ => [-v[1], v[0]];
/** v turned by `deg` degrees to the right (negative turns left). */
export const turn = (v: XZ, deg: number): XZ => {
  const a = (deg * Math.PI) / 180, r = rightOf(v);
  return [v[0] * Math.cos(a) + r[0] * Math.sin(a), v[1] * Math.cos(a) + r[1] * Math.sin(a)];
};
export const at = (p: XZ, ...terms: [number, XZ][]): XZ => {
  let x = p[0], z = p[1];
  for (const [k, v] of terms) {
    x += k * v[0];
    z += k * v[1];
  }
  return [x, z];
};
