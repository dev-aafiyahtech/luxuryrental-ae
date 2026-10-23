"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReserveCard } from "@/components/booking/ReserveCard";
import { Dock } from "@/components/booking/Dock";
import { useHome } from "./HomeExperience";

const noop = () => () => {};
/** False during SSR and hydration, true afterwards (no effect + setState needed). */
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/**
 * "Check availability" in chapter 1. Before hydration it is a plain link to the fleet;
 * afterwards a button that opens and focuses the booking dock.
 */
export function CheckAvailability({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const { openDock } = useHome();
  const router = useRouter();
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <a className="btn btn-primary" href={fallbackHref}>
        {label}
      </a>
    );
  }
  return (
    <button type="button" className="btn btn-primary" onClick={() => openDock() || router.push(fallbackHref)}>
      {label}
    </button>
  );
}

/** Chapter 4: the reserve card for the car chosen in the Kinetic Sculpture tabs. */
export function ReserveSlot({ eyebrow }: { eyebrow: string }) {
  const { cars, selected, reserveRef } = useHome();
  const car = cars[selected] ?? cars[0];
  return (
    <div ref={reserveRef} data-reserve-card="" className="w-full min-w-0">
      <ReserveCard car={car} eyebrow={eyebrow} />
    </div>
  );
}

/** The booking dock; hidden while the chapter 4 reserve card is at least 40% in view. */
export function HomeDock() {
  const { reserveVisible } = useHome();
  return (
    <div data-home-dock="">
      <Dock hidden={reserveVisible} />
    </div>
  );
}

/** Horizontal fleet strip with previous/next buttons (no drag needed, WCAG 2.5.7). */
export function FleetStrip({ children, labels }: { children: ReactNode; labels: { region: string; prev: string; next: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft); // negative in RTL
      setEdges({ start: pos <= 4, end: pos >= max - 4 });
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * Math.max(280, el.clientWidth * 0.85), behavior: reduced ? "auto" : "smooth" });
  };

  const btn = "inline-flex size-11 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line";
  return (
    <div className="grid gap-4">
      <div className="flex justify-end gap-2">
        <button type="button" className={btn} onClick={() => page(-1)} disabled={edges.start} aria-label={labels.prev}>
          <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
        <button type="button" className={btn} onClick={() => page(1)} disabled={edges.end} aria-label={labels.next}>
          <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={ref}
        role="region"
        aria-label={labels.region}
        tabIndex={0}
        data-lenis-prevent-horizontal=""
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-6 pt-2 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6"
      >
        {children}
      </div>
    </div>
  );
}
