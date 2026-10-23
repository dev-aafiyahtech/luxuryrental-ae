import clsx from "clsx";
import { getZone } from "@/content/zones";
import { formatAED } from "@/lib/format";

// Schematic delivery map (no map embed: no weight, no third-party cookies). North is up and
// the coast runs south-west to north-east. Positions are approximate and not to scale.
// Fees are read from zones.ts. Labels repeat in the list below the map for small screens
// and screen readers.

type Focus = "all" | "dxb" | "dso";

const fee = (slug: string) => {
  const z = getZone(slug);
  if (!z) return "";
  return z.fee === null ? "On request" : z.fee === 0 ? "Free" : formatAED(z.fee);
};

export function DeliveryMap({ focus = "all", className, id = "map" }: { focus?: Focus; className?: string; id?: string }) {
  const dubaiFee = getZone("dubai");
  const places = [
    { key: "marina", x: 232, y: 352, label: "Dubai Marina, JBR", sub: "Dubai zone" },
    { key: "palm", x: 300, y: 288, label: "Palm Jumeirah", sub: "Dubai zone", anchor: "end" as const, dx: -28 },
    { key: "downtown", x: 452, y: 262, label: "Downtown, DIFC", sub: "Dubai zone" },
    { key: "dxb", x: 606, y: 168, label: "DXB airport", sub: `T1, T2, T3 · ${fee("dxb")}`, airport: true },
    { key: "dwc", x: 150, y: 470, label: "DWC airport", sub: fee("dwc"), airport: true },
  ];
  const exits = [
    { key: "sharjah", x: 770, y: 66, label: "Sharjah, Ajman", sub: fee("sharjah-ajman"), rot: -35 },
    { key: "hatta", x: 778, y: 430, label: "Hatta", sub: fee("hatta"), rot: 0 },
    { key: "abu-dhabi", x: 34, y: 556, label: "Abu Dhabi", sub: fee("abu-dhabi"), rot: 150 },
  ];
  const dso = { x: 600, y: 360 };
  const highlight = (key: string) => focus === "all" || focus === key;
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <figure className={clsx("grid gap-4", className)}>
      <div className="relative overflow-hidden rounded-[var(--radius-panel)] border border-line bg-card [box-shadow:var(--shadow-edge)]">
        <svg viewBox="0 0 800 600" role="img" aria-labelledby={`${titleId} ${descId}`} className="h-auto w-full">
          <title id={titleId}>Schematic map of our delivery zones</title>
          <desc id={descId}>
            Our base is in Dubai Silicon Oasis. We deliver across Dubai, including Dubai Marina, Palm Jumeirah and Downtown, to DXB and DWC airports, and to Sharjah, Ajman, Hatta and Abu Dhabi. Not to scale.
          </desc>
          <defs>
            <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a5d8dc" stopOpacity="0.10" />
              <stop offset="1" stopColor="#a5d8dc" stopOpacity="0.02" />
            </linearGradient>
            <radialGradient id={`${id}-glow`}>
              <stop offset="0" stopColor="#f6ebcf" stopOpacity="0.45" />
              <stop offset="1" stopColor="#f6ebcf" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${id}-grid`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="#f4eade" strokeOpacity="0.04" />
            </pattern>
            <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="#ebdab0" />
            </marker>
          </defs>

          <rect width="800" height="600" fill={`url(#${id}-grid)`} />
          {/* Sea (north-west of the coast) */}
          <path d="M0 0H800V0L812 36C700 92 640 140 560 186S420 262 360 296 200 380 -10 470Z" fill={`url(#${id}-sea)`} />
          <path d="M812 36C700 92 640 140 560 186S420 262 360 296 200 380 -10 470" fill="none" stroke="#a5d8dc" strokeOpacity="0.45" strokeWidth="1.5" />
          <text x="150" y="150" className="fill-ice/50" fontSize="15" letterSpacing="5" style={{ textTransform: "uppercase" }}>Arabian Gulf</text>

          {/* Palm Jumeirah, schematic */}
          <g stroke="#a5d8dc" strokeOpacity="0.55" fill="none" strokeWidth="1.4">
            <path d="M318 302L300 270" />
            <path d="M276 268a26 26 0 1 0 46 -14" />
          </g>

          {/* Dubai zone */}
          <path
            d="M196 392C250 360 330 316 420 270S560 190 640 140L700 196C690 300 680 380 640 420C540 440 420 430 300 430C250 430 210 420 196 392Z"
            fill="#ebdab0" fillOpacity={focus === "all" ? 0.07 : 0.04} stroke="#ebdab0" strokeOpacity="0.5" strokeDasharray="6 6"
          />
          <text x="470" y="412" className="fill-accent" fontSize="13" fontWeight="600" letterSpacing="3" style={{ textTransform: "uppercase" }}>
            Dubai · free from {dubaiFee?.freeFromDays} days
          </text>

          {/* Routes from the base */}
          <g fill="none" stroke="#ebdab0" strokeWidth="1.4" strokeLinecap="round">
            {places.map((p) => (
              <path key={p.key} d={`M${dso.x} ${dso.y}Q${(dso.x + p.x) / 2} ${Math.min(dso.y, p.y) - 40} ${p.x} ${p.y}`} strokeOpacity={highlight(p.key) ? 0.75 : 0.22} strokeDasharray={highlight(p.key) ? undefined : "3 6"} />
            ))}
            {exits.map((e) => (
              <path key={e.key} d={`M${dso.x} ${dso.y}L${e.x} ${e.y}`} strokeOpacity={focus === "all" ? 0.4 : 0.18} strokeDasharray="2 7" markerEnd={`url(#${id}-arrow)`} />
            ))}
          </g>

          {/* Places */}
          {places.map((p) => {
            const on = highlight(p.key);
            const anchor = p.anchor ?? "start";
            const tx = p.x + (p.dx ?? 14);
            return (
              <g key={p.key} opacity={on ? 1 : 0.55}>
                {p.airport ? (
                  <rect x={p.x - 6} y={p.y - 6} width="12" height="12" rx="2" transform={`rotate(45 ${p.x} ${p.y})`} fill={on ? "#f6ebcf" : "#c3cec6"} />
                ) : (
                  <circle cx={p.x} cy={p.y} r="5" fill={on ? "#f4eade" : "#c3cec6"} />
                )}
                <text x={tx} y={p.y - 4} textAnchor={anchor} className="fill-fg" fontSize="17" fontWeight="600">{p.label}</text>
                <text x={tx} y={p.y + 16} textAnchor={anchor} className="fill-muted" fontSize="14">{p.sub}</text>
              </g>
            );
          })}

          {/* Exits to other emirates */}
          {exits.map((e) => (
            <g key={e.key} opacity={focus === "all" ? 1 : 0.6}>
              <text x={e.key === "abu-dhabi" ? e.x + 4 : e.x - 4} y={e.key === "sharjah" ? e.y + 40 : e.key === "hatta" ? e.y + 30 : e.y - 26} textAnchor={e.key === "abu-dhabi" ? "start" : "end"} className="fill-fg" fontSize="16" fontWeight="600">{e.label}</text>
              <text x={e.key === "abu-dhabi" ? e.x + 4 : e.x - 4} y={e.key === "sharjah" ? e.y + 58 : e.key === "hatta" ? e.y + 48 : e.y - 8} textAnchor={e.key === "abu-dhabi" ? "start" : "end"} className="fill-muted" fontSize="14">{e.sub} each way</text>
            </g>
          ))}

          {/* Base */}
          <circle cx={dso.x} cy={dso.y} r="46" fill={`url(#${id}-glow)`} />
          <circle cx={dso.x} cy={dso.y} r="11" fill="#183333" stroke="#f6ebcf" strokeWidth="2.5" />
          <circle cx={dso.x} cy={dso.y} r="4.5" fill="#f6ebcf" />
          <text x={dso.x + 20} y={dso.y + 2} className="fill-accent-hover" fontSize="17" fontWeight="700">Our base</text>
          <text x={dso.x + 20} y={dso.y + 22} className="fill-champagne" fontSize="14">Dubai Silicon Oasis · {fee("dso")}</text>

          {/* North arrow */}
          <g transform="translate(748 520)" className="fill-muted">
            <path d="M0 -26L8 0H-8Z" fill="#c3cec6" />
            <text y="20" textAnchor="middle" fontSize="13" fontWeight="600">N</text>
          </g>
        </svg>
      </div>
      <figcaption className="fine">Schematic map, not to scale. Fees are per handover, each way, and include VAT.</figcaption>
    </figure>
  );
}
