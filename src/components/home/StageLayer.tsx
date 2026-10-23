"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { useT } from "@/i18n/client";
import { useHome } from "./HomeExperience";

export interface CalloutText {
  part: "powertrain" | "body" | "cabin" | "wheels";
  title: string;
  detail: string;
}

/**
 * The sticky full-screen layer behind the four chapters. It holds the WebGL canvas (added by
 * the stage itself), the static fallback (night gradient plus the car's line art) and the
 * desktop spec callouts that follow the exploded parts. Decorative: the same facts are in
 * each chapter's HTML.
 */
export function StageLayer({ arts, callouts }: { arts: ReactNode[]; callouts: CalloutText[][] }) {
  const { stageRef, overlayRef, mode, active, selected, cars, heroSlug } = useHome();
  const t = useT("home");
  const heroIndex = Math.max(0, cars.findIndex((c) => c.slug === heroSlug));
  const artIndex = active < 2 ? heroIndex : selected;
  const items = callouts[selected] ?? [];

  return (
    <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 -mb-[100lvh] h-lvh w-full overflow-hidden bg-bg">
      {/* Night sky gradient: shown while the stage loads, and as the static fallback */}
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_70%_100%,rgba(180,83,9,.35),transparent_70%),radial-gradient(60%_50%_at_20%_0%,rgba(125,211,252,.08),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(to_top,rgba(180,83,9,.16),transparent)]" />

      {/* WebGL canvas host */}
      <div ref={stageRef} className="absolute inset-0" />

      {/* Static fallback: the car's line art (no WebGL, save-data, low memory) */}
      {mode === "static" && (
        <div className="absolute inset-x-0 top-[34%] mx-auto w-[min(92vw,720px)] opacity-60 lg:top-auto lg:bottom-[calc(var(--home-dock)+10vh)] lg:me-[clamp(160px,14vw,240px)] lg:w-[min(52vw,760px)] lg:opacity-90">
          {arts.map((art, i) => (
            <div key={i} className={clsx("transition-opacity duration-300", i === artIndex ? "opacity-100" : "absolute inset-0 opacity-0")}>
              {art}
            </div>
          ))}
          <p className="fine mt-2 text-center">{t("stage.illustration")}</p>
        </div>
      )}

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(12,10,9,.7)_100%),linear-gradient(to_bottom,rgba(12,10,9,.55),transparent_20%,transparent_72%,rgba(12,10,9,.6))]" />

      {/* Spec callouts, positioned by the stage on projected 3D anchors. The scene is never
          mirrored, so this layer is laid out physically (dir="ltr") in every locale. */}
      <div ref={overlayRef} dir="ltr" className="absolute inset-0 max-lg:hidden">
        {items.map((c) => (
          <div key={c.part} data-anchor={c.part} className="group/co absolute start-0 top-0 opacity-0 will-change-[transform,opacity]">
            <i className="absolute -start-1.5 -top-1.5 size-3 rounded-full border-[1.5px] border-accent-hover bg-[rgba(234,179,8,.25)] shadow-[0_0_16px_rgba(234,179,8,.6)]" />
            <div className="absolute start-[34px] -top-5 grid gap-0.5 whitespace-nowrap rounded-[10px] border border-[var(--glass-line)] bg-[rgba(12,10,9,.62)] px-3 py-2 backdrop-blur-[10px] before:absolute before:-start-7 before:top-1/2 before:h-px before:w-[22px] before:bg-accent group-data-flip/co:start-auto group-data-flip/co:end-[34px] group-data-flip/co:before:start-auto group-data-flip/co:before:-end-7">
              <b className="text-[13px] font-semibold leading-snug">{c.title}</b>
              <span className="text-[12px] text-muted tabular">{c.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
