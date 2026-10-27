import * as THREE from "three";
import { Facade, at, circle, rightOf, rot2, turn, type XZ } from "./facade";

// The Burj Al Arab, where the car lands. Drawn at 0.55 units per metre, a little larger than
// the city (0.44), so its 27 m helipad holds the car and the pad markings. From published
// figures: 321 m to the top of the mast, top floor at 197.5 m, the helipad (27 m across) at
// about 210 m, two wings spreading in a V from the mast with the fabric atrium wall across
// the open side of the V (the sail, facing the sea), white steel exoskeleton on the outer
// faces, the Al Muntaha restaurant cantilevered 27 m either side of the mast near the top,
// all on its own island off Jumeirah Beach with a curving bridge to the shore.

export const BAA_S = 0.55;
const m = (v: number) => v * BAA_S;

/** Helipad deck height (210 m) and radius (28 m across). */
export const HELIPAD_Y = m(210);
export const HELIPAD_R = 7.8;

interface Options {
  /** Helipad centre on the ground plane, and the foot of the mast. */
  pad: XZ;
  spine: XZ;
  /** Direction the landing camera looks (the car's flank). */
  land: XZ;
  /** Nearest point of the shore to the island, and the inland direction. */
  shoreFrom: (p: XZ) => XZ;
  inland: XZ;
}

/** Adds the Burj Al Arab, its island and bridge to `f`. Returns aviation light positions. */
export function buildBurjAlArab(f: Facade, o: Options): number[] {
  // The mast stands ahead and to the left of the helipad (seen from the landing camera, at the
  // left edge of the frame); the helipad juts out behind it, over the water.
  const spine = o.spine;
  // The V opens to the left of the landing view: approaching from behind, the camera sees the
  // sail side-on, the mast on the right and the curved front on the left.
  const A = turn(o.land, -80);
  const facing = Math.atan2(A[1], A[0]);
  const island = at(spine, [20, A]);
  const top = m(200);

  // Island (rim lit) and the curving bridge to the shore
  const isl = Array.from({ length: 28 }, (_, i) => {
    const t = (i / 28) * Math.PI * 2;
    return [Math.cos(t) * 31, Math.sin(t) * 25] as const;
  });
  f.prism(rot2(isl, facing, island[0], island[1]), 0, m(7), { kind: 7, seed: 0.3 });
  const shore = o.shoreFrom(island);
  const toShore = [shore[0] - island[0], shore[1] - island[1]] as const;
  const len = Math.hypot(toShore[0], toShore[1]);
  const dir: XZ = [toShore[0] / len, toShore[1] / len];
  const p0 = at(island, [27, dir]), p2 = at(shore, [6, o.inland]);
  const p1 = at([(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], [len * 0.28, rightOf(dir)]);
  const bez = (t: number): THREE.Vector3 => {
    const a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t;
    return new THREE.Vector3(a * p0[0] + b * p1[0] + c * p2[0], 1.6 + Math.sin(t * Math.PI) * 1.4, a * p0[1] + b * p1[1] + c * p2[1]);
  };
  for (let i = 0; i < 18; i++) f.beam(bez(i / 18), bez((i + 1) / 18), 3.4, 0.9, { kind: 3, seed: 0.1 });

  // The sail: a V of two wings from the mast, the fabric front bowing out between their ends
  const n = 12;
  const levels = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const depth = m(66) * (1 - Math.pow(t, 2.3)) * (0.86 + 0.5 * t * (1 - t)) + m(5);
    const half = depth * Math.tan((24 * Math.PI) / 180);
    const pts: XZ[] = [[0, 0], [depth * 0.94, -half], [depth * 0.985, -half * 0.5], [depth, 0], [depth * 0.985, half * 0.5], [depth * 0.94, half]];
    return { y: m(7) + t * (top - m(7)), pts: rot2(pts, facing, spine[0], spine[1]), c: at(spine, [depth * 0.45, A]) };
  });
  // walls: 0 and 5 the wings' outer faces (exoskeleton), 1–4 the fabric front
  f.loft(levels, { kind: 6, seed: 0.44, kinds: [6, 2, 2, 2, 2, 6], sharp: [true, true, false, false, false, true] });

  // Where the wings meet the mast: a slim crown, the Al Muntaha restaurant (a lit capsule
  // cantilevered either side of the mast) and the mast itself, a tapering white spike.
  const crown = rot2([[-m(4), -m(6)], [m(8), -m(6)], [m(8), m(6)], [-m(4), m(6)]], facing, spine[0], spine[1]);
  f.prism(crown, m(190), m(206), { kind: 0, seed: 0.61, sharp: [true, true, true, true] });
  const capsule = (half: number, w: number, y: number) => ({
    y,
    pts: rot2(
      Array.from({ length: 12 }, (_, i) => {
        const t = (i / 12) * Math.PI * 2;
        return [m(3) + Math.cos(t) * w, Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.35) * half] as const;
      }),
      facing,
      spine[0],
      spine[1],
    ),
  });
  f.loft([capsule(m(16), m(4), m(193)), capsule(m(29), m(6.5), m(197.5)), capsule(m(30), m(6), m(203))], { kind: 0, seed: 0.72 });
  const mastBase = at(spine, [-m(2), A]);
  f.loft(
    [
      { y: m(200), pts: circle(6, m(3.4), facing, mastBase[0], mastBase[1]) },
      { y: m(262), pts: circle(6, m(1.7), facing, mastBase[0], mastBase[1]) },
      { y: m(321), pts: circle(6, m(0.25), facing, mastBase[0], mastBase[1]) },
    ],
    { kind: 1, seed: 0.5 },
  );

  // The helipad: a disc cantilevered from the crown on light struts, the sea far below
  const deckTop = HELIPAD_Y - 0.04;
  f.prism(circle(32, HELIPAD_R, 0, o.pad[0], o.pad[1]), deckTop - 1.3, deckTop, { kind: 7, seed: 0.9 });
  const under = new THREE.Vector3(o.pad[0], deckTop - 1.3, o.pad[1]);
  const towardSpine: XZ = [spine[0] - o.pad[0], spine[1] - o.pad[1]];
  const ts = Math.hypot(towardSpine[0], towardSpine[1]);
  const tsN: XZ = [towardSpine[0] / ts, towardSpine[1] / ts];
  const side = rightOf(tsN);
  for (const s of [-1, 1]) {
    const rimP = at(o.pad, [s * 3.2, side], [HELIPAD_R * 0.55, tsN]);
    const rootP = at(spine, [s * m(5), side], [-m(4), tsN]);
    f.beam(new THREE.Vector3(rimP[0], deckTop - 1.1, rimP[1]), new THREE.Vector3(rootP[0], m(198), rootP[1]), 0.42, 0.42, { kind: 5, seed: 0.2 });
    f.beam(new THREE.Vector3(under.x + s * side[0] * 2, under.y, under.z + s * side[1] * 2), new THREE.Vector3(rootP[0], m(178), rootP[1]), 0.36, 0.36, { kind: 5, seed: 0.3 });
  }

  const tip = at(mastBase, [0, A]);
  return [tip[0], m(321) + 0.6, tip[1]];
}
