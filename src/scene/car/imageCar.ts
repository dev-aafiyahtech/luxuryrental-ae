import type { CarSpecs } from "@/content/types";
import { mulberry } from "../math";
import type { Anchor, AnchorPart, CarBuild } from "./buildCar";
import { COMP } from "./buildCar";
import type { ParticleSet } from "./particleSet";
import { addPowertrain, palette, type RGB } from "./powertrain";

// The light-sculpture car sampled from the car's own side image (plan 03 §3.1): the points,
// their image colour, part and brightness come from tools/sample-car-particles.mjs; this adds
// the explode offsets (cut for a side-on camera, as in §3.1: the body stays and fades to its
// line-work to show the powertrain, the cabin rises, the wheels come out towards the lens and
// the lamps slide outward),
// the loose dust the car forms from, colour by part (D-13), and the powertrain schematic drawn
// from the car's data. Same output contract as buildCar(), so the shaders don't change.

export interface ImageCarOptions {
  engine: "mid" | "front";
  engineLayout: CarSpecs["engineLayout"];
  hybrid: boolean;
  drivetrain: CarSpecs["drivetrain"];
  seed: number;
}

/** Explode offsets per part for the side-on Kinetic Sculpture: [x, y, z-per-side]. */
const EXPLODE: Record<number, [number, number, number]> = {
  [COMP.body]: [0, 0.3, 0.12],
  [COMP.cabin]: [0, 1.05, 0.06],
  [COMP.head]: [0.5, 0.36, 0.3],
  [COMP.tail]: [-0.45, 0.36, 0.3],
};
const WHEEL_OUT: [number, number, number] = [0.32, -0.02, 0.95];

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (a: number, b: number, v: number) => {
  const x = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/** Colour by part, brightest on the image's edges and highlights. */
function partColour(comp: number, b: number): RGB {
  const { champ, gold, goldS, ice, amber, white, red } = palette;
  switch (comp) {
    case COMP.cabin:
      return mix(ice, [0.86, 0.97, 0.97], smooth(0.55, 1, b));
    case COMP.wheels:
      return b > 0.55 ? goldS : mix(amber, champ, smooth(0.15, 0.55, b));
    case COMP.head:
      return white;
    case COMP.tail:
      return red;
    default:
      return mix(champ, gold, smooth(0.45, 0.95, b));
  }
}

/** The image colour, lifted so dark paint still shows as light: hue kept, near-blacks go neutral. */
function liftPaint(r8: number, g8: number, b8: number): RGB {
  const r = r8 / 255, g = g8 / 255, b = b8 / 255;
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const target = 0.42 + 0.5 * l;
  const k = target / Math.max(l, 0.04);
  const chroma = smooth(0.08, 0.3, Math.max(r, g, b) - Math.min(r, g, b));
  return [
    Math.min(1, target + (r * k - target) * chroma),
    Math.min(1, target + (g * k - target) * chroma),
    Math.min(1, target + (b * k - target) * chroma),
  ];
}

export function buildCarFromImage(set: ParticleSet, opts: ImageCarOptions, target: number): CarBuild {
  const m = set.meta;
  const rnd = mulberry(opts.seed);
  const pos: number[] = [], ex: number[] = [], sc: number[] = [], col: number[] = [], pnt: number[] = [], cmp: number[] = [], rn: number[] = [], br: number[] = [];
  const j = (s: number) => (rnd() - 0.5) * s;
  const scatter = () => {
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 10;
    sc.push(Math.cos(a) * r, 0.3 + rnd() * 7, Math.sin(a) * r);
  };
  const wheels = m.wheels;
  const [rearW, frontW] = [wheels[0], wheels[wheels.length - 1]];

  // Powertrain first (a fixed share), so the image fills the rest of the budget.
  const ptStart = pos.length;
  const powerAnchor = addPowertrain(
    (x, y, z, comp, exX, exY, exZ, c, bright) => {
      pos.push(x, y, z);
      ex.push(exX + j(0.03), exY + j(0.03), exZ + j(0.03));
      scatter();
      col.push(c[0], c[1], c[2]);
      pnt.push(c[0], c[1], c[2]);
      cmp.push(comp);
      rn.push(rnd());
      br.push(bright);
    },
    (k) => Math.max(6, Math.round(target * 0.42 * k)),
    rnd,
    { engine: opts.engine, wheels, bottom: () => m.sill, belt: m.belt, tail: m.tail, axle: Math.max(0.5, m.wheelZ - 0.05) },
    opts,
  );
  const ptCount = (pos.length - ptStart) / 3;

  const n = Math.max(0, Math.min(set.count, target - ptCount));
  for (let i = 0; i < n; i++) {
    const x = set.pos[i * 3] / 1000, y = set.pos[i * 3 + 1] / 1000, z = set.pos[i * 3 + 2] / 1000;
    const comp = set.part[i];
    const b = set.bright[i] / 255;
    const side = z >= 0 ? 1 : -1;
    pos.push(x, y, z);
    if (comp === COMP.wheels) {
      const wx = Math.abs(x - rearW[0]) < Math.abs(x - frontW[0]) ? rearW[0] : frontW[0];
      ex.push(Math.sign(wx) * WHEEL_OUT[0] + j(0.03), WHEEL_OUT[1] + j(0.03), side * WHEEL_OUT[2] + j(0.03));
    } else {
      const e = EXPLODE[comp] ?? EXPLODE[COMP.body];
      ex.push(e[0] + j(0.03), e[1] + j(0.03), side * e[2] + j(0.03));
    }
    scatter();
    const c = partColour(comp, b);
    col.push(c[0], c[1], c[2]);
    const p = liftPaint(set.col[i * 3], set.col[i * 3 + 1], set.col[i * 3 + 2]);
    pnt.push(p[0], p[1], p[2]);
    cmp.push(comp);
    rn.push(rnd());
    br.push(b);
  }

  // Callout anchors on the outline, and the headlights
  const roof = (x: number) => {
    const r = m.roofline;
    if (x <= r[0][0]) return r[0][1];
    for (let k = 1; k < r.length; k++) {
      if (x <= r[k][0]) {
        const t = (x - r[k - 1][0]) / Math.max(1e-6, r[k][0] - r[k - 1][0]);
        return r[k - 1][1] + (r[k][1] - r[k - 1][1]) * t;
      }
    }
    return r[r.length - 1][1];
  };
  const cabinX = (m.glass[0] + m.glass[1]) / 2;
  const bodyX = Math.min(m.nose - 0.3, frontW[0] + 0.2);
  const anchors: Record<AnchorPart, Anchor> = {
    cabin: { p: [cabinX, roof(cabinX) - 0.01, 0], e: [0, EXPLODE[COMP.cabin][1], 0] },
    body: { p: [bodyX, roof(bodyX) - 0.02, 0], e: [0, EXPLODE[COMP.body][1], 0] },
    wheels: { p: [frontW[0], frontW[1], m.wheelZ], e: WHEEL_OUT },
    powertrain: { p: powerAnchor, e: [0, -0.1, 0] },
  };
  const lamp: [number, number, number] = m.head ?? [m.nose - 0.16, m.sill + 0.55 * (m.height - m.sill), 0.62 * (m.width / 2)];

  return {
    count: cmp.length,
    position: new Float32Array(pos),
    explode: new Float32Array(ex),
    scatter: new Float32Array(sc),
    color: new Float32Array(col),
    paint: new Float32Array(pnt),
    comp: new Float32Array(cmp),
    rnd: new Float32Array(rn),
    bright: new Float32Array(br),
    anchors,
    lamp,
    nose: m.nose,
    length: m.length,
    height: m.height,
    source: "image",
  };
}
