// Render the homepage hero's three scroll sounds.
//
//   node tools/render-hero-sounds.mjs [--out <folder>]      (needs ffmpeg with libmp3lame)
//
// Everything is synthesized here; no recordings are used, so there is no third-party licence.
//   engine-start  the Revuelto's V12 starts on the helipad: starter, catch, flare, idle burble
//   pull-away     a throttle blip with overrun crackle, then the pull-away in first, one upshift
//   split         the car comes apart: whoosh, latch clicks, servo whine, air release, lock
// The V12 is modelled, not oscillator-drawn: twelve cylinders fire 60° of crank apart (Lamborghini
// order 1-7-4-10-2-8-6-12-3-9-5-11, so the banks alternate) as exhaust blowdown pulses with
// per-cylinder and cycle-to-cycle variation, through each bank's header and mid-pipe (damped
// waveguide combs), the muffler and a load-dependent tailpipe filter, plus intake howl,
// valvetrain and the starter motor. Each scene gets a small FDN reverb (helipad, tunnel, studio).
// A seeded random generator makes every run produce identical audio.
//
// Writes public/sounds/{name}.{hash8}.mp3 (older versions removed) and regenerates
// src/components/home/heroSoundFiles.ts. --out also copies each MP3 and a 24-bit WAV master there.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const OUT = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const SR = 48000;
const TAU = Math.PI * 2;

// ---------- small DSP kit ----------

/** Seeded generator: uniform u() in [0, 1) and normal n(). */
function rng(seed) {
  let a = seed | 0;
  const u = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  const n = () => {
    if (spare !== null) {
      const s = spare;
      spare = null;
      return s;
    }
    const r = Math.sqrt(-2 * Math.log(u() || 1e-12)), th = TAU * u();
    spare = r * Math.sin(th);
    return r * Math.cos(th);
  };
  return { u, n };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (x) => x * x * (3 - 2 * x);
const db = (d) => Math.pow(10, d / 20);
const secs = (t) => Math.round(t * SR);

/**
 * Piecewise automation curve, one value per sample. pts: [[t, v, ease?], …]; the ease shapes the
 * segment that ends at that point: "lin" (default), "smooth", "out" (fast start), "in",
 * "exp" (exponential approach, fast then settling), or a number p for u^p.
 */
function curve(n, pts) {
  const out = new Float32Array(n);
  let k = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    while (k < pts.length - 1 && t >= pts[k + 1][0]) k++;
    if (t <= pts[0][0]) out[i] = pts[0][1];
    else if (k >= pts.length - 1) out[i] = pts[pts.length - 1][1];
    else {
      const [t0, v0] = pts[k];
      const [t1, v1, ease = "lin"] = pts[k + 1];
      const u = clamp((t - t0) / (t1 - t0), 0, 1);
      let e = u;
      if (ease === "smooth") e = smooth(u);
      else if (ease === "out") e = 1 - Math.pow(1 - u, 2.2);
      else if (ease === "in") e = Math.pow(u, 2.2);
      else if (ease === "exp") e = (1 - Math.exp(-4 * u)) / (1 - Math.exp(-4));
      else if (typeof ease === "number") e = Math.pow(u, ease);
      out[i] = v0 + (v1 - v0) * e;
    }
  }
  return out;
}

/** Smoothed random wobble (for idle hunting and servo load), unit amplitude. */
function wobble(n, rate, seed) {
  const R = rng(seed);
  const out = new Float32Array(n);
  const step = Math.max(1, Math.round(SR / rate));
  let a = R.n(), b = R.n();
  for (let i = 0; i < n; i++) {
    const j = i % step;
    if (j === 0 && i) {
      a = b;
      b = R.n();
    }
    out[i] = a + (b - a) * smooth(j / step);
  }
  return out;
}

/** RBJ cookbook biquad coefficients. */
function biquad(type, f, Q = 0.707, gainDb = 0) {
  const w = (TAU * f) / SR, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q), A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") [b0, b1, b2, a0, a1, a2] = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2, 1 + al, -2 * cw, 1 - al];
  else if (type === "hp") [b0, b1, b2, a0, a1, a2] = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2, 1 + al, -2 * cw, 1 - al];
  else if (type === "bp") [b0, b1, b2, a0, a1, a2] = [al, 0, -al, 1 + al, -2 * cw, 1 - al];
  else if (type === "peak") [b0, b1, b2, a0, a1, a2] = [1 + al * A, -2 * cw, 1 - al * A, 1 + al / A, -2 * cw, 1 - al / A];
  else if (type === "hs" || type === "ls") {
    const s = 2 * Math.sqrt(A) * al, sg = type === "hs" ? 1 : -1;
    b0 = A * (A + 1 + sg * (A - 1) * cw + s);
    b1 = -2 * sg * A * (A - 1 + sg * (A + 1) * cw);
    b2 = A * (A + 1 + sg * (A - 1) * cw - s);
    a0 = A + 1 - sg * (A - 1) * cw + s;
    a1 = 2 * sg * (A - 1 - sg * (A + 1) * cw);
    a2 = A + 1 - sg * (A - 1) * cw - s;
  } else throw new Error(type);
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

/** Apply biquads in series, in place. */
function filt(x, ...cs) {
  for (const c of cs) {
    let z1 = 0, z2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = x[i], y = c.b0 * v + z1;
      z1 = c.b1 * v - c.a1 * y + z2;
      z2 = c.b2 * v - c.a2 * y;
      x[i] = y;
    }
  }
  return x;
}

/** Zavalishin TPT state-variable filter, in place; the cutoff may change every sample. */
function svf(x, fc, Q, mode = "lp") {
  let ic1 = 0, ic2 = 0;
  const k = 1 / Q;
  for (let i = 0; i < x.length; i++) {
    const f = typeof fc === "number" ? fc : fc[i];
    const g = Math.tan((Math.PI * Math.min(f, SR * 0.45)) / SR);
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x[i] - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    x[i] = mode === "lp" ? v2 : mode === "bp" ? v1 * k : x[i] - k * v1 - v2;
  }
  return x;
}

/** Damped waveguide pipe as a feedback comb: y = x + refl · lowpass(y delayed by the round trip). */
function pipe(x, metres, refl, damp, gasSpeed = 560) {
  const d = Math.max(1, Math.round(((2 * metres) / gasSpeed) * SR));
  const ring = new Float32Array(d);
  let w = 0, lp = 0;
  for (let i = 0; i < x.length; i++) {
    lp += (1 - damp) * (ring[w] - lp);
    const y = x[i] + refl * lp;
    ring[w] = y;
    w = w + 1 === d ? 0 : w + 1;
    x[i] = y;
  }
  return x;
}

/**
 * 8-line feedback delay network reverb (Hadamard mixing, per-line damping). Returns the wet
 * stereo signal, `extra` seconds longer than the input. wet may be a number or a per-sample curve.
 */
function reverb([L, R], { t60, pre = 0.02, damp = 0.35, size = 1, wet = 0.15, early = [], extra = 0.6 }) {
  const n = L.length + secs(extra);
  const lens = [1031, 1327, 1523, 1801, 2053, 2311, 2633, 2909].map((v) => Math.round(v * size));
  const lines = lens.map((len) => ({ buf: new Float32Array(len), w: 0, len, lp: 0, g: Math.pow(10, (-3 * len) / (t60 * SR)) }));
  const pd = secs(pre);
  const oL = new Float32Array(n), oR = new Float32Array(n);
  const s = new Float64Array(8);
  const inSign = [1, -1, 1, 1, -1, 1, -1, -1];
  for (let i = 0; i < n; i++) {
    const j = i - pd;
    const inL = j >= 0 && j < L.length ? L[j] : 0, inR = j >= 0 && j < R.length ? R[j] : 0;
    let eL = 0, eR = 0;
    for (const [dt, g, side] of early) {
      const k = j - secs(dt);
      if (k >= 0 && k < L.length) {
        const v = (L[k] + R[k]) * g;
        if (side <= 0) eL += v;
        if (side >= 0) eR += v;
      }
    }
    for (let q = 0; q < 8; q++) {
      const l = lines[q];
      const v = l.buf[l.w];
      l.lp = v + damp * (l.lp - v);
      s[q] = l.lp * l.g;
    }
    // Fast Walsh–Hadamard transform, normalised (energy preserving).
    for (let h = 1; h < 8; h <<= 1)
      for (let a = 0; a < 8; a += h << 1)
        for (let b = a; b < a + h; b++) {
          const x = s[b], y = s[b + h];
          s[b] = x + y;
          s[b + h] = x - y;
        }
    const inp = (inL + inR) * 0.5;
    for (let q = 0; q < 8; q++) {
      const l = lines[q];
      l.buf[l.w] = s[q] * 0.35355339 + inp * inSign[q] * (q % 2 ? 0.9 : 1);
      l.w = l.w + 1 === l.len ? 0 : l.w + 1;
    }
    const wv = typeof wet === "number" ? wet : wet[Math.min(i, wet.length - 1)];
    oL[i] = ((lines[0].buf[lines[0].w] - lines[2].buf[lines[2].w] + lines[4].buf[lines[4].w] - lines[6].buf[lines[6].w]) * 0.5 + eL) * wv;
    oR[i] = ((lines[1].buf[lines[1].w] - lines[3].buf[lines[3].w] + lines[5].buf[lines[5].w] - lines[7].buf[lines[7].w]) * 0.5 + eR) * wv;
  }
  return [oL, oR];
}

/** Add b into a (b may be shorter), scaled. */
function mixInto(a, b, g = 1, at = 0) {
  for (let i = 0; i < b.length && i + at < a.length; i++) if (i + at >= 0) a[i + at] += b[i] * g;
  return a;
}

/** BS.1770 integrated loudness (LUFS) of a stereo pair at 48 kHz. */
function lufs([L, R]) {
  const k = (x) => {
    const y = Float32Array.from(x);
    filt(y, { b0: 1.53512485958697, b1: -2.69169618940638, b2: 1.19839281085285, a1: -1.69065929318241, a2: 0.73248077421585 });
    filt(y, { b0: 1, b1: -2, b2: 1, a1: -1.99004745483398, a2: 0.99007225036621 });
    return y;
  };
  const kl = k(L), kr = k(R);
  const blk = secs(0.4), hop = secs(0.1), z = [];
  for (let s = 0; s + blk <= kl.length; s += hop) {
    let sum = 0;
    for (let i = s; i < s + blk; i++) sum += kl[i] * kl[i] + kr[i] * kr[i];
    z.push(sum / blk);
  }
  const loud = (v) => -0.691 + 10 * Math.log10(v);
  const abs = z.filter((v) => loud(v) > -70);
  const rel = loud(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const gated = abs.filter((v) => loud(v) > rel);
  return loud(gated.reduce((a, b) => a + b, 0) / gated.length);
}

/** Loudness of a stretch of a stereo pair, for checking the balance of layers (--layers). */
function lufsOf([L, R], from = 0, to = L.length / SR) {
  const a = secs(from), b = Math.min(L.length, secs(to));
  return lufs([L.subarray(a, b), R.subarray(a, b)]);
}
const LAYERS = process.argv.includes("--layers");
function report(name, layers, spans = {}) {
  if (!LAYERS) return;
  const rows = Object.entries(layers).map(([k, v]) => `${k} ${lufsOf(v).toFixed(1)}`);
  const parts = Object.entries(spans).map(([k, [a, b]]) => `${k}@${a}-${b}s ${Object.entries(layers).map(([l, v]) => `${l} ${lufsOf(v, a, b).toFixed(1)}`).join(" / ")}`);
  console.log(`  [${name}] layers (LUFS, pre-master): ${rows.join(", ")}${parts.length ? `\n    ${parts.join("\n    ")}` : ""}`);
}

/**
 * Master: normalise to the loudness target, then a 3 ms look-ahead peak limiter (ceiling in
 * dBFS), a short fade-in and a fade-out over the last `fadeOut` seconds.
 */
function master([L, R], { target, ceiling = -4, fadeOut = 0.12 }) {
  const g = db(target - lufs([L, R]));
  for (let i = 0; i < L.length; i++) {
    L[i] *= g;
    R[i] *= g;
  }
  // Gain each sample needs; the minimum over the look-ahead window with a slow release; then a
  // box average over the same window, so the gain glides down before a peak and never steps.
  const c = db(ceiling), look = secs(0.003), rel = Math.exp(-1 / (0.08 * SR)), n = L.length;
  const need = new Float32Array(n), held = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = p > c ? c / p : 1;
  }
  let h = 1;
  for (let i = 0; i < n; i++) {
    let m = 1;
    for (let j = i; j < Math.min(n, i + look); j++) if (need[j] < m) m = need[j];
    h = m < h ? m : m + (h - m) * rel;
    held[i] = h;
  }
  let reduced = 0, deepest = 1, sum = look; // as if unity gain preceded the start
  for (let i = 0; i < n; i++) {
    sum += held[i] - (i >= look ? held[i - look] : 1);
    const gain = sum / look;
    if (gain < 0.999) reduced++;
    deepest = Math.min(deepest, gain);
    L[i] *= gain;
    R[i] *= gain;
  }
  const fi = secs(0.004), fo = secs(fadeOut);
  for (let i = 0; i < fi; i++) {
    const e = 0.5 - 0.5 * Math.cos((Math.PI * i) / fi);
    L[i] *= e;
    R[i] *= e;
  }
  for (let i = 0; i < fo; i++) {
    const e = 0.5 + 0.5 * Math.cos((Math.PI * i) / fo);
    L[n - fo + i] *= e;
    R[n - fo + i] *= e;
  }
  return { gainDb: 20 * Math.log10(g), limitedMs: (reduced / SR) * 1000, maxReductionDb: -20 * Math.log10(deepest) };
}

// ---------- V12 model ----------

/** Lamborghini V12 firing order; consecutive firings alternate between the banks. */
const FIRING = [1, 7, 4, 10, 2, 8, 6, 12, 3, 9, 5, 11];

/**
 * Exhaust pressure of one V12, as two bank signals before the pipes.
 * rpm, load (0 closed throttle … 1 full load) and fire (≥ 0.5 combustion on; below, the
 * cylinders only compress, as while cranking or during an ignition cut) are per-sample curves.
 * pops: overrun afterfire [time s, strength] injected into the exhaust.
 */
function v12Pulses({ n, rpm, load, fire, seed, catchAt = -1, pops = [] }) {
  const R = rng(seed);
  // Per-cylinder character: small spreads in charge, timing and burn speed (a healthy V12 is
  // even; these give the half-order "burble" at idle without sounding rough).
  const cyl = FIRING.map(() => ({ amp: 1 + 0.08 * R.n(), dt: (1.0 * R.n()) / 360, w: 1 + 0.08 * R.n() }));
  const banks = [new Float32Array(n), new Float32Array(n)];
  const events = [];
  let theta = 0, k = 0;
  let nextAt = cyl[0].dt;
  for (let i = 0; i < n; i++) {
    const d = rpm[i] / 60 / SR;
    while (theta + d >= nextAt) {
      const t = i + (nextAt - theta) / d;
      const r = rpm[i], L = load[i], on = fire[i] >= 0.5, c = cyl[k % 12];
      // Cycle-to-cycle spread is largest at idle and light load.
      const spread = 0.025 + 0.07 * (1 - L) * (r < 1800 ? 1 : 0.5);
      // Exhaust noise grows with load and about 25·log10(rpm) dB: pulse energy shrinks with the
      // shorter blowdown at speed, so the amplitude carries the rest.
      const speed = Math.pow(r / 3000, 0.75);
      let amp = on ? (0.3 + 0.7 * Math.pow(L, 0.8)) * speed * c.amp * (1 + spread * R.n()) : 0.16 * c.amp * (1 + 0.1 * R.n());
      // The first few firings after the catch are uneven before the mixture settles.
      if (on && catchAt >= 0 && t / SR - catchAt < 0.07) amp *= 0.55 + 1.0 * R.u();
      // Blowdown: a steep front (sharper under load) decaying over ~22° of crank.
      // Gas dynamics bound it too, so slow idle pulses stay short (and the idle has some mid).
      const T = clamp((0.061 / (r / 60)) * (1 - 0.32 * L) * c.w, 0.00032, on ? 0.0012 : 0.009);
      const Tr = on ? clamp(0.00014 * (1 - 0.55 * L), 0.00005, T / 3) : T / 2;
      events.push({ t, bank: k % 2, amp, T, Tr, noise: on ? 0.16 + 0.26 * L : 0.06 });
      // Next firing 60° on, with a little cycle-to-cycle timing scatter (degrees of crank).
      const prev = nextAt;
      k++;
      nextAt = Math.max(prev + 1 / 12, k / 6 + cyl[k % 12].dt + ((0.3 + 0.8 * (1 - L)) * R.n()) / 360);
    }
    theta += d;
  }
  for (const [t, s] of pops) events.push({ t: t * SR, bank: R.u() < 0.5 ? 0 : 1, amp: 0.5 * s, T: 0.0005, Tr: 0.00004, noise: 1.4, pop: true });
  const g = (u) => (u > 0 ? u * u * Math.exp(2 * (1 - u)) : 0);
  for (const e of events) {
    const buf = banks[e.bank];
    const Ts = e.T * SR, Tr = e.Tr * SR, Tn = (e.pop ? 5 : 1.6) * Ts;
    const start = Math.ceil(e.t), len = Math.ceil(Ts * (e.pop ? 30 : 9));
    for (let j = 0; j < len && start + j < n; j++) {
      const tau = start + j - e.t;
      // Blowdown pulse, then the rarefaction that follows it.
      const p = (1 - Math.exp(-tau / Tr)) * Math.exp(-tau / Ts) - 0.28 * g((tau - 1.2 * Ts) / (1.8 * Ts));
      const env = Math.exp(-tau / Tn) * (1 - Math.exp(-tau / Tr));
      buf[start + j] += e.amp * (p + e.noise * env * R.n());
    }
  }
  return banks;
}

/**
 * The V12 as heard a few metres away: bank pulses through headers and mid-pipes (two lengths
 * per bank, so the formants don't move with rpm), the muffler, a tailpipe filter that opens
 * with load, intake howl and the valvetrain. Returns [L, R].
 */
function v12({ dur, rpm, load, fire, seed, catchAt, pops, bright = 1 }) {
  const n = secs(dur);
  const [A, B] = v12Pulses({ n, rpm, load, fire, seed, catchAt, pops });
  // Intake: the summed pulses, band-limited, rising with load and rpm (induction howl).
  const intake = new Float32Array(n);
  for (let i = 0; i < n; i++) intake[i] = A[i] + B[i];
  filt(intake, biquad("bp", 1450, 0.9), biquad("peak", 2600, 2, 4));
  for (let i = 0; i < n; i++) intake[i] *= 0.16 * Math.pow(load[i], 1.6) * clamp(rpm[i] / 6000, 0.25, 1.3);
  // Headers (negative reflection at the open collector), then the mid-pipes.
  pipe(A, 0.8, -0.38, 0.45);
  pipe(B, 0.83, -0.38, 0.45);
  pipe(A, 1.9, 0.25, 0.6);
  pipe(B, 1.95, 0.25, 0.6);
  // The banks meet in the muffler, so both channels carry both banks (the 6th order leads);
  // the small difference keeps some 3rd order and a stereo image.
  const L = new Float32Array(n), Rr = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = 0.55 * A[i] + 0.45 * B[i];
    Rr[i] = 0.45 * A[i] + 0.55 * B[i];
  }
  const fc = new Float32Array(n);
  for (let i = 0; i < n; i++) fc[i] = (1500 + 5400 * Math.pow(load[i], 1.3) + 0.42 * rpm[i]) * bright;
  for (const x of [L, Rr]) {
    // Muffler: some body, a mid honk, absorption at the harsh 1–2 kHz band and a soft top; the
    // tailpipe radiates lows weakly (shelf), which keeps the idle from booming.
    filt(x, biquad("hp", 32, 0.7), biquad("ls", 170, 0.7, -5), biquad("peak", 165, 1.2, 1.5), biquad("peak", 470, 2.2, 2.5), biquad("peak", 1250, 0.9, -4), biquad("hs", 5000, 0.7, -5));
    svf(x, fc, 0.62, "lp");
  }
  // Valvetrain: a faint, fast ticking under the exhaust (48 valves), most audible at idle.
  const R = rng(seed + 7);
  const valves = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    ph += (rpm[i] / 60 / SR) * 12;
    if (ph >= 1) {
      ph -= 1;
      const a = 0.02 * (1 - 0.6 * load[i]) * (0.7 + 0.6 * R.u());
      for (let j = 0; j < 24 && i + j < n; j++) valves[i + j] += a * R.n() * Math.exp(-j / 6);
    }
  }
  filt(valves, biquad("bp", 6800, 2.2), biquad("hp", 3000, 0.7));
  for (let i = 0; i < n; i++) {
    L[i] += intake[i] + valves[i];
    Rr[i] += intake[i] * 0.94 + valves[i];
  }
  return [L, Rr];
}

/**
 * Starter: solenoid clunk, then the motor (rotation, pinion mesh, commutator whine) loaded by
 * each cylinder's compression, freewheeling up briefly as the engine catches.
 */
function starter({ dur, from, to, crank, seed }) {
  const n = secs(dur);
  const R = rng(seed);
  const out = new Float32Array(n);
  // Solenoid: a short low thump with a click.
  for (let j = 0; j < secs(0.12); j++) {
    const t = j / SR, i = secs(from) + j;
    out[i] += 0.5 * Math.sin(TAU * 92 * t) * Math.exp(-t / 0.03) + 0.25 * R.n() * Math.exp(-t / 0.0015);
  }
  let mot = 0, crankPh = 0;
  const gear = new Float32Array(n);
  for (let i = secs(from + 0.012); i < Math.min(n, secs(to + 0.16)); i++) {
    const t = i / SR;
    crankPh += crank[i] / 60 / SR;
    // Compression load: six peaks per crank revolution slow the motor and raise its current.
    const comp = Math.pow(0.5 + 0.5 * Math.cos(TAU * 6 * crankPh), 3);
    const spin = smooth(clamp((t - from) / 0.07, 0, 1));
    const free = t > to ? 1 + 0.45 * smooth(clamp((t - to) / 0.06, 0, 1)) : 1;
    const f = 48 * spin * (1 - 0.13 * comp) * free; // motor rotation, Hz
    mot += f / SR;
    const env = spin * (t > to + 0.05 ? Math.exp(-(t - to - 0.05) / 0.035) : 1) * (0.75 + 0.35 * comp);
    const rot = Math.sin(TAU * mot) * 0.35;
    const mesh = Math.sin(TAU * mot * 11) + 0.45 * Math.sin(TAU * mot * 22 + 0.7) + 0.2 * Math.sin(TAU * mot * 33 + 1.3); // 11-tooth pinion
    const whine = 0.22 * Math.sin(TAU * mot * 26) + 0.12 * Math.sin(TAU * mot * 52);
    // Brushes and pinion grind: noise pulsing with the rotation and the compression load.
    const grind = R.n() * (0.55 + 0.45 * Math.sin(TAU * mot)) * (0.5 + 0.8 * comp);
    gear[i] = env * (rot + 0.45 * mesh + 0.8 * whine + 0.55 * grind);
  }
  filt(gear, biquad("hp", 60, 0.7), biquad("peak", 600, 1.2, 3), biquad("lp", 5200, 0.7));
  mixInto(out, gear, 0.42);
  return out;
}

// ---------- the three sounds ----------

/** 1. The car appears on the helipad: engine start and a short idle burble (3.2 s). */
function engineStart() {
  const dur = 3.2, n = secs(dur), catchAt = 0.6;
  const hunt = wobble(n, 1.4, 11);
  const rpm = curve(n, [[0, 230], [catchAt, 255], [catchAt + 0.07, 900, "in"], [catchAt + 0.33, 3150, "out"], [catchAt + 0.45, 3000, "smooth"], [1.85, 1190, "exp"], [2.2, 1140, "smooth"], [dur, 1150]]);
  const crank = curve(n, [[0, 0], [0.03, 235, "smooth"], [catchAt, 255]]);
  let cph = 0;
  for (let i = 0; i < n; i++) {
    if (i < secs(catchAt)) {
      // Cranking: the crank slows at each compression (six per revolution).
      rpm[i] = Math.max(1, crank[i] * (1 - 0.16 * Math.pow(0.5 + 0.5 * Math.cos(TAU * 6 * cph), 3)));
      cph += rpm[i] / 60 / SR;
    } else rpm[i] += 14 * hunt[i] * smooth(clamp((i / SR - 1.7) / 0.4, 0, 1));
  }
  const load = curve(n, [[0, 0], [catchAt, 0.0], [catchAt + 0.02, 0.95], [catchAt + 0.3, 0.95], [catchAt + 0.38, 0.04, "smooth"], [1.55, 0.04], [1.9, 0.16, "smooth"], [dur, 0.16]]);
  const fire = curve(n, [[0, 0], [catchAt - 0.001, 0], [catchAt, 1], [dur, 1]]);
  const pops = [[1.02, 0.7], [1.08, 0.45], [1.12, 0.9], [1.22, 0.4], [1.33, 0.5], [1.5, 0.25]];
  const [L, R] = v12({ dur, rpm, load, fire, seed: 1201, catchAt, pops });
  const st = starter({ dur, from: 0.0, to: catchAt + 0.02, crank: rpm, seed: 77 });
  report("engine-start", { engine: [L, R], starter: [st, st] }, { starter: [0.03, catchAt], flare: [catchAt, catchAt + 0.5], idle: [1.9, 2.3] });
  // Mix: the starter sits about 12 LU under the flare, the idle burble about 8 LU under it.
  mixInto(L, st, 0.11);
  mixInto(R, st, 0.1);
  const level = curve(n, [[0, 1], [1.45, 1], [1.9, db(3.5), "smooth"], [2.3, db(3.5)], [dur, 0, "exp"]]);
  for (let i = 0; i < n; i++) {
    L[i] *= level[i];
    R[i] *= level[i];
  }
  // Open air on the helipad: a short, soft space and nothing close by.
  const [wL, wR] = reverb([L, R], { t60: 0.9, pre: 0.024, damp: 0.5, size: 1.1, wet: 0.11, extra: 0.1 });
  const out = [mixInto(new Float32Array(wL.length), L), mixInto(new Float32Array(wR.length), R)];
  mixInto(out[0], wL);
  mixInto(out[1], wR);
  return out.map((x) => x.subarray(0, n + secs(0.1)));
}

/** 2. It starts moving: a throttle blip with overrun crackle, then the pull-away (3.3 s). */
function pullAway() {
  const dur = 3.3, n = secs(dur);
  const rpm = curve(n, [[0, 1150], [0.14, 1150], [0.4, 4950, "out"], [0.46, 4880, "smooth"], [0.84, 1750, "exp"], [0.92, 1900, "smooth"], [1.1, 2800, "smooth"], [2.2, 7300, 0.92], [2.25, 7420, "smooth"], [2.35, 5250, "smooth"], [dur, 6500]]);
  const load = curve(n, [[0, 0.16], [0.14, 0.16], [0.16, 0.98], [0.34, 0.98], [0.38, 0.02, "smooth"], [0.82, 0.02], [0.9, 0.72, "smooth"], [1.1, 0.9], [2.23, 0.96], [2.25, 0.0], [2.33, 0.0], [2.37, 0.92, "smooth"], [dur, 0.9]]);
  const fire = curve(n, [[0, 1], [2.245, 1], [2.246, 0], [2.305, 0], [2.306, 1], [dur, 1]]);
  const pops = [[0.45, 0.6], [0.5, 0.9], [0.54, 0.4], [0.6, 0.75], [0.67, 0.35], [0.76, 0.45], [2.26, 1.2], [2.29, 0.55]];
  const [L, R] = v12({ dur, rpm, load, fire, seed: 2402, pops });
  report("pull-away", { engine: [L, R] }, { blip: [0.1, 0.5], overrun: [0.42, 0.86], pull: [1.1, 2.2], shifted: [2.35, 2.8] });
  // Mix automation: the blip and overrun come up so the clip has no dead spot before the pull,
  // and the end fades with the tailpipe filter closing as the car draws ahead into the tunnel.
  const level = curve(n, [[0, 0], [0.04, db(3), "smooth"], [0.4, db(3)], [0.86, db(6), "smooth"], [1.3, 1, "smooth"], [2.6, 1], [dur, 0, "exp"]]);
  const away = curve(n, [[0, 1], [2.5, 1], [dur, 0.62, "smooth"]]);
  const tone = Float32Array.from(away, (v) => 2400 + 16000 * v * v);
  for (const x of [L, R]) {
    svf(x, tone, 0.6, "lp");
    for (let i = 0; i < n; i++) x[i] *= level[i];
  }
  // The Velocity Tunnel: hard walls, early reflections and a longer, brighter tail.
  const wet = curve(n + secs(0.15), [[0, 0.1], [2.2, 0.12], [dur, 0.2, "smooth"]]);
  const [wL, wR] = reverb([L, R], { t60: 1.35, pre: 0.012, damp: 0.28, size: 0.9, wet, early: [[0.007, 0.32, -1], [0.011, 0.28, 1], [0.019, 0.2, -1], [0.026, 0.18, 1]], extra: 0.15 });
  const out = [mixInto(new Float32Array(wL.length), L), mixInto(new Float32Array(wR.length), R)];
  mixInto(out[0], wL);
  mixInto(out[1], wR);
  return out;
}

/** A metallic click: a short noise transient into inharmonic bar modes. */
function click(buf, at, { f1, gain, decay = 0.05, pan = 0, seed }, R2) {
  const R = R2 ?? rng(seed);
  const ratios = [1, 2.756, 5.404, 8.933], amps = [1, 0.55, 0.32, 0.16];
  const n = secs(decay * 5);
  const [L, R_] = buf;
  const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
  const s0 = secs(at);
  for (let j = 0; j < n; j++) {
    const t = j / SR;
    let v = 0;
    for (let m = 0; m < 4; m++) {
      const f = f1 * ratios[m];
      if (f > SR * 0.42) continue;
      v += amps[m] * Math.sin(TAU * f * t) * Math.exp(-t / (decay / (1 + m * 0.6)));
    }
    v += 1.4 * R.n() * Math.exp(-t / 0.0007);
    if (s0 + j < L.length) {
      L[s0 + j] += v * gain * gl;
      R_[s0 + j] += v * gain * gr;
    }
  }
}

/** 3. The exploded view: whoosh, latch clicks, servo whine, air release, lock (2.3 s). */
function split() {
  const dur = 2.3, n = secs(dur);
  const R = rng(3303);
  const pair = () => [new Float32Array(n), new Float32Array(n)];
  const panGains = (pan) => [Math.cos(((pan + 1) * Math.PI) / 4), Math.sin(((pan + 1) * Math.PI) / 4)];

  // Whoosh: two decorrelated noise bands sweeping up as the parts move out, wider in stereo.
  const whoosh = pair();
  const sweep = curve(n, [[0, 240], [0.5, 2500, 1.6], [0.95, 1300, "smooth"], [dur, 900]]);
  const env = curve(n, [[0, 0], [0.42, 1, 2.2], [0.62, 0.35, "smooth"], [1.1, 0, "smooth"], [dur, 0]]);
  whoosh.forEach((x, side) => {
    for (let i = 0; i < n; i++) x[i] = R.n();
    const sw = Float32Array.from(sweep, (v, i) => v * (side ? 1.08 : 0.94) * (1 + 0.04 * Math.sin(i / 2400)));
    svf(x, sw, 1.3, "bp");
    for (let i = 0; i < n; i++) x[i] *= env[i];
  });

  // Unlock: a weighty low thump with a pitch drop, under the first latch.
  const thump = pair();
  let ph = 0;
  for (let j = 0; j < secs(0.35); j++) {
    const t = j / SR;
    ph += (44 + 30 * Math.exp(-t / 0.05)) / SR;
    const v = Math.sin(TAU * ph) * Math.exp(-t / 0.075) * (1 - Math.exp(-t / 0.002));
    thump[0][secs(0.32) + j] = thump[1][secs(0.32) + j] = v;
  }

  // Latch clicks cascading outward, alternating sides.
  const latches = pair();
  [[0.33, -0.2, 2900], [0.37, 0.5, 3400], [0.405, -0.6, 2500], [0.435, 0.7, 3800], [0.46, -0.75, 3100], [0.48, 0.8, 2700]].forEach(([t, pan, f1], i) =>
    click(latches, t, { f1: f1 * (1 + 0.03 * R.n()), gain: 1 - i * 0.07, decay: 0.045, pan }, R),
  );

  // Two servos spin up and settle, slightly detuned, one per side; gear mesh as sidebands.
  const servos = pair(), ratchet = pair();
  for (const [pan, f0, f1, seed] of [[-0.45, 360, 880, 41], [0.45, 430, 1030, 42]]) {
    const pitch = curve(n, [[0, f0], [0.42, f0], [0.62, f1 * 0.92, "out"], [1.12, f1, "lin"], [1.32, f1 * 0.62, "in"]]);
    const amp = curve(n, [[0, 0], [0.4, 0], [0.48, 1, "smooth"], [1.18, 0.85], [1.34, 0, "smooth"], [dur, 0]]);
    const load = wobble(n, 18, seed);
    const x = new Float32Array(n);
    let p = 0;
    for (let i = secs(0.38); i < secs(1.4); i++) {
      p += (pitch[i] * (1 + 0.006 * load[i])) / SR;
      let v = 0;
      for (let h = 1; h <= 7; h++) v += Math.sin(TAU * p * h) / Math.pow(h, 1.15);
      x[i] = v * (1 + 0.28 * Math.sin((TAU * p) / 6.5)) * amp[i];
    }
    filt(x, biquad("hp", 300, 0.7), biquad("peak", 2300, 1.4, 5), biquad("lp", 7000, 0.7));
    const [gl, gr] = panGains(pan);
    mixInto(servos[0], x, gl);
    mixInto(servos[1], x, gr);
    // The output gears tick as they turn (a tooth every 1/24 of the motor's pitch period).
    const tk = new Float32Array(n);
    let tph = 0;
    for (let i = secs(0.4); i < secs(1.36); i++) {
      tph += pitch[i] / 24 / SR;
      if (tph >= 1) {
        tph -= 1;
        const a = amp[i] * (0.6 + 0.4 * R.u());
        for (let j = 0; j < 40 && i + j < n; j++) tk[i + j] += a * R.n() * Math.exp(-j / 7);
      }
    }
    filt(tk, biquad("bp", 4300, 1.6));
    mixInto(ratchet[0], tk, gl);
    mixInto(ratchet[1], tk, gr);
  }

  // Air release as the parts lift.
  const air = pair();
  for (const x of air) {
    for (let i = secs(0.36); i < n; i++) {
      const t = i / SR - 0.36;
      x[i] = R.n() * (1 - Math.exp(-t / 0.015)) * Math.exp(-t / 0.2);
    }
    filt(x, biquad("hp", 2600, 0.7), biquad("bp", 6200, 0.7));
  }

  // Parts lock in their exploded positions.
  const lock = pair();
  click(lock, 1.35, { f1: 2200, gain: 1, decay: 0.07, pan: -0.3 }, R);
  click(lock, 1.42, { f1: 2650, gain: 0.85, decay: 0.08, pan: 0.35 }, R);

  // Balance (dB): the whoosh and thump carry it, clicks and servos sit on top, air underneath.
  const layers = { whoosh: [whoosh, -6], thump: [thump, -3], latches: [latches, -9], servos: [servos, -23], ratchet: [ratchet, 3], air: [air, -14], lock: [lock, -11] };
  const L = new Float32Array(n), Rr = new Float32Array(n);
  for (const [x, g] of Object.values(layers)) {
    mixInto(L, x[0], db(g));
    mixInto(Rr, x[1], db(g));
  }
  report("split", Object.fromEntries(Object.entries(layers).map(([k, [x, g]]) => [k, x.map((c) => Float32Array.from(c, (v) => v * db(g)))])));
  for (const x of [L, Rr]) filt(x, biquad("hp", 28, 0.7));
  // A dry studio floor: short and close.
  const [wL, wR] = reverb([L, Rr], { t60: 0.7, pre: 0.014, damp: 0.42, size: 0.75, wet: 0.17, extra: 0 });
  mixInto(L, wL);
  mixInto(Rr, wR);
  return [L, Rr];
}

// ---------- output ----------

function wav24([L, R]) {
  const n = L.length, data = Buffer.alloc(n * 6);
  for (let i = 0; i < n; i++)
    for (const [c, x] of [[0, L], [1, R]]) {
      const v = Math.round(clamp(x[i], -1, 1 - 1 / 8388608) * 8388608);
      data.writeIntLE(v, i * 6 + c * 3, 3);
    }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 6, 28);
  h.writeUInt16LE(6, 32);
  h.writeUInt16LE(24, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

const SOUNDS = [
  { key: "start", file: "engine-start", render: engineStart, target: -20 },
  { key: "pullAway", file: "pull-away", render: pullAway, target: -19 },
  { key: "split", file: "split", render: split, target: -21 },
];

const work = mkdtempSync(join(tmpdir(), "hero-sounds-"));
const pub = join(ROOT, "public/sounds");
mkdirSync(pub, { recursive: true });
if (OUT) mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const s of SOUNDS) {
  const audio = s.render();
  const info = master(audio, { target: s.target });
  const wavPath = join(work, `${s.file}.wav`), mp3Path = join(work, `${s.file}.mp3`);
  writeFileSync(wavPath, wav24(audio));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wavPath, "-c:a", "libmp3lame", "-b:a", "160k", "-map_metadata", "-1", "-id3v2_version", "0", "-write_id3v1", "0", mp3Path]);
  const bytes = readFileSync(mp3Path);
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  for (const f of readdirSync(pub)) if (f.startsWith(`${s.file}.`) && f.endsWith(".mp3")) rmSync(join(pub, f));
  writeFileSync(join(pub, `${s.file}.${hash}.mp3`), bytes);
  manifest[s.key] = `/sounds/${s.file}.${hash}.mp3`;
  if (OUT) {
    copyFileSync(mp3Path, join(OUT, `${s.file}.mp3`));
    copyFileSync(wavPath, join(OUT, `${s.file}.wav`));
  }
  console.log(`${s.file}: ${(audio[0].length / SR).toFixed(2)} s, ${(bytes.length / 1024).toFixed(1)} KB, ${lufs(audio).toFixed(1)} LUFS, gain ${info.gainDb.toFixed(1)} dB, limited ${info.limitedMs.toFixed(0)} ms (max ${info.maxReductionDb.toFixed(1)} dB)`);
}
rmSync(work, { recursive: true, force: true });

writeFileSync(
  join(ROOT, "src/components/home/heroSoundFiles.ts"),
  `// Generated by tools/render-hero-sounds.mjs; do not edit. Synthesized, no third-party audio (public/sounds/LICENSES.md).
export const heroSoundFiles = {
  start: "${manifest.start}",
  pullAway: "${manifest.pullAway}",
  split: "${manifest.split}",
} as const;
`,
);
