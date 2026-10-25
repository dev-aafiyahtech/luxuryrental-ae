import type { CarSpecs } from "@/content/types";

// The powertrain schematic revealed when the sculpture explodes: an engine block with its
// cylinder banks (from the car's layout), a hybrid battery, drive shafts, axles and exhaust
// tips. It is labelled "Schematic" on the page and never presented as the real engine (plan
// 03 §3.4). Shared by the procedural car and the image-sampled car.

export type RGB = readonly [number, number, number];
export const palette = {
  champ: [0.96, 0.92, 0.86] as RGB,
  gold: [0.9, 0.78, 0.5] as RGB,
  goldS: [0.96, 0.9, 0.74] as RGB,
  ice: [0.62, 0.88, 0.88] as RGB,
  amber: [0.72, 0.58, 0.34] as RGB,
  white: [0.92, 0.96, 1.0] as RGB,
  red: [0.97, 0.22, 0.18] as RGB,
};

/** Adds one particle: position, component id, explode offset, colour, brightness. */
export type AddPoint = (x: number, y: number, z: number, comp: number, exX: number, exY: number, exZ: number, c: RGB, bright: number) => void;

export interface PowertrainShape {
  /** Engine behind the cabin ("mid") or under the bonnet ("front"). */
  engine: "mid" | "front";
  /** Wheel centres and radius [x, y, r], rear first. */
  wheels: readonly (readonly [number, number, number])[];
  /** Underside height at x. */
  bottom: (x: number) => number;
  /** Belt line height. */
  belt: number;
  /** Rearmost x (exhaust tips). */
  tail: number;
  /** Half the axle length. */
  axle: number;
}

const POWER = 3;
const BANKS: Record<CarSpecs["engineLayout"], { banks: number[]; perBank: number }> = {
  V6: { banks: [-0.2, 0.2], perBank: 3 },
  V8: { banks: [-0.2, 0.2], perBank: 4 },
  V12: { banks: [-0.2, 0.2], perBank: 6 },
  W16: { banks: [-0.3, -0.1, 0.1, 0.3], perBank: 4 },
};

/** Draws the schematic with `add`; `n(k)` turns a share of the budget into a point count. Returns its callout anchor. */
export function addPowertrain(
  add: AddPoint,
  n: (k: number) => number,
  rnd: () => number,
  shape: PowertrainShape,
  specs: { engineLayout: CarSpecs["engineLayout"]; hybrid: boolean; drivetrain: CarSpecs["drivetrain"] },
): [number, number, number] {
  const { gold, goldS, ice, amber } = palette;
  const line = (count: number, fn: (t: number) => void) => {
    for (let i = 0; i < count; i++) fn(count === 1 ? 0 : i / (count - 1));
  };
  const boxEdges = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, count: number, c: RGB, bright: number, ey: number) => {
    const edges: number[][] = [
      [x0, y0, z0, x1, y0, z0], [x0, y1, z0, x1, y1, z0], [x0, y0, z1, x1, y0, z1], [x0, y1, z1, x1, y1, z1],
      [x0, y0, z0, x0, y1, z0], [x1, y0, z0, x1, y1, z0], [x0, y0, z1, x0, y1, z1], [x1, y0, z1, x1, y1, z1],
      [x0, y0, z0, x0, y0, z1], [x1, y0, z0, x1, y0, z1], [x0, y1, z0, x0, y1, z1], [x1, y1, z0, x1, y1, z1],
    ];
    for (const e of edges) line(count, (t) => add(e[0] + (e[3] - e[0]) * t, e[1] + (e[4] - e[1]) * t, e[2] + (e[5] - e[2]) * t, POWER, 0, ey, 0, c, bright));
  };
  const WH = shape.wheels;
  const rear = WH[0], front = WH[WH.length - 1];
  const bot = shape.bottom;
  const mid = shape.engine === "mid";
  const ex0 = mid ? rear[0] + 0.03 : front[0] - 0.85;
  const ex1 = mid ? rear[0] + 0.98 : front[0] + 0.3;
  const ey0 = bot((ex0 + ex1) / 2) + 0.1;
  const ey1 = Math.max(ey0 + 0.3, shape.belt - 0.12);
  boxEdges(ex0, ex1, ey0, ey1, -0.36, 0.36, n(0.006), gold, 1, -0.1);
  const layout = BANKS[specs.engineLayout] ?? BANKS.V8;
  const spacing = (ex1 - ex0 - 0.16) / Math.max(1, layout.perBank - 1);
  const cr = Math.min(0.065, spacing * 0.4);
  for (const bz of layout.banks) {
    for (let k = 0; k < layout.perBank; k++) {
      const cx = ex0 + 0.08 + k * spacing;
      line(n(0.003), (t) => {
        const a = t * Math.PI * 2;
        add(cx + Math.cos(a) * cr, ey1 + 0.04, bz + Math.sin(a) * cr, POWER, 0, -0.1, 0, goldS, 1);
      });
    }
  }
  for (let i = 0, c = n(0.04); i < c; i++) add(ex0 + rnd() * (ex1 - ex0), ey0 + rnd() * (ey1 - ey0), (rnd() * 2 - 1) * 0.36, POWER, 0, -0.1, 0, amber, 0.2);
  if (specs.hybrid) {
    const bx0 = mid ? ex1 + 0.1 : rear[0] + 0.5;
    const bx1 = mid ? front[0] - 0.47 : ex0 - 0.1;
    const by = bot((bx0 + bx1) / 2) + 0.04;
    boxEdges(bx0, bx1, by, by + 0.1, -0.36, 0.36, n(0.005), ice, 0.8, -0.15);
  }
  // Drive: a shaft to each driven axle, then the axles themselves
  const driven = specs.drivetrain === "AWD" ? WH : [rear];
  for (const [wx, wy] of driven) {
    if (wx > ex0 - 0.2 && wx < ex1 + 0.2) continue;
    const fromX = wx < ex0 ? ex0 : ex1;
    line(n(0.008), (t) => add(fromX + (wx - fromX) * t, wy, 0, POWER, 0, -0.1, 0, goldS, 0.6));
  }
  for (const [wx, wy] of WH) line(n(0.01), (t) => add(wx, wy, (t * 2 - 1) * shape.axle, POWER, 0, -0.1, 0, goldS, 0.7));
  const X0 = shape.tail;
  for (const z of [-0.32, -0.18, 0.18, 0.32]) {
    line(n(0.002), (t) => {
      const a = t * Math.PI * 2;
      add(X0 + 0.01, bot(X0) + 0.05 + Math.sin(a) * 0.05, z + Math.cos(a) * 0.05, POWER, 0, -0.1, 0, amber, 1);
    });
  }
  return [(ex0 + ex1) / 2, ey1 + 0.04, 0];
}
