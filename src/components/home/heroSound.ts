import type { ChapterState } from "@/scene/types";
import { heroSoundFiles } from "./heroSoundFiles";

// Sound for the homepage story: three one-shot cues, never a loop or background bed.
//   start     a supercar engine starts and revs as the car finishes forming on the helipad
//   pullAway  a supercar launches and pulls away as the car first moves into the tunnel
//   split     the mechanical "coming apart" as the Kinetic Sculpture starts to explode
// Off by default. Browsers only start audio from a user gesture (scrolling doesn't count), so
// the Sound button creates or resumes the AudioContext and only then fetches the clips: no
// audio bytes load otherwise. A remembered "on" still waits for the visitor's first click, tap
// or key press, and shows as off until the context is running. Silent while Pause motion is
// on and while the tab is hidden; detach() closes the context (Next keeps the hidden route
// mounted in <Activity> and re-runs effects when it shows again).
// The clips are built from licensed recordings by tools/build-hero-sounds.mjs (sources and
// licences: public/sounds/LICENSES.md).

export type SoundStatus = "unavailable" | "off" | "waiting" | "on";
type CueId = keyof typeof heroSoundFiles;

const PREF_KEY = "lr.home.sound";
/** Master gain. The clips are mastered to −19…−21 LUFS with peaks under −4 dBFS. */
const LEVEL = 0.85;

/**
 * Story position P = c1 + c2 + c3 + c4: the chapters run back to back, so P rises steadily
 * with the scroll. A cue fires when P crosses `at` going forward, then re-arms only once P is
 * back at or below `rearm` (well before the point), so jitter around it can't retrigger.
 */
const CUES: readonly { id: CueId; at: number; rearm: number }[] = [
  // c1 = 0.84: form = sm(0.5, 0.92, c1) ≈ 0.9, the car has nearly formed on the pad.
  { id: "start", at: 0.84, rearm: 0.6 },
  // c2 = 0.12: speed = sm(0.12, 0.45, c2) starts, the car first moves.
  { id: "pullAway", at: 1.12, rearm: 0.95 },
  // c3 = 0.30: explode = sm(0.25, 0.6, c3) ≈ 0.05, the parts start to come apart.
  { id: "split", at: 2.3, rearm: 2.08 },
];
/** A crossing found this far past its point is a jump, not a scroll: dropped. */
const LATE = 0.3;
const GESTURES = ["pointerdown", "pointerup", "keydown", "touchend"] as const;

// The choice is remembered per visitor (in memory when storage is blocked).
let prefInMemory: boolean | null = null;
function readPref(): boolean {
  if (prefInMemory !== null) return prefInMemory;
  try {
    return localStorage.getItem(PREF_KEY) === "1";
  } catch {
    return false;
  }
}
function writePref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "1" : "0");
  } catch {
    prefInMemory = on;
  }
}

/** Debug log (?debugAudio=1): every cue decision with the chapter progress, for QA scripts. */
export interface SoundLogEntry {
  t: number;
  ev: string;
  cue?: CueId;
  reason?: string;
  P?: number;
  c1?: number;
  c2?: number;
  c3?: number;
  c4?: number;
}
type DebugWindow = Window & { __lrAudioLog?: SoundLogEntry[]; __lrAudio?: () => unknown };

interface Voice {
  src: AudioBufferSourceNode;
  gain: GainNode;
}

export interface HeroSound {
  /** Start listening (visibility, first gesture) and restore the remembered choice. */
  attach(): void;
  /** Fade out, close the AudioContext, drop the clips and every listener. */
  detach(): void;
  /** Called every frame with the chapter progress; plays a cue when its point is crossed. */
  update(state: ChapterState): void;
  /** The Sound button. Must run inside the click handler (a user gesture). */
  toggle(): void;
  setPaused(paused: boolean): void;
  /** Ignore crossings for a while: rail and hash jumps, and the scroll timeline settling. */
  quiet(ms: number): void;
  subscribe(fn: () => void): () => void;
  getStatus(): SoundStatus;
}

/** Inert until attach(), so it can be created during render. */
export function createHeroSound(): HeroSound {
  let status: SoundStatus = "unavailable";
  const listeners = new Set<() => void>();
  let attached = false, wanted = false, paused = false, debug = false;
  let ctx: AudioContext | null = null, master: GainNode | null = null;
  const buffers = new Map<CueId, AudioBuffer>();
  let loading: AbortController | null = null;
  const voices = new Set<Voice>();
  let armed: boolean[] | null = null;
  let quietUntil = 0, suspendTimer = 0;

  const log = (entry: Omit<SoundLogEntry, "t">, s?: ChapterState) => {
    if (!debug) return;
    const r = (v: number) => Math.round(v * 1e4) / 1e4;
    const c = s ? { P: r(s.c1 + s.c2 + s.c3 + s.c4), c1: r(s.c1), c2: r(s.c2), c3: r(s.c3), c4: r(s.c4) } : {};
    (window as DebugWindow).__lrAudioLog?.push({ t: Math.round(performance.now()), ...entry, ...c });
  };

  const refresh = () => {
    const next: SoundStatus = !attached || typeof AudioContext !== "function" ? "unavailable" : !wanted ? "off" : ctx?.state === "running" && !document.hidden ? "on" : "waiting";
    if (next === status) return;
    status = next;
    listeners.forEach((fn) => fn());
  };

  const stopVoice = (v: Voice, fade: number) => {
    if (!ctx) return;
    const t = ctx.currentTime, g = v.gain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + fade);
    try {
      v.src.stop(t + fade + 0.02);
    } catch {
      // already stopped
    }
  };
  const fadeAll = (fade: number) => voices.forEach((v) => stopVoice(v, fade));

  /** Suspend once the fades are done (silence costs nothing while suspended). */
  const suspendSoon = (ms: number) => {
    window.clearTimeout(suspendTimer);
    const c = ctx;
    suspendTimer = window.setTimeout(() => {
      if (c && c === ctx && c.state === "running") c.suspend().then(refresh, () => {});
    }, ms);
  };

  const load = () => {
    if (loading || !ctx || buffers.size === CUES.length) return;
    const c = ctx, ac = new AbortController();
    loading = ac;
    log({ ev: "load" });
    Promise.all(
      (Object.entries(heroSoundFiles) as [CueId, string][]).map(async ([id, url]) => {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
        const buf = await c.decodeAudioData(await res.arrayBuffer());
        if (!ac.signal.aborted) buffers.set(id, buf);
      }),
    ).then(
      () => log({ ev: "loaded" }),
      (err: unknown) => {
        if (ac.signal.aborted) return;
        loading = null; // a later gesture may try again
        console.warn("Homepage sound unavailable.", err);
      },
    );
  };

  /** Create or resume the context. Allowed inside a gesture, or after one (sticky activation). */
  const ensureRunning = () => {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = LEVEL;
      master.connect(ctx.destination);
      const c = ctx;
      c.onstatechange = () => {
        if (c !== ctx) return;
        refresh();
        if (c.state === "running") load();
      };
      log({ ev: "context" });
    }
    window.clearTimeout(suspendTimer);
    if (ctx.state !== "running" && ctx.state !== "closed") ctx.resume().catch(() => {});
    if (ctx.state === "running") load();
    refresh();
  };

  const onGesture = (e: Event) => {
    if (status !== "waiting" || document.hidden) return;
    // The Sound button handles its own press.
    if ((e.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
    const ua = navigator.userActivation as UserActivation | undefined;
    if (ua && !ua.isActive) return; // e.g. a touch pointerdown: activation comes on pointerup
    ensureRunning();
    log({ ev: "unlock" });
  };

  const onVisibility = () => {
    if (document.hidden) {
      fadeAll(0.08);
      suspendSoon(140);
      log({ ev: "hidden" });
    } else if (wanted && ctx) {
      window.clearTimeout(suspendTimer);
      // Allowed after an earlier gesture in most browsers; otherwise the next gesture resumes it.
      ctx.resume().catch(() => {});
    }
    refresh();
  };

  const play = (id: CueId, s: ChapterState) => {
    const buf = buffers.get(id);
    if (!ctx || !master || !buf) return;
    // One voice at a time: a new cue takes over and the previous one fades out.
    fadeAll(0.25);
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(), gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + 0.012);
    src.connect(gain);
    gain.connect(master);
    const v = { src, gain };
    voices.add(v);
    src.onended = () => {
      src.disconnect();
      gain.disconnect();
      voices.delete(v);
    };
    src.start(t);
    log({ ev: "play", cue: id }, s);
  };

  return {
    attach() {
      if (attached) return;
      attached = true;
      if (typeof AudioContext !== "function") return;
      debug = new URLSearchParams(window.location.search).has("debugAudio");
      if (debug) {
        const w = window as DebugWindow;
        w.__lrAudioLog ??= [];
        w.__lrAudio = () => ({ status, ctx: ctx?.state ?? "none", voices: voices.size, buffers: [...buffers.keys()], armed, wanted, paused });
      }
      wanted = readPref();
      armed = null;
      quietUntil = performance.now() + 800;
      document.addEventListener("visibilitychange", onVisibility);
      GESTURES.forEach((type) => window.addEventListener(type, onGesture, { capture: true, passive: true }));
      // Back on the homepage straight after a click elsewhere on the site (the gesture is still
      // fresh): the remembered "on" may start now. Otherwise it waits for the next gesture.
      const ua = navigator.userActivation as UserActivation | undefined;
      if (wanted && ua?.isActive) ensureRunning();
      log({ ev: "attach", reason: wanted ? "remembered-on" : "off" });
      refresh();
    },

    detach() {
      if (!attached) return;
      attached = false;
      document.removeEventListener("visibilitychange", onVisibility);
      GESTURES.forEach((type) => window.removeEventListener(type, onGesture, { capture: true }));
      window.clearTimeout(suspendTimer);
      loading?.abort();
      loading = null;
      buffers.clear();
      const c = ctx, m = master;
      if (c && m) {
        // Close now, so the next attach starts from a fresh context. If something is playing,
        // fade it first on the audio thread (silent at once even if the main thread is busy).
        c.onstatechange = null;
        const close = () => c.close().then(() => log({ ev: "closed" }), () => {});
        if (voices.size && c.state === "running") {
          const t = c.currentTime;
          m.gain.cancelScheduledValues(t);
          m.gain.setValueAtTime(m.gain.value, t);
          m.gain.linearRampToValueAtTime(0, t + 0.03);
          window.setTimeout(close, 40);
        } else close();
      }
      voices.clear();
      ctx = master = null;
      log({ ev: "detach" });
      refresh();
    },

    update(s) {
      if (!attached || status === "unavailable") return;
      const P = s.c1 + s.c2 + s.c3 + s.c4;
      if (!armed) {
        // Armed for every point still ahead; the ones behind wait for the visitor to scroll back.
        armed = CUES.map((c) => P < c.at);
        return;
      }
      for (let i = 0; i < CUES.length; i++) {
        const cue = CUES[i];
        if (!armed[i]) {
          if (P <= cue.rearm) {
            armed[i] = true;
            log({ ev: "rearm", cue: cue.id }, s);
          }
          continue;
        }
        if (P < cue.at) continue;
        armed[i] = false;
        const reason = !wanted
          ? "off"
          : paused
            ? "paused"
            : status !== "on"
              ? "locked"
              : performance.now() < quietUntil
                ? "quiet"
                : P > cue.at + LATE
                  ? "late"
                  : !buffers.has(cue.id)
                    ? "loading"
                    : null;
        if (reason) log({ ev: "skip", cue: cue.id, reason }, s);
        else play(cue.id, s);
      }
    },

    toggle() {
      if (status === "unavailable") return;
      if (status === "on") {
        wanted = false;
        writePref(false);
        fadeAll(0.12);
        suspendSoon(180);
        log({ ev: "toggle", reason: "off" });
      } else {
        wanted = true;
        writePref(true);
        ensureRunning();
        log({ ev: "toggle", reason: "on" });
      }
      refresh();
    },

    setPaused(p) {
      paused = p;
      if (p) fadeAll(0.12);
    },

    quiet(ms) {
      quietUntil = Math.max(quietUntil, performance.now() + ms);
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getStatus: () => status,
  };
}
