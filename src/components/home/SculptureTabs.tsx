"use client";

import clsx from "clsx";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useT } from "@/i18n/client";
import { useHome } from "./HomeExperience";

/**
 * Top-5 tabs for the Kinetic Sculpture (APG tabs pattern, automatic activation, no
 * auto-rotate). The panels are server-rendered; this only switches between them and tells
 * the stage which car to sculpt.
 */
export function SculptureTabs({ tabs, panels }: { tabs: { brand: string; model: string }[]; panels: ReactNode[] }) {
  const { selected, select } = useHome();
  const t = useT("home");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const n = tabs.length;
    let next = -1;
    if (e.key === "ArrowRight") next = rtl ? i - 1 : i + 1;
    else if (e.key === "ArrowLeft") next = rtl ? i + 1 : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next === -1) return;
    e.preventDefault();
    next = (next + n) % n;
    select(next);
    refs.current[next]?.focus();
  };

  return (
    <div className="grid gap-4 max-md:gap-3">
      <div role="tablist" aria-label={t("sculpture.tabs")} className="flex gap-2 max-md:-mx-4 max-md:overflow-x-auto max-md:px-4 max-md:pb-1 max-md:[scrollbar-width:none] md:flex-wrap">
        {tabs.map((tab, i) => (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`car-tab-${i}`}
            aria-selected={i === selected}
            aria-controls={`car-panel-${i}`}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={clsx(
              "inline-flex min-h-11 flex-none items-center whitespace-nowrap rounded-full border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm transition-colors duration-200",
              i === selected ? "border-accent bg-[rgba(235,218,176,.16)] text-fg" : "border-line bg-[rgba(24,51,51,.5)] text-muted hover:border-input hover:text-fg",
            )}
          >
            <span className="sr-only">{tab.brand} </span>
            {/* Model names keep their Latin order on Arabic pages ("296 GTS", not "GTS 296"). */}
            <bdi dir="ltr">{tab.model}</bdi>
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div key={i} role="tabpanel" id={`car-panel-${i}`} aria-labelledby={`car-tab-${i}`} hidden={i !== selected}>
          {panel}
        </div>
      ))}
    </div>
  );
}
