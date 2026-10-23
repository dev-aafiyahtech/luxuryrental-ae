// Small numeric helpers shared by the scene modules (ported from the approved prototype).

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Smoothstep of v between a and b. */
export const sm = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Monotone-ish cubic Hermite interpolation through [x, y] keypoints (x ascending). */
export function hermite(pts: readonly (readonly [number, number])[], x: number): number {
  const n = pts.length;
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[n - 1][0]) return pts[n - 1][1];
  let i = 1;
  while (x > pts[i][0]) i++;
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  const dx = x1 - x0;
  const t = (x - x0) / dx;
  const m = (k: number) => {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(n - 1, k + 1)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  const m0 = m(i - 1) * dx;
  const m1 = m(i) * dx;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1;
}

/** Deterministic PRNG (mulberry32): the same seed always draws the same scene. */
export function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
