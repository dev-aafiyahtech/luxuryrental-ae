"use client";

import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState } from "react";

/**
 * Mobile-only sticky bar on car pages ("From AED 3,500 / day · Reserve"). It replaces the
 * generic dock there, and slides away while the inline booking module (`watchId`) is on
 * screen so the two never compete. Server-rendered visible, so it works before hydration.
 */
export function CarStickyBar({ price, note, ctaLabel, ctaHref, watchId, external }: { price: string; note?: string; ctaLabel: string; ctaHref: string; watchId?: string; external?: boolean }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = watchId ? document.getElementById(watchId) : null;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.15 });
    io.observe(target);
    return () => io.disconnect();
  }, [watchId]);

  const cta = "btn btn-primary btn-sm flex-none px-5";
  return (
    <div
      className={clsx(
        "glass fixed inset-x-0 bottom-0 z-[var(--z-dock)] flex items-center justify-between gap-3 rounded-b-none rounded-t-[24px] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden",
        hidden && "pointer-events-none translate-y-full",
      )}
      aria-hidden={hidden || undefined}
    >
      <p className="grid min-w-0 gap-0.5">
        {note && <span className="truncate text-[11px] uppercase tracking-[0.08em] text-muted">{note}</span>}
        <span className="truncate text-[16px] font-semibold tabular">{price}</span>
      </p>
      {external ? (
        <a href={ctaHref} target="_blank" rel="noopener noreferrer" className={cta} tabIndex={hidden ? -1 : undefined}>{ctaLabel}</a>
      ) : (
        <Link href={ctaHref} className={cta} tabIndex={hidden ? -1 : undefined}>{ctaLabel}</Link>
      )}
    </div>
  );
}
