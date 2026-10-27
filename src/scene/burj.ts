import * as THREE from "three";
import { Facade, circle, rot2, type XZ } from "./facade";
import { BURJ_M, CORE, EDGE_FRONT, EDGE_LEFT, EDGE_RIGHT, FLARE, PINNACLE, PODIUM, WING_TOP, wingHalf } from "./burjProfile";

// The Burj Khalifa in 3D, from the massing in burjProfile.ts (metres) at the city's scale.
// Three wings with rounded noses around a hexagonal core: the front wing points at the camera
// (`facing`), so the other two form the left and right edges of the silhouette, each with its
// own staircase of setbacks, as in the reference elevation. Then the core alone, the stepped
// pinnacle and the needle.

export const BURJ_H = 364;
/** Scene units per metre (828 m → 364 units). */
export const BURJ_S = BURJ_H / BURJ_M;
/** Where the red aviation light sits. */
export const BURJ_TIP = new THREE.Vector3(0, BURJ_H + 0.6, 0);

const SIN120 = Math.sin((2 * Math.PI) / 3);
/** Rounded-nose wing: its tip projects (R − hw)·sin120 + hw sideways when seen with the front wing at the viewer. */
const reachFor = (edge: number, hw: number) => (edge - hw * (1 - SIN120)) / SIN120;

/** A wing bar from the core with a rounded nose, pointing along angle a (units). */
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

/** `facing`: plan angle (from +x toward +z) the front wing points at, i.e. toward the camera. */
export function buildBurj(facing: number): THREE.BufferGeometry {
  const f = new Facade();
  const S = BURJ_S;
  const third = (2 * Math.PI) / 3;
  // Side wings: seen from the camera, +120° lies on the left and −120° on the right.
  const wings: { a: number; steps: readonly (readonly [number, number])[]; top: number }[] = [
    { a: facing + third, steps: EDGE_LEFT, top: WING_TOP.left },
    { a: facing - third, steps: EDGE_RIGHT, top: WING_TOP.right },
    { a: facing, steps: EDGE_FRONT, top: WING_TOP.front },
  ];
  let seed = 0.13;
  const piece = (edge: number, y0: number, y1: number, a: number) => {
    const hw = wingHalf(y0);
    const p = wing(reachFor(edge, hw) * S, hw * S, a);
    f.prism(p.pts, y0 * S, y1 * S, { kind: 0, seed: (seed += 0.071), sharp: p.sharp, skip: p.skip });
  };

  // Podium and the flared base, the same on all three wings
  for (const { a } of wings) {
    const p = wing(reachFor(PODIUM.half, 22) * S, 22 * S, a);
    f.prism(p.pts, 0, PODIUM.top * S, { kind: 5, seed: 0.2, skip: p.skip });
    for (const [h0, h1, w] of FLARE) piece(w, h0, h1, a);
  }
  // Each wing's own staircase of setbacks
  for (const { a, steps, top } of wings) {
    steps.forEach(([h0, w], i) => piece(w, h0, i + 1 < steps.length ? steps[i + 1][0] : top, a));
  }

  // Hexagonal core: vertices in the concave corners between the wings carry the edge lights.
  const hex = (r: number) => circle(6, r, facing + Math.PI / 3);
  const hexSharp = [true, false, true, false, true, false];
  const rc = (half: number) => (half / SIN120) * S;
  f.loft(
    [
      { y: 0, pts: hex(rc(CORE.base)) },
      { y: 560 * S, pts: hex(rc(CORE.top + 1.6)) },
      { y: CORE.end * S, pts: hex(rc(CORE.top)) },
    ],
    { kind: 0, seed: 0.91, sharp: hexSharp },
  );

  // The pinnacle: stepped tiers, then the needle tapering to the tip
  PINNACLE.forEach(([h0, half], i) => {
    const h1 = i + 1 < PINNACLE.length ? PINNACLE[i + 1][0] : BURJ_M;
    if (i === PINNACLE.length - 1) {
      f.loft([{ y: h0 * S, pts: circle(6, rc(half), facing) }, { y: h1 * S, pts: circle(6, 0.05, facing) }], { kind: 1, seed: 0.5 });
    } else {
      f.prism(hex(rc(half)), h0 * S, h1 * S, { kind: 1, seed: 0.5 + i * 0.03, sharp: hexSharp });
    }
  });
  return f.build();
}
