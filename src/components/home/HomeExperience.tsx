"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import type { Car } from "@/content/types";
import type { Stage } from "@/scene/stage";
import { SNAP, type ChapterState, type StageCar } from "@/scene/types";
import { detectTier } from "@/scene/tier";

// The homepage controller. Server-rendered chapters are passed in as children; this
// component adds the scroll choreography (GSAP ScrollTrigger + Lenis), lazy-loads the WebGL
// stage after first paint, and shares the Kinetic Sculpture selection, the Pause motion
// setting and the dock visibility with the client islands below it.
// Everything it starts is torn down on unmount: Next keeps hidden routes mounted inside
// <Activity> and re-runs effects when the route shows again.

export const CHAPTERS = ["skyline", "fleet", "sculpture", "reserve"] as const;
const PAUSE_KEY = "lr.home.motionPaused";

export type StageMode = "pending" | "gl" | "static";

interface HomeContext {
  cars: Car[];
  heroSlug: string;
  selected: number;
  select: (index: number) => void;
  paused: boolean;
  togglePaused: () => void;
  reduced: boolean;
  active: number;
  mode: StageMode;
  reserveVisible: boolean;
  chaptersOnScreen: boolean;
  goTo: (id: string) => void;
  openDock: () => boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  progressRef: RefObject<HTMLDivElement | null>;
  reserveRef: RefObject<HTMLDivElement | null>;
}

const Ctx = createContext<HomeContext | null>(null);

export function useHome(): HomeContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHome must be used inside <HomeExperience>");
  return ctx;
}

export const toStageCar = (car: Car): StageCar => ({
  slug: car.slug,
  body: car.body,
  engineLayout: car.specs.engineLayout,
  hybrid: car.specs.hybrid,
  drivetrain: car.specs.drivetrain,
});

const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = matchMedia(reducedQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function readPaused(): boolean {
  try {
    return localStorage.getItem(PAUSE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Run after the page has loaded and the main thread is idle. Returns a cancel function. */
function whenIdle(fn: () => void, timeout = 1500): () => void {
  let idleId = 0, timer = 0, cancelled = false;
  const run = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(fn, { timeout });
    else timer = setTimeout(fn, 200) as unknown as number;
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (idleId) window.cancelIdleCallback(idleId);
    if (timer) clearTimeout(timer);
  };
}

/**
 * Runs while the HTML is parsed, before first paint: measures what sits above the homepage
 * (the demo bar) so the first chapter's copy clears the dock at scroll 0. It writes a
 * <style> into <head> rather than touching React-rendered attributes, so hydration matches.
 */
const homeTopScript = `(function(){try{var r=document.querySelector("[data-home]");if(!r)return;var s=document.getElementById("lr-home-top")||document.createElement("style");s.id="lr-home-top";s.textContent="[data-home]{--home-top:"+Math.max(0,Math.round(r.getBoundingClientRect().top+window.scrollY))+"px}";document.head.appendChild(s)}catch(e){}})()`;

/** Inline script that runs on full page loads only (Next "preventing flash" pattern). */
function InlineScript({ html }: { html: string }) {
  return <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}

interface Props {
  cars: Car[];
  heroSlug: string;
  defaultIndex: number;
  /** Sticky stage layer, chapter rail and progress bar (client components). */
  chrome: ReactNode;
  /** The four server-rendered chapters. */
  chapters: ReactNode;
  /** Normal-scrolling sections after the chapters. */
  after: ReactNode;
  /** The booking dock. */
  dock: ReactNode;
}

export function HomeExperience({ cars, heroSlug, defaultIndex, chrome, chapters, after, dock }: Props) {
  const [selected, setSelected] = useState(defaultIndex);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<StageMode>("pending");
  const [reserveVisible, setReserveVisible] = useState(false);
  const [chaptersOnScreen, setChaptersOnScreen] = useState(true);
  const reduced = useSyncExternalStore(subscribeReduced, () => matchMedia(reducedQuery).matches, () => false);

  const rootRef = useRef<HTMLDivElement>(null);
  const chaptersRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reserveRef = useRef<HTMLDivElement>(null);

  // Mutable state read by the render loop (kept out of React renders)
  const S = useRef<ChapterState>({ ...SNAP[0], c1: 0 });
  const stage = useRef<Stage | null>(null);
  const pausedRef = useRef(false);
  const selectedRef = useRef(defaultIndex);
  const onScreenRef = useRef(true);
  const needsRender = useRef(true);
  const goToRef = useRef<(id: string) => void>(() => {});
  // A server re-render sends a new array with the same cars: key effects on the slugs.
  const carsRef = useRef(cars);
  const carsKey = cars.map((c) => c.slug).join(",");
  useEffect(() => {
    carsRef.current = cars;
  }, [cars]);
  const cueTween = useRef<{ pause(): void; play(): void } | null>(null);

  // Remembered Pause motion setting
  useEffect(() => {
    if (readPaused()) setPaused(true);
  }, []);
  useEffect(() => {
    pausedRef.current = paused;
    needsRender.current = true;
    if (paused) cueTween.current?.pause();
    else cueTween.current?.play();
  }, [paused]);
  const togglePaused = useCallback(() => {
    setPaused((p) => {
      try {
        localStorage.setItem(PAUSE_KEY, p ? "0" : "1");
      } catch {
        /* storage unavailable: the setting lasts for this visit */
      }
      return !p;
    });
  }, []);

  // Keep --home-top (height of what sits above the homepage, e.g. the demo bar) current.
  useEffect(() => {
    const update = () => {
      const root = rootRef.current;
      if (!root) return;
      const top = Math.max(0, Math.round(root.getBoundingClientRect().top + window.scrollY));
      let el = document.getElementById("lr-home-top");
      if (!el) {
        el = document.createElement("style");
        el.id = "lr-home-top";
        document.head.appendChild(el);
      }
      el.textContent = `[data-home]{--home-top:${top}px}`;
    };
    update();
    window.addEventListener("resize", update);
    document.fonts?.ready.then(update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Dock hides while the chapter 4 reserve card is at least 40% in view; the stage pauses off-screen.
  useEffect(() => {
    const card = reserveRef.current, wrap = chaptersRef.current;
    const ios: IntersectionObserver[] = [];
    if (card) {
      const io = new IntersectionObserver(([e]) => setReserveVisible(e.isIntersecting && e.intersectionRatio >= 0.4), { threshold: [0, 0.4, 0.6, 1] });
      io.observe(card);
      ios.push(io);
    }
    if (wrap) {
      // Render while any part of the stage is visible…
      const render = new IntersectionObserver(([e]) => {
        onScreenRef.current = e.isIntersecting;
        needsRender.current = true;
      });
      // …but show the rail and Pause control only while the chapters fill the middle of the screen.
      const rail = new IntersectionObserver(([e]) => setChaptersOnScreen(e.isIntersecting), { rootMargin: "-40% 0px -40% 0px" });
      render.observe(wrap);
      rail.observe(wrap);
      ios.push(render, rail);
    }
    return () => ios.forEach((io) => io.disconnect());
  }, []);

  // Scroll choreography and the WebGL stage
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    // Chapter state survives a re-run (route shown again, setting changed); with reduced
    // motion ScrollTrigger's toggles snap it to the active chapter's final state.
    const state = S.current;
    needsRender.current = true;
    let last = { ...state };

    const renderFrame = (dt: number, time: number) => {
      const st = stage.current;
      if (!st || !onScreenRef.current || document.hidden) return;
      const ambient = !reduced && !pausedRef.current;
      if (ambient) {
        st.frame(state, dt, time, true);
        return;
      }
      const changed = state.c1 !== last.c1 || state.c2 !== last.c2 || state.c3 !== last.c3 || state.c4 !== last.c4;
      if (changed || needsRender.current || st.busy()) {
        st.frame(state, 0, time, false);
        last = { ...state };
        needsRender.current = false;
      }
    };

    let lenis: import("lenis").default | null = null;
    const goTo = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      let y = top;
      if (id === "reserve") {
        // End of the chapter, but never so far that the (tall) reserve card's top hides under the header.
        y = top + el.offsetHeight - window.innerHeight;
        const card = reserveRef.current;
        const headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
        if (card) y = Math.min(y, card.getBoundingClientRect().top + window.scrollY - headerH - 16);
      }
      if (lenis) lenis.scrollTo(y, { duration: 1.8 });
      else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
      el.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: true });
    };
    goToRef.current = goTo;

    // In-page links (rail, Skip intro, "See the featured cars") scroll through the story.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!a || !root.contains(a)) return;
      const id = a.getAttribute("href")!.slice(1);
      if (!(CHAPTERS as readonly string[]).includes(id)) return;
      e.preventDefault();
      goTo(id);
    };
    root.addEventListener("click", onClick);
    cleanups.push(() => root.removeEventListener("click", onClick));

    const setChapter = (i: number) => {
      setActive(i);
      if (reduced) {
        Object.assign(state, SNAP[i]);
        needsRender.current = true;
      }
    };

    const skyB = root.querySelector<HTMLElement>("[data-sky-b]");

    // Choreography: loads straight after hydration (small), independent of the stage.
    (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
        const coarse = matchMedia("(pointer: coarse)").matches;
        if (!reduced && !coarse) {
          const { default: Lenis } = await import("lenis");
          if (cancelled) return;
          lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, allowNestedScroll: true, stopInertiaOnNavigate: true });
          lenis.on("scroll", ScrollTrigger.update);
        }
        const sections = CHAPTERS.map((id) => document.getElementById(id)).filter((x): x is HTMLElement => !!x);
        const ctx = gsap.context(() => {
          sections.forEach((sec, i) =>
            ScrollTrigger.create({ trigger: sec, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setChapter(i) }),
          );
          ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: (self) => {
              const bar = progressRef.current;
              if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            },
          });
          if (!reduced) {
            const scrub = 1;
            gsap.to(state, { c1: 1, ease: "none", scrollTrigger: { trigger: "#skyline", start: "top top", end: "bottom bottom", scrub } });
            gsap.to(state, { c2: 1, ease: "none", scrollTrigger: { trigger: "#fleet", start: "top bottom", end: "bottom bottom", scrub } });
            gsap.to(state, { c3: 1, ease: "none", scrollTrigger: { trigger: "#sculpture", start: "top bottom", end: "bottom bottom", scrub } });
            gsap.to(state, { c4: 1, ease: "none", scrollTrigger: { trigger: "#reserve", start: "top bottom", end: "bottom bottom", scrub } });
            gsap
              .timeline({ scrollTrigger: { trigger: "#skyline", start: "top top", end: "bottom bottom", scrub: true } })
              .to("[data-cue]", { autoAlpha: 0, duration: 0.08 }, 0)
              .to("[data-sky-a]", { autoAlpha: 0, y: -40, duration: 0.18 }, 0.26)
              .fromTo("[data-sky-b]", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.14 }, 0.72)
              .to({}, { duration: 0.14 }, 0.86);
            const line = root.querySelector("[data-cue-line]");
            if (line) {
              const tl = gsap.timeline({ repeat: -1 });
              tl.fromTo(line, { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 1.3, ease: "power1.inOut" }).to(line, { opacity: 0, duration: 0.9, ease: "none" });
              if (pausedRef.current) tl.pause();
              cueTween.current = tl;
            }
          }
        }, root);

        const tick = (time: number, deltaMs: number) => {
          lenis?.raf(time * 1000);
          renderFrame(Math.min(deltaMs / 1000, 0.05), time);
        };
        gsap.ticker.add(tick);
        if (lenis) gsap.ticker.lagSmoothing(0);

        const refresh = () => ScrollTrigger.refresh();
        document.fonts?.ready.then(() => !cancelled && refresh());
        let lastH = 0, rt = 0;
        const ro = new ResizeObserver(() => {
          const h = document.documentElement.scrollHeight;
          if (Math.abs(h - lastH) > 2) {
            lastH = h;
            window.clearTimeout(rt);
            rt = window.setTimeout(refresh, 120);
          }
        });
        ro.observe(document.body);

        const hash = window.location.hash.slice(1);
        if ((CHAPTERS as readonly string[]).includes(hash)) window.setTimeout(() => !cancelled && goTo(hash), 400);

        cleanups.push(() => {
          ro.disconnect();
          window.clearTimeout(rt);
          gsap.ticker.remove(tick);
          gsap.ticker.lagSmoothing(500, 33);
          cueTween.current?.pause();
          cueTween.current = null;
          ctx.revert();
          lenis?.destroy();
          lenis = null;
        });
      } catch (err) {
        // Without the choreography the chapters still read top to bottom.
        console.warn("Homepage motion unavailable.", err);
        if (skyB) {
          skyB.style.opacity = "1";
          skyB.style.visibility = "visible";
        }
        // Keep the stage alive on a plain rAF loop.
        let raf = 0;
        const loop = (t: number) => {
          renderFrame(0, t / 1000);
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        cleanups.push(() => cancelAnimationFrame(raf));
      }
    })();

    // The stage: device tier first, then three.js once the page is idle.
    const cancelIdle = whenIdle(async () => {
      const tier = detectTier();
      if (tier === "static") {
        setMode("static");
        return;
      }
      try {
        const { createStage } = await import("@/scene/stage");
        const container = stageRef.current;
        if (cancelled || !container) return;
        const list = carsRef.current;
        const hero = list.find((c) => c.slug === heroSlug) ?? list[0];
        stage.current = createStage({ container, overlay: overlayRef.current, tier, hero: toStageCar(hero), selected: toStageCar(list[selectedRef.current] ?? list[0]) });
        needsRender.current = true;
        setMode("gl");
      } catch (err) {
        console.warn("3D stage unavailable, showing the static version.", err);
        if (!cancelled) setMode("static");
      }
    });
    cleanups.push(cancelIdle);

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      stage.current?.dispose();
      stage.current = null;
      setMode("pending");
    };
  }, [reduced, carsKey, heroSlug]);

  const select = useCallback(
    (index: number) => {
      selectedRef.current = index;
      setSelected(index);
      const car = cars[index];
      if (car) stage.current?.setSelected(toStageCar(car), !reduced && !pausedRef.current);
      needsRender.current = true;
    },
    [cars, reduced],
  );

  const openDock = useCallback(() => {
    window.dispatchEvent(new CustomEvent("lr:dock-open"));
    const dockEl = rootRef.current?.querySelector<HTMLElement>("[data-home-dock]");
    const first = dockEl?.querySelector<HTMLElement>("input, select, textarea, button, a[href]");
    if (!dockEl || !first) return false;
    const toggle = dockEl.querySelector<HTMLElement>("[aria-expanded='false']");
    if (toggle && window.innerWidth < 1024) toggle.click();
    window.setTimeout(() => {
      const field = dockEl.querySelector<HTMLElement>("input:not([type='hidden']), select, [role='combobox']") ?? dockEl.querySelector<HTMLElement>("button:not([aria-expanded]), a[href]") ?? first;
      field.focus({ preventScroll: true });
      if (!matchMedia(reducedQuery).matches) {
        field.animate?.([{ boxShadow: "0 0 0 0 rgba(234,179,8,.55)" }, { boxShadow: "0 0 0 14px rgba(234,179,8,0)" }], { duration: 1200, easing: "ease" });
      }
    }, 80);
    return true;
  }, []);

  const goTo = useCallback((id: string) => goToRef.current(id), []);

  const value = useMemo<HomeContext>(
    () => ({ cars, heroSlug, selected, select, paused, togglePaused, reduced, active, mode, reserveVisible, chaptersOnScreen, goTo, openDock, stageRef, overlayRef, progressRef, reserveRef }),
    [cars, heroSlug, selected, select, paused, togglePaused, reduced, active, mode, reserveVisible, chaptersOnScreen, goTo, openDock],
  );

  return (
    <Ctx.Provider value={value}>
      <div ref={rootRef} data-home="" data-stage={mode} data-paused={paused ? "" : undefined} className="group/home relative -mt-[var(--header-h)] overflow-x-clip [--home-dock:84px] lg:[--home-dock:104px]">
        <InlineScript html={homeTopScript} />
        <div ref={chaptersRef} data-chapters="" className="relative">
          {chrome}
          {chapters}
        </div>
        {after}
        {dock}
      </div>
    </Ctx.Provider>
  );
}
