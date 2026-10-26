import clsx from "clsx";
import { mulberry } from "@/scene/math";

// The homepage's Dubai skyline as inline SVG, for visitors without the 3D stage (static tier,
// no WebGL, no JavaScript) and while the stage loads. Two layers: the city band along the
// bottom, and the Burj Khalifa on the end side of the screen, beside the chapter 1 copy.
// Positioned with logical CSS, so in Arabic the Burj stands on the left; the drawings
// themselves are never mirrored. Colours come from the theme tokens. Decorative only.

/** Burj Khalifa elevation (viewBox 0 0 160 1000): staggered setbacks, top section, spire. */
const burjPath = (() => {
  const k = 1000 / 364; // scene units → drawing units, same massing as the 3D tower
  const Y = (y: number) => (1000 - y * k).toFixed(1);
  const reach = (y: number) => 6.4 + 23.6 * Math.pow(Math.max(0, 1 - y / 236), 1.3);
  const steps = Array.from({ length: 24 }, (_, i) => 30 + (i * 196) / 23);
  // The two sides step back on alternate setbacks (the spiral, seen side-on).
  const side = (phase: number) => {
    const pts: [number, number][] = [[0, reach(0)]];
    let w = reach(0);
    steps.forEach((y, i) => {
      if (i % 2 !== phase) return;
      pts.push([y, w]);
      w = reach(y + 10);
      pts.push([y, w]);
    });
    pts.push([236, Math.max(w, 7.6)]);
    for (const [y0, y1, r] of [[236, 247, 8.6], [247, 256, 6.8], [256, 263, 5.2]]) pts.push([y0, r], [y1, r]);
    pts.push([263, 3.0], [292, 2.0], [326, 0.95], [364, 0.1]);
    return pts;
  };
  const right = side(1).map(([y, w]) => `${(80 + w * 0.62 * k).toFixed(1)},${Y(y)}`);
  const left = side(0).map(([y, w]) => `${(80 - w * 0.62 * k).toFixed(1)},${Y(y)}`).reverse();
  return `M${right.join(" L")} L${left.join(" L")} Z`;
})();

/** Setback lines across the tower, for the lit terraces. */
const burjSetbacks = Array.from({ length: 24 }, (_, i) => 30 + (i * 196) / 23).map((y) => Math.round(10 * (1000 - y * (1000 / 364))) / 10);

/** City band (viewBox 0 0 1440 360): towers, Emirates Towers, Cayan, the Burj Al Arab sail. */
const band = (() => {
  const r = mulberry(11);
  const shapes: string[] = [];
  // Rounded, so server and browser print the same path (their Math.pow can differ in the last bit).
  const add = (d: string) => shapes.push(d.replace(/\d+\.\d+/g, (n) => (Math.round(Number(n) * 10) / 10).toString()));
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
  // Cayan Tower's twist
  add("M318,360 V178 C326,174 340,174 348,178 V360 Z");
  // The Burj Al Arab on the coast, far off: the sail and its mast
  add("M88,360 V250 L90,218 C108,236 120,280 122,336 L124,360 Z");
  add("M89.2,222 L90.2,196 L91.2,222 Z");
  return shapes.join(" ");
})();

const cayanBands = Array.from({ length: 9 }, (_, i) => 186 + i * 19);

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
      {cayanBands.map((y) => (
        <path key={y} d={`M318,${y + 12} L348,${y}`} className="stroke-accent" strokeWidth="1" opacity="0.35" />
      ))}
      <path d="M90,218 C108,236 120,280 122,336" className="fill-none stroke-champagne" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

export function SkylineBurj({ className }: { className?: string }) {
  return (
    <svg viewBox="0 -12 160 1012" preserveAspectRatio="xMidYMax meet" className={clsx("block aspect-[160/1012]", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="burj-glow" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" className="[stop-color:var(--color-amber)]" stopOpacity="0.4" />
          <stop offset="45%" className="[stop-color:var(--color-amber)]" stopOpacity="0.06" />
          <stop offset="100%" className="[stop-color:var(--color-amber)]" stopOpacity="0" />
        </linearGradient>
        <clipPath id="burj-clip">
          <path d={burjPath} />
        </clipPath>
      </defs>
      <path d={burjPath} className="fill-deep" />
      <path d={burjPath} fill="url(#burj-glow)" />
      <g clipPath="url(#burj-clip)" className="stroke-accent" strokeWidth="1" opacity="0.35">
        {burjSetbacks.map((y) => (
          <line key={y} x1="0" x2="160" y1={y} y2={y} />
        ))}
        <line x1="80" x2="80" y1="0" y2="1000" strokeWidth="1.6" />
      </g>
      <path d={burjPath} className="fill-none stroke-accent" strokeWidth="1.4" opacity="0.8" />
      <circle cx="80" cy="0" r="3.2" className="fill-danger" />
    </svg>
  );
}
