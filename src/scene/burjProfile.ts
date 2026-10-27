// The Burj Khalifa's massing, in metres. No three.js here: the 3D tower (burj.ts) and the SVG
// fallback (components/home/SkylineArt.tsx) both read it, so they share one silhouette.
//
// Sources: published figures (828 m to the tip, top floor 585.4 m, a 242.5 m spire, 27
// setbacks spiralling up a Y plan of three wings around a hexagonal core) and a dimensioned
// elevation (Wikimedia Commons "Burj Khalifa Height.svg", read off as silhouette half-widths
// and rescaled to 828 m). Seen with one wing pointing at the viewer, the other two wings form
// the left and right edges of the silhouette and step back at different heights, so each side
// is its own staircase; the front wing steps in between them.

export const BURJ_M = 828;

/** Silhouette half-width (m) of each side wing from the given height (m) up. */
export const EDGE_LEFT: readonly (readonly [number, number])[] = [
  [40, 45.2],
  [86, 38.8],
  [164, 32.5],
  [277, 24.0],
  [398, 17.0],
];
export const EDGE_RIGHT: readonly (readonly [number, number])[] = [
  [40, 46.4],
  [108, 39.4],
  [200, 32.8],
  [315, 23.9],
  [445, 18.2],
  [548, 14.0],
];
/** The front wing (pointing at the viewer): same measure, stepping between the other two. */
export const EDGE_FRONT: readonly (readonly [number, number])[] = [
  [40, 46.0],
  [64, 41.5],
  [133, 35.5],
  [238, 28.5],
  [354, 20.5],
  [492, 15.5],
];
/** Where each wing ends and only the core continues. */
export const WING_TOP = { left: 570, right: 591, front: 560 } as const;

/** Low Y-shaped podium and the flared base of the wings (half-widths for all three). */
export const PODIUM = { top: 15, half: 78 } as const;
export const FLARE: readonly (readonly [number, number, number])[] = [
  [15, 28, 64],
  [28, 40, 54],
];

/** Wing bar half-width (m): the wings keep their width, a little narrower toward the top. */
export const wingHalf = (h: number) => 11 - 3.5 * Math.min(1, h / 560);

/** The hexagonal core: silhouette half-width at the base, at the top section, and where it ends. */
export const CORE = { base: 15.6, top: 12.5, end: 629 } as const;

/** The pinnacle above the top floor: [from height, half-width], up to the tip. */
export const PINNACLE: readonly (readonly [number, number])[] = [
  [629, 9.0],
  [667, 7.0],
  [700, 5.0],
  [735, 3.6],
  [757, 2.8],
  [818, 1.4],
];

/** Silhouette half-width of one side at height h, for the 2D drawing (side: left or right). */
export function edgeAt(side: "left" | "right", h: number): number {
  if (h < PODIUM.top) return PODIUM.half;
  for (const [h0, h1, w] of FLARE) if (h >= h0 && h < h1) return w;
  if (h >= PINNACLE[0][0]) {
    let w = PINNACLE[0][1];
    for (const [h0, hw] of PINNACLE) if (h >= h0) w = hw;
    return h >= BURJ_M ? 0 : w;
  }
  const steps = side === "left" ? EDGE_LEFT : EDGE_RIGHT;
  const top = side === "left" ? WING_TOP.left : WING_TOP.right;
  if (h >= top) return CORE.top;
  let w = steps[0][1];
  for (const [h0, hw] of steps) if (h >= h0) w = hw;
  return Math.max(w, CORE.top);
}
