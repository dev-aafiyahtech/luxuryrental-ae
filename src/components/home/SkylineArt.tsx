import clsx from "clsx";
import { mulberry } from "@/scene/math";
import { BURJ_M, CORE, EDGE_LEFT, EDGE_RIGHT, FLARE, PINNACLE, PODIUM, WING_TOP, edgeAt } from "@/scene/burjProfile";

// The homepage's Dubai skyline as inline SVG, for visitors without the 3D stage (static tier,
// no WebGL, no JavaScript) and while the stage loads. Three layers: the city band along the
// bottom, the Burj Khalifa on the end side of the screen beside the chapter 1 copy, and the
// Burj Al Arab (where the 3D descent lands) nearer the edge. Positioned with logical CSS, so in
// Arabic they stand on the left; the drawings themselves are never mirrored. The Burj Khalifa
// is drawn from the same massing as the 3D tower (scene/burjProfile.ts, no three.js). Colours
// come from the theme tokens. Decorative only.

/** Rounded to 0.1, so server and browser print the same path (their Math.pow can differ in the last bit). */
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Burj Khalifa elevation in metres (viewBox x −80…80, y 0 at the tip): the stepped silhouette. */
const burj = (() => {
  const breaks = new Set<number>([0, PODIUM.top, BURJ_M, CORE.end]);
  for (const [h0, h1] of FLARE) breaks.add(h0).add(h1);
  for (const [h] of [...EDGE_LEFT, ...EDGE_RIGHT, ...PINNACLE]) breaks.add(h);
  breaks.add(WING_TOP.left).add(WING_TOP.right);
  const hs = [...breaks].sort((a, b) => a - b);
  const side = (s: "left" | "right") => {
    const pts: string[] = [];
    for (let i = 0; i < hs.length - 1; i++) {
      const w = edgeAt(s, hs[i]) * (s === "left" ? -1 : 1);
      pts.push(`${r1(w)},${r1(BURJ_M - hs[i])}`, `${r1(w)},${r1(BURJ_M - hs[i + 1])}`);
    }
    return pts;
  };
  const right = side("right");
  const left = side("left").reverse();
  // The needle: the last tier narrows to a point
  return `M${right.join(" L")} L0,0 L${left.join(" L")} Z`;
})();

/** Burj Al Arab in profile, in metres (viewBox x −90…60, y 0 at the mast tip): sail, mast, helipad. */
const baa = (() => {
  const top = 321, Y = (h: number) => r1(top - h);
  const front: string[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, h = 7 + t * 193;
    const d = 66 * (1 - Math.pow(t, 2.3)) * (0.86 + 0.5 * t * (1 - t)) + 5;
    front.push(`${r1(-d)},${Y(h)}`);
  }
  const sail = `M0,${Y(7)} L${front.join(" L")} L0,${Y(206)} Z`;
  const mast = `M-3.4,${Y(200)} L-1.7,${Y(262)} L-0.2,${Y(321)} L0.2,${Y(321)} L1.7,${Y(262)} L3.4,${Y(200)} Z`;
  const pad = `M5,${Y(208)} L33,${Y(208)} L33,${Y(211)} L5,${Y(211)} Z`;
  const struts = `M8,${Y(208)} L0,${Y(186)} M20,${Y(208)} L2,${Y(176)}`;
  const island = `M-86,${Y(0)} L-80,${Y(7)} L40,${Y(7)} L46,${Y(0)} Z`;
  // The exoskeleton's X braces across the side of the sail (clipped to it)
  const braces = Array.from({ length: 9 }, (_, i) => -280 + i * 34)
    .map((x) => `M${x},${Y(7)} l200,-200 M${x},${Y(207)} l200,200`)
    .join(" ");
  return { sail, mast, pad, struts, island, braces, front: `M${front.join(" L")}` };
})();

/** City band (viewBox 0 0 1440 360): towers across the width, a few crowns and spires, Emirates Towers. */
const band = (() => {
  const r = mulberry(11);
  const shapes: string[] = [];
  const add = (d: string) => shapes.push(d.replace(/\d+\.\d+/g, (n) => r1(Number(n)).toString()));
  let x = 0;
  while (x < 1440) {
    const w = 18 + r() * 26;
    const near = Math.abs(x - 720) / 720;
    const h = 40 + Math.pow(r(), 1.6) * 150 * (1 - 0.45 * near);
    const top = 360 - h;
    const crown = r();
    if (crown < 0.14) add(`M${x},360 V${top} L${x + w / 2},${top - w * 0.9} L${x + w},${top} V360 Z`);
    else if (crown < 0.26) add(`M${x},360 V${top} H${x + w * 0.42} V${top - 34} H${x + w * 0.58} V${top} H${x + w} V360 Z`);
    else add(`M${x},360 V${top} H${x + w} V360 Z`);
    x += w + 2 + r() * 10;
  }
  // Emirates Towers: two triangular towers with roofs sloping to a point
  add("M1186,360 V168 L1214,118 V360 Z");
  add("M1222,360 V196 L1246,152 V360 Z");
  return shapes.join(" ");
})();

export function SkylineBand({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" className={clsx("block", className)} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="sky-win" width="9" height="11" patternUnits="userSpaceOnUse">
          <rect x="2" y="3" width="2" height="3" className="fill-accent" opacity="0.5" />
        </pattern>
        <radialGradient id="sky-haze" cx="50%" cy="100%" r="70%">
          <stop offset="0%" className="[stop-color:var(--color-amber)]" stopOpacity="0.32" />
          <stop offset="100%" className="[stop-color:var(--color-amber)]" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="120" width="1440" height="240" fill="url(#sky-haze)" />
      <path d={band} className="fill-deep stroke-line" strokeWidth="1" />
      <path d={band} fill="url(#sky-win)" opacity="0.55" />
    </svg>
  );
}

export function SkylineBurj({ className }: { className?: string }) {
  return (
    <svg viewBox="-80 -14 160 842" preserveAspectRatio="xMidYMax meet" className={clsx("block aspect-[160/842]", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="burj-glow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" className="[stop-color:var(--color-amber)]" stopOpacity="0.4" />
          <stop offset="45%" className="[stop-color:var(--color-amber)]" stopOpacity="0.06" />
          <stop offset="100%" className="[stop-color:var(--color-amber)]" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={burj} className="fill-deep" />
      <path d={burj} fill="url(#burj-glow)" />
      <path d={burj} className="fill-none stroke-accent" strokeWidth="1.1" opacity="0.85" />
      <circle cx="0" cy="-3" r="2.6" className="fill-danger" />
    </svg>
  );
}

export function SkylineBurjAlArab({ className }: { className?: string }) {
  return (
    <svg viewBox="-90 -6 152 330" preserveAspectRatio="xMidYMax meet" className={clsx("block aspect-[152/330]", className)} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="baa-sail">
          <path d={baa.sail} />
        </clipPath>
      </defs>
      <path d={baa.island} className="fill-deep stroke-accent" strokeWidth="0.8" opacity="0.9" />
      <path d={baa.sail} className="fill-deep" />
      <path d={baa.braces} clipPath="url(#baa-sail)" className="fill-none stroke-accent" strokeWidth="0.9" opacity="0.5" />
      <path d={baa.front} className="fill-none stroke-champagne" strokeWidth="1.6" opacity="0.9" />
      <path d={baa.sail} className="fill-none stroke-accent" strokeWidth="0.9" opacity="0.8" />
      <path d={baa.mast} className="fill-champagne" opacity="0.85" />
      <path d={baa.struts} className="fill-none stroke-accent" strokeWidth="0.8" opacity="0.7" />
      <path d={baa.pad} className="fill-deep stroke-accent" strokeWidth="0.9" />
      <circle cx="0" cy="-1.5" r="2" className="fill-danger" />
    </svg>
  );
}
