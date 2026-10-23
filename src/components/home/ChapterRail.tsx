"use client";

import clsx from "clsx";
import { useEffect } from "react";
import { Pause, Play } from "lucide-react";
import { useT } from "@/i18n/client";
import { CHAPTERS, useHome } from "./HomeExperience";

/** Desktop chapter rail with the Pause motion control (WCAG 2.2.2), plus the mobile control. */
export function ChapterRail() {
  const { active, paused, togglePaused, reduced, chaptersOnScreen, reserveVisible } = useHome();
  const t = useT("home");
  const hiddenCls = !chaptersOnScreen && "pointer-events-none invisible opacity-0";
  const pauseLabel = paused ? t("rail.play") : t("rail.pause");
  const Icon = paused ? Play : Pause;

  return (
    <>
      <nav aria-label={t("rail.label")} className={clsx("fixed end-5 top-1/2 z-[var(--z-rail)] -translate-y-1/2 transition-[opacity,visibility] duration-300 max-lg:hidden", hiddenCls)}>
        <ol className="grid gap-1.5 p-0 [list-style:none] [text-shadow:0_1px_10px_rgba(24,51,51,.95),0_0_2px_rgba(24,51,51,.9)]">
          {CHAPTERS.map((id, i) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={active === i ? "step" : undefined}
                className="group/rl flex min-h-9 items-center justify-end gap-3 no-underline opacity-55 transition-opacity duration-300 hover:opacity-90 aria-[current=step]:opacity-100"
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{t(`rail.${id}`)}</span>
                <span className="font-display text-[10px] font-bold tracking-[0.1em] group-aria-[current=step]/rl:text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="h-px w-3.5 bg-fg transition-[width,background-color] duration-400 group-aria-[current=step]/rl:w-8 group-aria-[current=step]/rl:bg-accent" />
              </a>
            </li>
          ))}
        </ol>
        {!reduced && (
          <button
            type="button"
            onClick={togglePaused}
            className="ms-auto mt-4 flex min-h-11 items-center justify-end gap-2.5 rounded-full border border-line bg-[rgba(24,51,51,.55)] px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted backdrop-blur-sm transition-colors hover:border-accent hover:text-fg"
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {pauseLabel}
          </button>
        )}
      </nav>

      {!reduced && (
        <button
          type="button"
          onClick={togglePaused}
          aria-label={pauseLabel}
          className={clsx(
            "fixed bottom-[calc(var(--home-dock)+12px)] end-4 z-[var(--z-rail)] flex size-11 items-center justify-center rounded-full border border-line bg-[rgba(24,51,51,.7)] text-fg backdrop-blur-sm transition-[opacity,visibility,border-color] duration-300 hover:border-accent lg:hidden",
            (hiddenCls || reserveVisible) && "pointer-events-none invisible opacity-0",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      )}

      <ProgressBar />
    </>
  );
}

/**
 * Gold scroll-progress bar. Created on <body> so it sits above the sticky site header
 * (the page content lives in a lower stacking context).
 */
function ProgressBar() {
  const { progressRef } = useHome();
  useEffect(() => {
    const bar = document.createElement("div");
    bar.setAttribute("aria-hidden", "true");
    bar.className = "pointer-events-none fixed inset-x-0 top-0 z-[calc(var(--z-header)+2)] h-0.5 origin-left bg-accent rtl:origin-right";
    bar.style.transform = "scaleX(0)";
    document.body.appendChild(bar);
    progressRef.current = bar as HTMLDivElement;
    return () => {
      progressRef.current = null;
      bar.remove();
    };
  }, [progressRef]);
  return null;
}
