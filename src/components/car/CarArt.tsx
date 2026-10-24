import Image from "next/image";
import clsx from "clsx";
import type { Car } from "@/content/types";
import { carMedia, imageStatus } from "@/content/car-media";
import { profiles, smoothPath } from "@/scene/car/profiles";

type View = "hero" | "side" | "card";

interface Props {
  car: Car;
  view?: View;
  className?: string;
  /** Load eagerly (above-the-fold hero). */
  priority?: boolean;
  sizes?: string;
  /** Mirror for a car facing left. Never mirror real photos (badges would read backwards). */
  alt?: string;
  /** Show the small "AI image" tag on AI-generated pictures (plan 03 §3.4). Default on. */
  tag?: boolean;
}

/**
 * The car's picture. Uses the real image for the slot when one exists (AI image or photo),
 * otherwise a gold line-art placeholder drawn from the car's body profile.
 */
export function CarArt({ car, view = "card", className, priority, sizes = "(min-width: 1024px) 33vw, 100vw", alt, tag = true }: Props) {
  const media = carMedia[car.slug];
  const src = (view === "hero" ? car.images.hero ?? media?.hero : view === "side" ? car.images.side ?? media?.side ?? media?.hero : car.images.card ?? media?.card ?? media?.hero) ?? undefined;
  const status = imageStatus(car);
  const label = alt ?? `${car.name}${status === "placeholder" ? ", illustration" : status.startsWith("ai") ? ", AI image" : ""}`;

  if (src) {
    return (
      <div className={clsx("relative overflow-hidden bg-bg", className)}>
        <Image src={src} alt={label} fill sizes={sizes} priority={priority} className="object-cover" />
        {tag && status.startsWith("ai") && (
          <span aria-hidden="true" className="absolute bottom-2 start-2 rounded-full bg-deep/85 px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-fg">AI image</span>
        )}
      </div>
    );
  }
  return <LineArt car={car} className={className} label={label} />;
}

function interp(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

function LineArt({ car, className, label }: { car: Car; className?: string; label: string }) {
  const p = profiles[car.body];
  const id = `art-${car.slug}`;
  const tail = p.top[0][0], nose = p.top[p.top.length - 1][0];
  const bottomRev = [...p.bottom].reverse() as [number, number][];
  const body = `${smoothPath(p.top)} L${p.bottom[p.bottom.length - 1][0]},${p.bottom[p.bottom.length - 1][1]} ${smoothPath(bottomRev, false).replace(/^L[^C]*/, "")} Z`;
  const glassTop: [number, number][] = [];
  for (let x = p.glass.from; x <= p.glass.to + 1e-6; x += (p.glass.to - p.glass.from) / 12) glassTop.push([x, Math.max(p.glass.belt + 0.02, interp(p.top, x) - 0.05)]);
  const glass = `M${p.glass.from},${p.glass.belt} ${smoothPath(glassTop, false)} L${p.glass.to},${p.glass.belt} Z`;
  const paint = car.paint.hex;

  return (
    <div className={clsx("relative overflow-hidden", className)} role="img" aria-label={label}>
      <svg viewBox="-3.1 -2.25 6.2 2.75" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-bg`} cx="50%" cy="78%" r="70%">
            <stop offset="0%" stopColor={paint} stopOpacity="0.22" />
            <stop offset="45%" stopColor="#b8975a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#183333" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#b8975a" />
            <stop offset="45%" stopColor="#f6ebcf" />
            <stop offset="100%" stopColor="#f8f0dc" />
          </linearGradient>
          <linearGradient id={`${id}-fill`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={paint} stopOpacity="0.05" />
            <stop offset="100%" stopColor={paint} stopOpacity="0.2" />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <path d={body} />
          </clipPath>
        </defs>
        <rect x="-3.1" y="-2.25" width="6.2" height="2.75" fill={`url(#${id}-bg)`} />
        <g transform="scale(1,-1)">
          {/* floor */}
          <ellipse cx="0" cy="-0.02" rx={(nose - tail) * 0.56} ry="0.07" fill="#000" opacity="0.7" />
          <line x1={tail - 0.6} y1="0" x2={nose + 0.6} y2="0" stroke="#4a7372" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {/* body */}
          <path d={body} fill={`url(#${id}-fill)`} stroke={`url(#${id}-gold)`} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <g clipPath={`url(#${id}-clip)`}>
            <path d={glass} fill="rgba(165,216,220,0.10)" stroke="#a5d8dc" strokeOpacity="0.7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1={tail} y1={p.glass.belt} x2={nose} y2={p.glass.belt - 0.12} stroke="#ebdab0" strokeOpacity="0.6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <line x1={tail} y1={interp(p.bottom, 0) + 0.12} x2={nose} y2={interp(p.bottom, 0) + 0.1} stroke="#ebdab0" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </g>
          {/* lamps */}
          <line x1={nose - 0.02} y1={interp(p.top, nose - 0.25) - 0.08} x2={nose - 0.3} y2={interp(p.top, nose - 0.3) - 0.04} stroke="#f4fbfb" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <line x1={tail + 0.02} y1={interp(p.top, tail + 0.2) - 0.12} x2={tail + 0.22} y2={interp(p.top, tail + 0.22) - 0.08} stroke="#fca5a5" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {p.wing && <path d={`M${tail + 0.05},${interp(p.top, tail + 0.3) + 0.2} L${tail + 0.38},${interp(p.top, tail + 0.3) + 0.22}`} stroke={`url(#${id}-gold)`} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
          {/* wheels */}
          {p.wheels.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r + 0.06} fill="#183333" />
              <circle cx={x} cy={y} r={r} fill="#183333" stroke="#e3d9c8" strokeOpacity="0.8" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              <circle cx={x} cy={y} r={r * 0.74} fill="none" stroke="#f6ebcf" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              {Array.from({ length: 10 }, (_, k) => {
                const a = (k / 10) * Math.PI * 2;
                return <line key={k} x1={x + Math.cos(a) * r * 0.2} y1={y + Math.sin(a) * r * 0.2} x2={x + Math.cos(a) * r * 0.72} y2={y + Math.sin(a) * r * 0.72} stroke="#ebdab0" strokeOpacity="0.8" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />;
              })}
              <circle cx={x} cy={y} r={r * 0.16} fill="#b8975a" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
