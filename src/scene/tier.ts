import type { Tier } from "./types";

// Device tier for the cinematic stage (plan D-12, MASTER §8). Runs in the browser only and
// imports nothing heavy, so the homepage can decide on the static fallback before it
// downloads three.js.

interface NavigatorHints {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export function detectTier(): Tier {
  if (typeof window === "undefined") return "static";
  const nav = navigator as Navigator & NavigatorHints;
  if (nav.connection?.saveData) return "static";
  if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return "static";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) return "static";
  if (!supportsWebGL2()) return "static";
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = window.innerWidth < 768;
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
  const fewCores = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  return coarse || small || lowMemory || fewCores ? "low" : "high";
}

/** Cheap capability check that does not keep a context alive. */
function supportsWebGL2(): boolean {
  try {
    if (!("WebGL2RenderingContext" in window)) return false;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Particle and detail budgets per tier (desktop ~10k car particles, cap 12k; phones ~3k). */
export const budgets = {
  high: { carParticles: 10_000, stars: 900, streaks: 1400, cityRadius: 18, maxPixelRatio: 1.75, pointSize: 2.2, antialias: true },
  low: { carParticles: 3_000, stars: 420, streaks: 600, cityRadius: 13, maxPixelRatio: 1.5, pointSize: 2.6, antialias: false },
} as const;

export type Budget = (typeof budgets)[keyof typeof budgets];
