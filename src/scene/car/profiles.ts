import type { BodyStyle } from "@/content/types";

// Side-profile keypoints for each body style, in metres-ish units: x runs tail (−) to nose (+),
// y is height above the ground. The prototype's light-sculpture supercar is `supercar`.
// Used by the line-art placeholders (CarArt) and the homepage particle sculpture.

export interface CarProfile {
  /** Roofline / upper silhouette, tail → nose. */
  top: [number, number][];
  /** Underside / sill, tail → nose. */
  bottom: [number, number][];
  /** Half-width along the body, tail → nose (for 3D). */
  width: [number, number][];
  /** Wheel centres and radius: [x, y, r]. Rear first. */
  wheels: [number, number, number][];
  /** Glasshouse x-range (rear, front) and belt-line height. */
  glass: { from: number; to: number; belt: number };
  wing?: boolean;
  openTop?: boolean;
}

const supercar: CarProfile = {
  top: [[-2.3, 0.78], [-2.1, 0.9], [-1.6, 0.94], [-1.0, 1.0], [-0.45, 1.14], [0.15, 1.18], [0.62, 1.05], [1.05, 0.8], [1.55, 0.68], [2.0, 0.56], [2.3, 0.44]],
  bottom: [[-2.3, 0.32], [-1.95, 0.22], [1.9, 0.18], [2.3, 0.22]],
  width: [[-2.3, 0.84], [-1.9, 0.96], [-1.38, 1.0], [-0.6, 0.95], [0.6, 0.93], [1.42, 0.97], [2.0, 0.9], [2.3, 0.76]],
  wheels: [[-1.38, 0.37, 0.37], [1.42, 0.36, 0.36]],
  glass: { from: -0.75, to: 1.08, belt: 0.8 },
  wing: true,
};

const hypercar: CarProfile = {
  top: [[-2.35, 0.7], [-2.15, 0.82], [-1.7, 0.92], [-1.0, 1.0], [-0.4, 1.12], [0.2, 1.15], [0.7, 1.0], [1.15, 0.78], [1.7, 0.62], [2.1, 0.52], [2.35, 0.4]],
  bottom: [[-2.35, 0.3], [-2.0, 0.2], [1.95, 0.17], [2.35, 0.2]],
  width: [[-2.35, 0.9], [-1.9, 1.0], [-1.3, 1.04], [-0.5, 0.98], [0.6, 0.96], [1.45, 1.0], [2.05, 0.92], [2.35, 0.8]],
  wheels: [[-1.42, 0.38, 0.38], [1.45, 0.37, 0.37]],
  glass: { from: -0.6, to: 1.1, belt: 0.82 },
};

const spider: CarProfile = {
  top: [[-2.3, 0.78], [-2.1, 0.88], [-1.6, 0.92], [-1.0, 0.98], [-0.6, 1.02], [-0.2, 0.86], [0.35, 0.85], [0.7, 1.0], [1.05, 0.8], [1.55, 0.68], [2.0, 0.56], [2.3, 0.44]],
  bottom: [[-2.3, 0.32], [-1.95, 0.22], [1.9, 0.18], [2.3, 0.22]],
  width: [[-2.3, 0.84], [-1.9, 0.96], [-1.38, 1.0], [-0.6, 0.95], [0.6, 0.93], [1.42, 0.97], [2.0, 0.9], [2.3, 0.76]],
  wheels: [[-1.38, 0.37, 0.37], [1.42, 0.36, 0.36]],
  glass: { from: 0.45, to: 1.05, belt: 0.82 },
  openTop: true,
};

const gt: CarProfile = {
  top: [[-2.4, 0.86], [-2.2, 0.98], [-1.7, 1.08], [-1.0, 1.24], [-0.4, 1.3], [0.2, 1.26], [0.7, 1.02], [1.3, 0.92], [1.9, 0.86], [2.4, 0.7]],
  bottom: [[-2.4, 0.36], [-2.0, 0.26], [2.0, 0.24], [2.4, 0.3]],
  width: [[-2.4, 0.86], [-1.9, 0.96], [-1.3, 0.98], [0, 0.95], [1.4, 0.96], [2.1, 0.9], [2.4, 0.78]],
  wheels: [[-1.5, 0.38, 0.38], [1.6, 0.38, 0.38]],
  glass: { from: -1.2, to: 0.75, belt: 0.95 },
};

const cabriolet: CarProfile = {
  top: [[-2.4, 0.86], [-2.2, 0.98], [-1.7, 1.04], [-1.2, 1.06], [-0.9, 0.98], [-0.3, 0.97], [0.3, 0.98], [0.65, 1.22], [0.85, 1.0], [1.3, 0.92], [1.9, 0.86], [2.4, 0.7]],
  bottom: [[-2.4, 0.36], [-2.0, 0.26], [2.0, 0.24], [2.4, 0.3]],
  width: [[-2.4, 0.86], [-1.9, 0.96], [-1.3, 0.98], [0, 0.95], [1.4, 0.96], [2.1, 0.9], [2.4, 0.78]],
  wheels: [[-1.5, 0.38, 0.38], [1.6, 0.38, 0.38]],
  glass: { from: 0.55, to: 0.85, belt: 0.98 },
  openTop: true,
};

const suv: CarProfile = {
  top: [[-2.45, 1.0], [-2.38, 1.5], [-2.1, 1.66], [-1.2, 1.74], [0.2, 1.74], [0.75, 1.62], [1.15, 1.3], [1.7, 1.18], [2.25, 1.08], [2.45, 0.9]],
  bottom: [[-2.45, 0.5], [-2.1, 0.4], [2.05, 0.4], [2.45, 0.48]],
  width: [[-2.45, 0.9], [-1.9, 0.98], [0, 1.0], [1.9, 0.98], [2.45, 0.88]],
  wheels: [[-1.5, 0.42, 0.42], [1.55, 0.42, 0.42]],
  glass: { from: -2.0, to: 1.05, belt: 1.18 },
};

const limousine: CarProfile = {
  top: [[-2.75, 0.92], [-2.6, 1.06], [-2.1, 1.12], [-1.6, 1.5], [-0.8, 1.58], [0.5, 1.58], [1.05, 1.42], [1.35, 1.2], [2.0, 1.12], [2.6, 1.06], [2.75, 0.86]],
  bottom: [[-2.75, 0.42], [-2.4, 0.32], [2.4, 0.32], [2.75, 0.4]],
  width: [[-2.75, 0.9], [-2.2, 0.98], [0, 1.0], [2.2, 0.98], [2.75, 0.9]],
  wheels: [[-1.85, 0.42, 0.42], [1.85, 0.42, 0.42]],
  glass: { from: -1.55, to: 1.3, belt: 1.12 },
};

export const profiles: Record<BodyStyle, CarProfile> = { supercar, hypercar, spider, gt, cabriolet, suv, limousine };

/** Smooth SVG path through points (Catmull-Rom → cubic Bézier). */
export function smoothPath(pts: [number, number][], move = true): string {
  if (pts.length < 2) return "";
  let d = move ? `M${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}` : `L${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(3)},${c1[1].toFixed(3)} ${c2[0].toFixed(3)},${c2[1].toFixed(3)} ${p2[0].toFixed(3)},${p2[1].toFixed(3)}`;
  }
  return d;
}
