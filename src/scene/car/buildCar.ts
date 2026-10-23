import type { CarSpecs } from "@/content/types";
import { clamp01, hermite, mulberry } from "../math";
import type { CarProfile } from "./profiles";

// The light-sculpture car, ported from the approved prototype's buildCar() and driven by a
// body-style profile. Every particle knows where it sits assembled (`position`), where it
// floats when the car is exploded (`aExplode`, an offset) and where it hangs as loose dust
// before the car forms (`aScatter`). Colour comes from the car part, never the paint (D-13).
// Pure data: no three.js here, so this could move to a worker later.

/** Component ids shared with the shader: 0 body, 1 cabin/glass, 2 wheels, 3 powertrain, 4 headlights, 5 taillights. */
export const COMP = { body: 0, cabin: 1, wheels: 2, powertrain: 3, head: 4, tail: 5 } as const;

export type AnchorPart = "cabin" | "body" | "wheels" | "powertrain";
export interface Anchor {
  /** Assembled position. */
  p: [number, number, number];
  /** Explode offset. */
  e: [number, number, number];
}

export interface CarBuildOptions {
  profile: CarProfile;
  engineLayout: CarSpecs["engineLayout"];
  hybrid: boolean;
  drivetrain: CarSpecs["drivetrain"];
  seed?: number;
}

export interface CarBuild {
  count: number;
  position: Float32Array;
  explode: Float32Array;
  scatter: Float32Array;
  color: Float32Array;
  comp: Float32Array;
  rnd: Float32Array;
  bright: Float32Array;
  anchors: Record<AnchorPart, Anchor>;
  /** Headlight centre (mirrored on −z). */
  lamp: [number, number, number];
  /** Nose x, for headlight beams. */
  nose: number;
}

type RGB = readonly [number, number, number];
const champ: RGB = [0.96, 0.92, 0.86];
const gold: RGB = [0.9, 0.78, 0.5];
const goldS: RGB = [0.96, 0.9, 0.74];
const ice: RGB = [0.62, 0.88, 0.88];
const amber: RGB = [0.72, 0.58, 0.34];
const white: RGB = [0.92, 0.96, 1.0];
const red: RGB = [0.97, 0.22, 0.18];

const BANKS: Record<CarSpecs["engineLayout"], { banks: number[]; perBank: number }> = {
  V6: { banks: [-0.2, 0.2], perBank: 3 },
  V8: { banks: [-0.2, 0.2], perBank: 4 },
  V12: { banks: [-0.2, 0.2], perBank: 6 },
  W16: { banks: [-0.3, -0.1, 0.1, 0.3], perBank: 4 },
};

export function buildCar(opts: CarBuildOptions, N: number): CarBuild {
  const P = opts.profile;
  const rnd = mulberry(opts.seed ?? 1337);
  const pos: number[] = [], ex: number[] = [], sc: number[] = [], col: number[] = [], cmp: number[] = [], rn: number[] = [], br: number[] = [];
  const j = (s: number) => (rnd() - 0.5) * s;
  function add(x: number, y: number, z: number, comp: number, exX: number, exY: number, exZ: number, c: RGB, bright: number) {
    pos.push(x, y, z);
    ex.push(exX + j(0.03), exY + j(0.03), exZ + j(0.03));
    const a = rnd() * Math.PI * 2;
    const r = 2 + rnd() * 10;
    sc.push(Math.cos(a) * r, 0.3 + rnd() * 7, Math.sin(a) * r);
    col.push(c[0], c[1], c[2]);
    cmp.push(comp);
    rn.push(rnd());
    br.push(bright);
  }

  const top = (x: number) => hermite(P.top, x);
  const bot = (x: number) => hermite(P.bottom, x);
  const wid = (x: number) => hermite(P.width, x);
  const beltH = P.glass.belt;
  const belt = (x: number) => Math.min(top(x) - 0.01, beltH);
  const hw = (x: number, y: number) => {
    const b = belt(x), bt = bot(x), w = wid(x), tp = top(x);
    if (y <= b) {
      const t = clamp01((y - bt) / Math.max(0.01, b - bt));
      return w * (0.9 + 0.1 * Math.sin(Math.PI * t));
    }
    return w * (1 - 0.36 * Math.pow(clamp01((y - b) / Math.max(0.01, tp - b)), 1.1));
  };
  const WH = P.wheels;
  const rear = WH[0], front = WH[WH.length - 1];
  const inArch = (x: number, y: number) => WH.some(([wx, wy, r]) => Math.hypot(x - wx, y - wy) < r + 0.1);
  const open = P.openTop ? P.open ?? null : null;
  const inOpen = (x: number) => !!open && x > open.from && x < open.to;
  const glass = (x: number, y: number) => y > belt(x) + 0.015 && x > P.glass.from && x < P.glass.to;
  const [s0, s1] = P.screen ?? [P.glass.from, P.glass.to];
  const roofGlass = (x: number) =>
    !inOpen(x) && (P.canopy ? x > P.glass.from && x < P.glass.to && top(x) > beltH + 0.02 : x > s0 && x < s1);
  const X0 = P.top[0][0] + 0.02;
  const X1 = P.top[P.top.length - 1][0] - 0.02;
  const n = (k: number) => Math.max(8, Math.round(N * k));
  const line = (count: number, fn: (t: number) => void) => {
    for (let i = 0; i < count; i++) fn(count === 1 ? 0 : i / (count - 1));
  };

  // Side skin
  for (let i = 0, c = n(0.21); i < c; ) {
    const x = X0 + rnd() * (X1 - X0), bt = bot(x), y = bt + rnd() * (top(x) - bt);
    if (inArch(x, y)) continue;
    i++;
    const s = rnd() < 0.5 ? -1 : 1, z = s * hw(x, y);
    if (glass(x, y)) add(x, y, z, COMP.cabin, 0, 2.0, s * 0.1, ice, 0);
    else add(x, y, z, COMP.body, 0, 0.95, s * 0.55, champ, 0);
  }
  // Hood, roof, engine cover (the open cockpit stays open)
  for (let i = 0, c = n(0.14); i < c; ) {
    const x = X0 + rnd() * (X1 - X0);
    if (inOpen(x)) continue;
    i++;
    const tp = top(x), zf = rnd() * 2 - 1, y = tp - 0.05 * zf * zf, z = zf * hw(x, tp);
    if (roofGlass(x)) add(x, y, z, COMP.cabin, 0, 2.05, 0, ice, 0);
    else add(x, y, z, COMP.body, 0, 1.4, 0, champ, 0);
  }
  // Nose and tail faces
  for (let i = 0, c = n(0.03); i < c; i++) {
    const front = rnd() < 0.55, x = front ? X1 + 0.01 : X0 - 0.01, bt = bot(x), y = bt + rnd() * (top(x) - bt);
    add(x, y, (rnd() * 2 - 1) * hw(x, y) * 0.95, COMP.body, front ? 0.7 : -0.6, 0.95, 0, champ, 0);
  }

  // Headlight geometry, scaled from the prototype supercar's lamps
  const headY = top(X1 - 0.2) - 0.06;
  const lampK = hw(X1 - 0.2, headY) / 0.9;
  const tailY = bot(X0) + 0.85 * (top(X0) - bot(X0));

  // Feature lines, both sides
  for (const s of [-1, 1]) {
    line(n(0.06), (t) => {
      const x = X0 + t * (X1 - X0), tp = top(x), y = tp - 0.05, z = s * hw(x, tp) * 0.98;
      if (roofGlass(x)) add(x, y, z, COMP.cabin, 0, 2.05, s * 0.1, ice, 1);
      else add(x, y, z, COMP.body, 0, 1.4, s * 0.15, goldS, 1);
    });
    line(n(0.05), (t) => {
      const x = X0 + t * (X1 - X0), b = belt(x);
      if (!inArch(x, b)) add(x, b, s * hw(x, b), COMP.body, 0, 0.95, s * 0.55, gold, 1);
    });
    line(n(0.045), (t) => {
      const x = X0 + t * (X1 - X0), y = bot(x) + 0.05;
      if (!inArch(x, y)) add(x, y, s * hw(x, y), COMP.body, 0, 0.95, s * 0.55, gold, 0.8);
    });
    sideLine(s);
    for (const [wx, wy, r] of WH) {
      line(n(0.012), (t) => {
        const a = Math.PI * (0.02 + 0.96 * t), x = wx + Math.cos(a) * (r + 0.1), y = wy + Math.sin(a) * (r + 0.1);
        if (y >= bot(x)) add(x, y, s * hw(x, y), COMP.body, 0, 0.95, s * 0.55, gold, 1);
      });
    }
    // Headlights: a swept LED strip and a short accent
    line(n(0.012), (t) => add(X1 - 0.12 - 0.14 * t, headY - 0.01 + 0.05 * t, s * (0.48 + 0.36 * t) * lampK, COMP.head, 0.8, 0.95, 0, white, 1));
    line(n(0.006), (t) => add(X1 - 0.18 + 0.07 * t, headY - 0.0 - 0.08 * t, s * (0.6 - 0.05 * t) * lampK, COMP.head, 0.8, 0.95, 0, white, 1));
  }

  function sideLine(s: number) {
    const style = P.sideLine ?? "intake";
    if (style === "intake") {
      const x0 = rear[0] + 1.18, y0 = beltH - 0.04;
      line(n(0.02), (t) => {
        const x = x0 - 0.8 * t, y = y0 - 0.34 * t + 0.08 * Math.sin(Math.PI * t);
        add(x, y, s * (hw(x, y) + 0.01), COMP.body, 0, 0.95, s * 0.55, gold, 1);
      });
    } else if (style === "c-curve") {
      const cx = rear[0] + 1.32, cy = (bot(cx) + top(cx)) / 2, rx = 0.45, ry = (top(cx) - bot(cx)) / 2 - 0.06;
      line(n(0.03), (t) => {
        const a = Math.PI * (0.53 + 0.94 * t), x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
        add(x, y, s * (hw(x, y) + 0.01), COMP.body, 0, 0.95, s * 0.55, gold, 1);
      });
    } else {
      line(n(0.035), (t) => {
        const x = X0 + 0.25 + t * (X1 - X0 - 0.55), y = belt(x) - 0.14;
        if (!inArch(x, y)) add(x, y, s * (hw(x, y) + 0.005), COMP.body, 0, 0.95, s * 0.55, gold, 0.9);
      });
      // Door shut lines: behind the windscreen base, and a B-pillar on long glasshouses
      const doors = [s1 - 0.08];
      if (P.glass.to - P.glass.from > 2.2) doors.push((P.glass.from + P.glass.to) / 2 - 0.1);
      for (const dx of doors) {
        line(n(0.008), (t) => {
          const y = bot(dx) + 0.1 + t * (belt(dx) - bot(dx) - 0.1);
          add(dx, y, s * (hw(dx, y) + 0.005), COMP.body, 0, 0.95, s * 0.55, goldS, 0.7);
        });
      }
    }
  }

  // Centre spine and windscreen edges
  line(n(0.02), (t) => {
    const x = X0 + 0.08 + t * (X1 - X0 - 0.16);
    if (inOpen(x)) return;
    const g = roofGlass(x);
    add(x, top(x), 0, g ? COMP.cabin : COMP.body, 0, g ? 2.05 : 1.4, 0, g ? ice : goldS, 0.6);
  });
  for (const sx of [s1, s0]) {
    line(n(0.012), (t) => {
      const tp = top(sx);
      add(sx, tp, (t * 2 - 1) * hw(sx, tp), COMP.cabin, 0, 2.05, 0, ice, 1);
    });
  }
  // Splitter, diffuser fins, taillights
  line(n(0.012), (t) => add(X1 - 0.01, bot(X1 - 0.01) - 0.02, (t * 2 - 1) * wid(X1 - 0.05), COMP.body, 0.7, 0.95, 0, gold, 1));
  for (let f = -2; f <= 2; f++) line(n(0.003), (t) => add(X0, bot(X0) - 0.09 + 0.12 * t, f * 0.22, COMP.body, -0.6, 0.95, 0, gold, 0.8));
  const tailW = hw(X0, tailY) * 0.98;
  line(n(0.02), (t) => {
    const z = (t * 2 - 1) * tailW;
    if (Math.abs(z) > 0.06) add(X0 - 0.01, tailY, z, COMP.tail, -0.6, 0.95, 0, red, 1);
  });

  // Rear wing
  if (P.wing) {
    const wingY = top(X0 + 0.16) + 0.19, strutBase = top(X0 + 0.16);
    line(n(0.018), (t) => add(X0 + 0.08, wingY, (t * 2 - 1) * 0.9, COMP.body, -0.35, 1.75, 0, gold, 1));
    line(n(0.018), (t) => add(X0 + 0.3, wingY + 0.02, (t * 2 - 1) * 0.9, COMP.body, -0.35, 1.75, 0, gold, 1));
    for (let i = 0, c = n(0.02); i < c; i++) add(X0 + 0.08 + rnd() * 0.22, wingY + 0.01, (rnd() * 2 - 1) * 0.9, COMP.body, -0.35, 1.75, 0, champ, 0);
    for (const s of [-1, 1]) {
      line(n(0.006), (t) => add(X0 + 0.16, strutBase + (wingY - strutBase) * t, s * 0.45, COMP.body, -0.35, 1.75, 0, gold, 0.8));
      line(n(0.006), (t) => add(X0 + 0.06 + 0.26 * t, wingY, s * 0.9, COMP.body, -0.35, 1.75, 0, gold, 1));
    }
  }

  // Open cockpit: seat backs, headrests, roll hoops and a steering wheel
  let seatAnchor: [number, number, number] | null = null;
  if (open) {
    const rows = open.to - open.from > 1.3 ? [open.to - 0.75, open.from + 0.35] : [open.from + 0.18];
    rows.forEach((sx, row) => {
      for (const sz of [-0.33, 0.33]) {
        const sb = beltH - 0.12, h = row === 0 ? 0.42 : 0.34;
        line(n(0.008), (t) => add(sx, sb + h * t, sz - 0.2, COMP.cabin, 0, 1.9, 0, champ, 0.7));
        line(n(0.008), (t) => add(sx, sb + h * t, sz + 0.2, COMP.cabin, 0, 1.9, 0, champ, 0.7));
        line(n(0.008), (t) => {
          const a = Math.PI * t;
          add(sx - 0.02, sb + h + Math.sin(a) * 0.09, sz + Math.cos(a) * 0.2, COMP.cabin, 0, 1.9, 0, goldS, 1);
        });
        for (let i = 0, c = n(0.006); i < c; i++) add(sx + j(0.04), sb + rnd() * h, sz + (rnd() * 2 - 1) * 0.18, COMP.cabin, 0, 1.9, 0, champ, 0);
        if (row === 0 && P.sideLine === "intake") {
          // Roll hoop behind each seat
          line(n(0.008), (t) => {
            const a = Math.PI * t;
            add(sx - 0.14, sb + h + 0.02 + Math.sin(a) * 0.14, sz + Math.cos(a) * 0.22, COMP.body, 0, 1.4, 0, gold, 1);
          });
        }
      }
    });
    // Steering wheel (left-hand drive), tilted towards the driver
    const wx = s0 - 0.28, wy = beltH + 0.05, wz = 0.33;
    line(n(0.01), (t) => {
      const a = t * Math.PI * 2, r = 0.17;
      add(wx + Math.sin(a) * r * 0.35, wy + Math.sin(a) * r, wz + Math.cos(a) * r, COMP.cabin, 0, 1.9, 0, goldS, 1);
    });
    seatAnchor = [rows[0], beltH + 0.3, 0];
  }

  // Wheels
  for (const [wx, wy, r] of WH) {
    for (const s of [-1, 1]) {
      const zc = s * (hw(wx, wy + 0.06) - 0.1), out = zc + s * 0.13, inn = zc - s * 0.13, exX = wx * 0.15, exZ = s * 1.35;
      const ring = (count: number, rr: number, z: number, bright: number, c: RGB) =>
        line(count, (t) => {
          const a = t * Math.PI * 2;
          add(wx + Math.cos(a) * rr, wy + Math.sin(a) * rr, z, COMP.wheels, exX, 0, exZ, c, bright);
        });
      ring(n(0.02), r, out, 0.7, champ);
      ring(n(0.015), r, inn, 0.3, champ);
      ring(n(0.016), r * 0.78, out + s * 0.005, 1, goldS);
      ring(n(0.008), r * 0.58, out - s * 0.03, 0.4, amber);
      for (let k = 0; k < 10; k++) {
        const a0 = (k / 10) * Math.PI * 2 + (k % 2) * 0.12;
        line(n(0.0028), (t) => {
          const rr = r * (0.19 + 0.59 * t);
          add(wx + Math.cos(a0) * rr, wy + Math.sin(a0) * rr, out, COMP.wheels, exX, 0, exZ, goldS, 1);
        });
      }
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * Math.PI * 2;
        line(4, (t) => add(wx + Math.cos(a) * r, wy + Math.sin(a) * r, inn + (out - inn) * t, COMP.wheels, exX, 0, exZ, champ, 0.2));
      }
      line(n(0.004), (t) => {
        const a = 0.55 * Math.PI + t * 0.5;
        add(wx + Math.cos(a) * r * 0.54, wy + Math.sin(a) * r * 0.54, out - s * 0.05, COMP.wheels, exX, 0, exZ, amber, 1);
      });
    }
  }

  // Powertrain schematic from the car's data (layout, cylinders, hybrid), revealed when exploded
  const boxEdges = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, count: number, c: RGB, bright: number, ey: number) => {
    const edges: number[][] = [
      [x0, y0, z0, x1, y0, z0], [x0, y1, z0, x1, y1, z0], [x0, y0, z1, x1, y0, z1], [x0, y1, z1, x1, y1, z1],
      [x0, y0, z0, x0, y1, z0], [x1, y0, z0, x1, y1, z0], [x0, y0, z1, x0, y1, z1], [x1, y0, z1, x1, y1, z1],
      [x0, y0, z0, x0, y0, z1], [x1, y0, z0, x1, y0, z1], [x0, y1, z0, x0, y1, z1], [x1, y1, z0, x1, y1, z1],
    ];
    for (const e of edges) line(count, (t) => add(e[0] + (e[3] - e[0]) * t, e[1] + (e[4] - e[1]) * t, e[2] + (e[5] - e[2]) * t, COMP.powertrain, 0, ey, 0, c, bright));
  };
  const mid = (P.engine ?? "mid") === "mid";
  const ex0 = mid ? rear[0] + 0.03 : front[0] - 0.85;
  const ex1 = mid ? rear[0] + 0.98 : front[0] + 0.3;
  const ey0 = bot((ex0 + ex1) / 2) + 0.1;
  const ey1 = Math.max(ey0 + 0.3, beltH - 0.12);
  boxEdges(ex0, ex1, ey0, ey1, -0.36, 0.36, n(0.006), gold, 1, -0.1);
  const layout = BANKS[opts.engineLayout] ?? BANKS.V8;
  const spacing = (ex1 - ex0 - 0.16) / Math.max(1, layout.perBank - 1);
  const cr = Math.min(0.065, spacing * 0.4);
  for (const bz of layout.banks) {
    for (let k = 0; k < layout.perBank; k++) {
      const cx = ex0 + 0.08 + k * spacing;
      line(n(0.003), (t) => {
        const a = t * Math.PI * 2;
        add(cx + Math.cos(a) * cr, ey1 + 0.04, bz + Math.sin(a) * cr, COMP.powertrain, 0, -0.1, 0, goldS, 1);
      });
    }
  }
  for (let i = 0, c = n(0.04); i < c; i++) add(ex0 + rnd() * (ex1 - ex0), ey0 + rnd() * (ey1 - ey0), (rnd() * 2 - 1) * 0.36, COMP.powertrain, 0, -0.1, 0, amber, 0.2);
  if (opts.hybrid) {
    const bx0 = mid ? ex1 + 0.1 : rear[0] + 0.5;
    const bx1 = mid ? front[0] - 0.47 : ex0 - 0.1;
    const by = bot((bx0 + bx1) / 2) + 0.04;
    boxEdges(bx0, bx1, by, by + 0.1, -0.36, 0.36, n(0.005), ice, 0.8, -0.15);
  }
  // Drive: a shaft to each driven axle, then the axles themselves
  const driven = opts.drivetrain === "AWD" ? WH : [rear];
  for (const [wx, wy] of driven) {
    if (wx > ex0 - 0.2 && wx < ex1 + 0.2) continue;
    const fromX = wx < ex0 ? ex0 : ex1;
    line(n(0.008), (t) => add(fromX + (wx - fromX) * t, wy, 0, COMP.powertrain, 0, -0.1, 0, goldS, 0.6));
  }
  for (const [wx, wy] of WH) line(n(0.01), (t) => add(wx, wy, (t * 2 - 1) * 0.85, COMP.powertrain, 0, -0.1, 0, goldS, 0.7));
  for (const z of [-0.32, -0.18, 0.18, 0.32]) {
    line(n(0.002), (t) => {
      const a = t * Math.PI * 2;
      add(X0 + 0.01, bot(X0) + 0.05 + Math.sin(a) * 0.05, z + Math.cos(a) * 0.05, COMP.powertrain, 0, -0.1, 0, amber, 1);
    });
  }

  const cabinX = s0 + 0.18;
  const anchors: Record<AnchorPart, Anchor> = {
    cabin: seatAnchor ? { p: seatAnchor, e: [0, 1.9, 0] } : { p: [cabinX, top(cabinX) - 0.01, 0], e: [0, 2.05, 0] },
    body: { p: [front[0] + 0.18, top(front[0] + 0.18) - 0.02, 0], e: [0, 1.4, 0] },
    wheels: { p: [front[0], front[1], -(hw(front[0], front[1] + 0.06) + 0.03)], e: [front[0] * 0.15, 0, -1.35] },
    powertrain: { p: [(ex0 + ex1) / 2, ey1 + 0.04, 0], e: [0, -0.1, 0] },
  };

  return {
    count: cmp.length,
    position: new Float32Array(pos),
    explode: new Float32Array(ex),
    scatter: new Float32Array(sc),
    color: new Float32Array(col),
    comp: new Float32Array(cmp),
    rnd: new Float32Array(rn),
    bright: new Float32Array(br),
    anchors,
    lamp: [X1 - 0.16, headY + 0.01, 0.68 * lampK],
    nose: X1,
  };
}

/** Build a car with about `target` particles (two passes to calibrate N). */
export function buildCarWithCount(opts: CarBuildOptions, target: number): CarBuild {
  let N = target * 0.62;
  let car = buildCar(opts, N);
  for (let pass = 0; pass < 2 && Math.abs(car.count - target) / target > 0.04; pass++) {
    N *= target / car.count;
    car = buildCar(opts, N);
  }
  return car;
}
